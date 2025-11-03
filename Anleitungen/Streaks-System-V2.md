# Streaks System V2 - Ein Eintrag pro User

**Datum:** 3. November 2025  
**Status:** ✅ Implementiert

## Überblick

Das Streak-System wurde von einer **goal-spezifischen** zu einer **user-basierten** Struktur umgestellt.

### Vorher (V1)
- ❌ Ein Streak-Eintrag **pro User UND Goal** (user_id + goal_id)
- ❌ Mehrere Streak-Einträge pro User möglich
- ❌ Beim Schnellsparen wurde `goal_id = NULL` gesetzt

### Jetzt (V2)
- ✅ **Ein** Streak-Eintrag pro User (nur user_id)
- ✅ `goal_id` zeigt auf das Ziel, für das **heute** gespart wurde
- ✅ Bei mehreren Saves am selben Tag: `goal_id` wird geupdated (letztes Ziel gewinnt)
- ✅ Schnellsparen setzt automatisch die `goal_id` des Favoriten-Ziels

## Datenbank-Änderungen

### Schema-Update

**Vorher:**
```sql
CREATE UNIQUE INDEX `uq_streak_user_goal` ON `streaks` (`user_id`, `goal_id`);
CREATE INDEX `streaks_index_18` ON `streaks` (`user_id`);
```

**Jetzt:**
```sql
CREATE UNIQUE INDEX `uq_streak_user` ON `streaks` (`user_id`);
-- Index streaks_index_18 entfernt (überflüssig durch UNIQUE constraint)
```

### Migration ausführen

```bash
# Backup erstellen (empfohlen!)
mysqldump syfte streaks > streaks_backup_$(date +%Y%m%d).sql

# Migration ausführen
mysql -u USERNAME -p DATABASE_NAME < db/migrations/2025-11-03_streaks_one_per_user.sql
```

## Code-Änderungen

### 1. `server/utils/streaks.ts`

#### `updateUserStreak(userId, goalId)`
- ✅ Nimmt jetzt **immer** eine `goalId` entgegen (nicht mehr optional)
- ✅ Sucht nur noch nach `user_id` (nicht mehr nach `user_id + goal_id`)
- ✅ Wenn heute bereits gespart: **nur** `goal_id` wird geupdated (kein Increment)
- ✅ Pro Tag nur **ein** Increment von `current_count`

**Vorher:**
```typescript
export async function updateUserStreak(userId: number, goalId?: number)
// Query: WHERE user_id = X AND goal_id = Y (oder IS NULL)
```

**Jetzt:**
```typescript
export async function updateUserStreak(userId: number, goalId: number)
// Query: WHERE user_id = X (nur user_id!)
```

#### `getCurrentStreak(userId)`
- ✅ `goalId`-Parameter entfernt
- ✅ Return-Type erweitert um `goalId: number | null`
- ✅ Gibt zurück: `{ current, longest, lastSaveDate, goalId }`

### 2. API-Endpunkte aktualisiert

Alle folgenden Endpunkte wurden angepasst, um nur noch **einen** Streak-Eintrag pro User zu erwarten:

#### ✅ `server/api/dashboard.get.ts`
- Entfernt: `isNull(streaks.goalId)` Bedingung
- Query: `WHERE eq(streaks.userId, payload.userId)`

#### ✅ `server/api/auth/me.get.ts`
- Entfernt: `isNull(streaks.goalId)` Bedingung
- Query: `WHERE eq(streaks.userId, payload.userId)`

#### ✅ `server/api/analytics/dashboard.get.ts`
- Entfernt: `reduce()` über mehrere Streaks
- Verwendet: Einzelner Streak-Eintrag mit `currentStreak?.currentCount || 0`

#### ✅ `server/api/goals/[id].get.ts`
- Entfernt: `isNull(streaks.goalId)` Bedingung
- Query: `WHERE eq(streaks.userId, payload.userId)`

#### ✅ `server/api/friends/index.get.ts`
- Entfernt: `isNull(streaks.goalId)` Bedingung
- Query: `WHERE or(...friendIds.map(id => eq(streaks.userId, id)))`

#### ✅ `server/api/streaks/current.get.ts`
- Entfernt: `reduce()` über mehrere Streaks
- Entfernt: `byGoal` Array im Response
- Neu: `currentGoalId` und `lastSaveDate` im Response

#### ✅ `server/api/streaks/history.get.ts`
- Entfernt: Array-Iteration über mehrere Streaks
- Return: Einzelner Streak mit `statistics` Object

#### ✅ `server/api/streaks/check-new.post.ts`
- Entfernt: `sql${streaks.goalId} IS NULL` Bedingung
- Query: `WHERE eq(streaks.userId, payload.userId)`

### 3. Unverändert (bereits korrekt)

#### ✅ `server/api/savings/add-with-action.post.ts`
- Ruft bereits `updateUserStreak(payload.userId, goalId)` auf
- Übergibt korrekt die `goalId` des Ziels, für das gespart wurde

#### ✅ `server/api/savings/quick-add.post.ts`
- Ruft bereits `updateUserStreak(payload.userId, user.favoriteGoalId)` auf
- Übergibt korrekt die `favoriteGoalId` (Schnellsparen-Ziel)

## Verhalten

### Szenario 1: Erster Sparvorgang des Tages
```typescript
// User spart für Goal #5
updateUserStreak(userId: 1, goalId: 5)

// DB-Eintrag:
{
  user_id: 1,
  goal_id: 5,
  current_count: 1 (oder +1 falls gestern auch gespart),
  longest_count: 1 (oder höher),
  last_save_date: '2025-11-03'
}
```

### Szenario 2: Zweiter Sparvorgang am selben Tag (anderes Ziel)
```typescript
// User spart später am selben Tag für Goal #8
updateUserStreak(userId: 1, goalId: 8)

// DB-Eintrag (UPDATE):
{
  user_id: 1,
  goal_id: 8,  // ← Nur goal_id ändert sich!
  current_count: 1,  // ← Bleibt gleich (kein Increment)
  longest_count: 1,
  last_save_date: '2025-11-03'
}
```

### Szenario 3: Schnellsparen
```typescript
// Dashboard: User klickt auf Schnellspar-Aktion
// → quick-add.post.ts holt automatisch favoriteGoalId
updateUserStreak(userId: 1, goalId: user.favoriteGoalId)

// DB-Eintrag:
{
  user_id: 1,
  goal_id: 7,  // ← Favoriten-Ziel
  current_count: 1,
  longest_count: 1,
  last_save_date: '2025-11-03'
}
```

## Vorteile der neuen Struktur

✅ **Einfacheres Datenmodell:** Ein Eintrag pro User statt vieler Einträge  
✅ **Konsistente Streak-Zählung:** Ein Spardurchgang = ein Tag (unabhängig vom Ziel)  
✅ **Bessere Performance:** Weniger DB-Einträge, schnellere Queries  
✅ **Korrekte goal_id:** Zeigt immer auf das zuletzt gesparte Ziel  
✅ **Schnellsparen funktioniert:** Favoriten-Ziel wird automatisch zugeordnet  

## Testing

Nach der Migration sollten folgende Szenarien getestet werden:

1. **Neuer Streak starten:**
   - [ ] User spart zum ersten Mal → `current_count = 1`
   
2. **Streak fortsetzen:**
   - [ ] User spart am nächsten Tag → `current_count = 2`
   
3. **Mehrfach am selben Tag:**
   - [ ] User spart 2x am selben Tag für verschiedene Ziele
   - [ ] `current_count` bleibt gleich
   - [ ] `goal_id` zeigt auf das zuletzt gesparte Ziel
   
4. **Schnellsparen:**
   - [ ] User nutzt Schnellsparen auf Dashboard
   - [ ] `goal_id` wird auf Favoriten-Ziel gesetzt
   
5. **Streak unterbrechen:**
   - [ ] User spart 1 Tag nicht
   - [ ] Beim nächsten Sparen: Streak-Eintrag wird gelöscht und neu gestartet

## Rollback

Falls ein Rollback nötig ist:

```bash
# 1. Backup wiederherstellen
mysql -u USERNAME -p DATABASE_NAME < streaks_backup_DATUM.sql

# 2. Alten Index wiederherstellen
mysql -u USERNAME -p DATABASE_NAME << EOF
DROP INDEX IF EXISTS uq_streak_user ON streaks;
CREATE UNIQUE INDEX uq_streak_user_goal ON streaks (user_id, goal_id);
CREATE INDEX streaks_index_18 ON streaks (user_id);
EOF

# 3. Git-Commit rückgängig machen
git revert HEAD
```

## Offene Punkte

- [ ] Tests aktualisieren (`tests/streaks/streaks.test.ts`)
- [ ] Frontend anpassen (falls `byGoal` Array verwendet wurde)
- [ ] Monitoring: Prüfen ob alle Streak-Queries korrekt laufen

## Weitere Dokumentation

- Siehe auch: `Anleitungen/Streaks-System.md` für allgemeine Streak-Dokumentation
- DB-Schema: `db/syfte.sql`
- Migration: `db/migrations/2025-11-03_streaks_one_per_user.sql`
