# Streaks Duplikate Fix - Anleitung

## Problem
1. **Duplikate**: Durch fehlendes UNIQUE Constraint in der Datenbank konnten mehrere Streak-Einträge pro User entstehen
2. **NULL goal_id**: Alle Streaks wurden mit `goal_id = NULL` gespeichert statt mit der spezifischen Ziel-ID

## Ursache
1. **Fehlendes DB Constraint**: Der UNIQUE Index `uq_streak_user_goal` war in `schema.ts` nicht definiert
2. **Race Conditions**: Bei schnellen aufeinanderfolgenden Sparvorgängen konnten Duplikate entstehen
3. **INSERT statt UPSERT**: Die Logik verwendete normale INSERTs ohne Duplikat-Schutz
4. **Fehlende goal_id**: API-Endpunkte übergaben keine `goalId` an `updateUserStreak()`

## Lösung

### 1. Schema-Fix (bereits erledigt)
`server/utils/database/schema.ts` wurde aktualisiert:
```typescript
export const streaks = mysqlTable('streaks', {
  // ... Felder
}, (table) => ({
  userGoalUnique: uniqueIndex('uq_streak_user_goal').on(table.userId, table.goalId)
}));
```

### 2. Logik-Fix (bereits erledigt)
`server/utils/streaks.ts` verwendet jetzt MySQL UPSERT:
```sql
INSERT INTO streaks (user_id, goal_id, current_count, longest_count, last_save_date)
VALUES (?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  current_count = ?,
  longest_count = ?,
  last_save_date = ?
```

### 3. API-Endpunkte aktualisiert (bereits erledigt)

**`server/api/savings/add-with-action.post.ts`:**
```typescript
// Vorher: updateUserStreak(payload.userId) → goal_id = NULL
// Jetzt:
const streakUpdate = await updateUserStreak(payload.userId, goalId);
```

**`server/api/savings/quick-add.post.ts`:**
```typescript
// Vorher: Direkte DB-Manipulation (veraltet)
// Jetzt: Korrekte Streak-Funktion mit favoriteGoalId
const streakUpdate = await updateUserStreak(payload.userId, user.favoriteGoalId);
```

### 3. Datenbank-Migration (MANUELL AUSFÜHREN)

#### Option A: Via MySQL Client
```bash
mysql -u USERNAME -p DATABASE_NAME < db/migrations/002_fix_streaks_duplicates.sql
```

#### Option B: Via MySQL Workbench / phpMyAdmin
1. Öffne die Datei `db/migrations/002_fix_streaks_duplicates.sql`
2. Kopiere den SQL-Code
3. Führe ihn in deinem MySQL-Client aus

#### Option C: Via Node.js Script
Erstelle ein temporäres Script `run-migration.js`:
```javascript
import mysql from 'mysql2/promise';
import fs from 'fs';

const connection = await mysql.createConnection({
  host: 'localhost',
  user: 'DEIN_USER',
  password: 'DEIN_PASSWORD',
  database: 'syfte'
});

const sql = fs.readFileSync('db/migrations/002_fix_streaks_duplicates.sql', 'utf8');
await connection.query(sql);
console.log('Migration erfolgreich!');
await connection.end();
```

Ausführen:
```bash
node run-migration.js
```

## Migration Script Erklärung

### Schritt 1: Duplikate löschen
```sql
DELETE s1 FROM streaks s1
INNER JOIN streaks s2 
WHERE 
  s1.user_id = s2.user_id 
  AND (s1.goal_id = s2.goal_id OR (s1.goal_id IS NULL AND s2.goal_id IS NULL))
  AND s1.id < s2.id;
```
- Findet alle Duplikate (gleiche user_id + goal_id)
- Behält nur den **neuesten** Eintrag (höchste ID)
- Löscht alle älteren Duplikate

### Schritt 2: NULL goal_id Einträge bereinigen
```sql
DELETE FROM streaks WHERE goal_id IS NULL;
```
- Löscht alle alten Streak-Einträge ohne goal_id
- Diese wurden vor dem Fix erstellt und sind nicht mehr relevant
- Ab jetzt wird **immer** eine goal_id gesetzt

### Schritt 3: UNIQUE Index erstellen
```sql
CREATE UNIQUE INDEX IF NOT EXISTS `uq_streak_user_goal` ON `streaks` (`user_id`, `goal_id`);
```
- Erstellt UNIQUE Constraint auf (user_id, goal_id)
- Verhindert zukünftige Duplikate auf DB-Ebene
- `IF NOT EXISTS` verhindert Fehler falls Index bereits existiert

## Verifizierung

### Nach der Migration prüfen:
```sql
-- Sollte keine Zeilen zurückgeben (keine Duplikate)
SELECT user_id, goal_id, COUNT(*) as count
FROM streaks
GROUP BY user_id, goal_id
HAVING count > 1;

-- Sollte keine Zeilen zurückgeben (keine NULL goal_id mehr)
SELECT * FROM streaks WHERE goal_id IS NULL;

-- Zeige alle Streaks (sollten alle eine goal_id haben)
SELECT * FROM streaks;
```

### Index prüfen:
```sql
SHOW INDEX FROM streaks WHERE Key_name = 'uq_streak_user_goal';
```

## Testing

### Test 1: Mehrfaches Sparen am selben Tag
1. Spare 3x hintereinander am selben Tag zu einem Ziel
2. Prüfe DB: `SELECT * FROM streaks WHERE user_id = ?`
3. ✅ Erwartung: Nur **1 Eintrag** pro User/Goal mit korrekter goal_id

### Test 2: Streak-Fortsetzung
1. Tag 1: Spare → Streak = 1
2. Tag 2: Spare → Streak = 2
3. Prüfe DB: Weiterhin nur 1 Eintrag mit `current_count = 2` und goal_id gesetzt

### Test 3: Streak-Unterbrechung
1. Tag 1: Spare → Streak = 1
2. Tag 3 (Tag 2 ausgelassen): Spare → Streak = 1
3. Prüfe DB: Alter Eintrag wurde gelöscht, neuer Eintrag mit count = 1 und goal_id

### Test 4: Verschiedene Ziele
1. Spare zu Ziel A → Streak-Eintrag mit goal_id = A
2. Spare zu Ziel B → Streak-Eintrag mit goal_id = B
3. Prüfe DB: **2 separate Einträge** (ein Streak pro Ziel)

## Rollback (Falls nötig)

Falls Probleme auftreten, kannst du den Index wieder entfernen:
```sql
DROP INDEX `uq_streak_user_goal` ON `streaks`;
```

**Hinweis:** Dies erlaubt wieder Duplikate! Nur im Notfall verwenden.

## Wichtige Hinweise

1. **Backup erstellen**: Vor der Migration immer DB-Backup machen!
   ```bash
   mysqldump -u USERNAME -p DATABASE_NAME > backup_before_migration.sql
   ```

2. **Production**: Teste die Migration erst in Development/Staging

3. **Downtime**: Die Migration sollte sehr schnell sein (<1 Sekunde), außer du hast Millionen von Einträgen

4. **Monitoring**: Nach der Migration die Logs prüfen auf Fehler

## Geänderte Dateien

1. ✅ `server/utils/database/schema.ts` - UNIQUE Index hinzugefügt
2. ✅ `server/utils/streaks.ts` - UPSERT Logik implementiert
3. ✅ `server/api/savings/add-with-action.post.ts` - goal_id wird jetzt übergeben
4. ✅ `server/api/savings/quick-add.post.ts` - Nutzt updateUserStreak() mit favoriteGoalId
5. ✅ `db/migrations/002_fix_streaks_duplicates.sql` - Migrations-Script (löscht NULL goal_id)
6. ✅ `Anleitungen/Streaks-System.md` - Dokumentation aktualisiert

## Wichtige Änderungen im Detail

### Vor dem Fix:
```typescript
// add-with-action.post.ts
const streakUpdate = await updateUserStreak(payload.userId);
// ❌ Kein goalId → goal_id = NULL in DB

// quick-add.post.ts
await db.update(streaks).set({ currentCount: sql`current_count + 1` })
// ❌ Direkte DB-Manipulation, veraltete Logik
```

### Nach dem Fix:
```typescript
// add-with-action.post.ts
const streakUpdate = await updateUserStreak(payload.userId, goalId);
// ✅ goalId wird übergeben → goal_id gesetzt

// quick-add.post.ts
const streakUpdate = await updateUserStreak(payload.userId, user.favoriteGoalId);
// ✅ Nutzt korrekte Streak-Funktion mit favoriteGoalId
```

## Status

- [x] Code-Fix implementiert (Schema, Streaks-Logik, UPSERT)
- [x] API-Endpunkte aktualisiert (goal_id wird jetzt übergeben)
- [x] Migration Script erstellt (inkl. NULL goal_id Cleanup)
- [ ] **Migration ausführen** (MANUELL - siehe oben)
- [ ] Verifizierung nach Migration (keine Duplikate, keine NULL goal_id)
- [ ] Testing in Development (mehrfaches Sparen testen)
- [ ] Testing in Production

## Erwartetes Verhalten nach dem Fix

### Datenbank-Struktur:
```
streaks Tabelle:
+----+---------+---------+---------------+---------------+----------------+
| id | user_id | goal_id | current_count | longest_count | last_save_date |
+----+---------+---------+---------------+---------------+----------------+
| 1  | 42      | 5       | 3             | 7             | 2024-11-03     |
| 2  | 42      | 8       | 1             | 1             | 2024-11-03     |
| 3  | 99      | 12      | 5             | 5             | 2024-11-03     |
+----+---------+---------+---------------+---------------+----------------+
```

**Wichtig:**
- ✅ Jeder User kann **mehrere** Streaks haben (ein Streak pro Ziel)
- ✅ Pro User/Goal-Kombination gibt es **maximal 1** Eintrag
- ✅ Keine NULL goal_id Werte mehr
- ✅ Keine Duplikate möglich (UNIQUE Index)

## Support

Bei Problemen:
1. Logs prüfen: `console.log` in `server/utils/streaks.ts`
2. DB-Abfrage: `SELECT * FROM streaks WHERE user_id = ?`
3. Index prüfen: `SHOW INDEX FROM streaks`
