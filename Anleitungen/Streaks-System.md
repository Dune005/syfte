# Streaks-System Anleitung

## Übersicht
Das Streaks-System motiviert Nutzer, täglich zu sparen, indem es ihre Spar-Serien (aufeinanderfolgende Tage mit Sparvorgängen) zählt und visuell belohnt.

## Funktionsweise

### 1. Streak-Zählung
- **Streak startet bei 1**: Beim ersten Sparvorgang wird ein Streak von 1 Tag erstellt
- **Streak erhöht sich**: Spart der Nutzer am Folgetag erneut, erhöht sich der Streak um +1
- **Streak wird zurückgesetzt**: Wird ein Tag übersprungen (kein Sparvorgang), beginnt der Streak wieder bei 1
- **Längster Streak**: Das System speichert den bisher längsten Streak des Nutzers

### 2. Tägliche Regel
- **Pro Tag zählt nur der erste Sparvorgang**: Mehrere Sparvorgänge am selben Tag erhöhen den Streak nicht
- **Datum-basiert**: Es zählt das Kalenderdatum (0:00 - 23:59 Uhr)
- **Zeitzone**: Server-Zeit (wichtig für Mitternachts-Übergang)

### 3. Beispiel-Szenario

```
Tag 1 (Montag):
- 10:00 Uhr: Spare 5 CHF → Streak = 1 ✅
- 15:00 Uhr: Spare 3 CHF → Streak bleibt 1 (gleicher Tag)

Tag 2 (Dienstag):
- 08:00 Uhr: Spare 4 CHF → Streak = 2 ✅

Tag 3 (Mittwoch):
- Kein Sparvorgang → Streak wird zurückgesetzt

Tag 4 (Donnerstag):
- 12:00 Uhr: Spare 6 CHF → Streak = 1 ✅ (Neustart)

Tag 5 (Freitag):
- 09:00 Uhr: Spare 2 CHF → Streak = 2 ✅
```

## Technische Implementierung

### Datenbank-Schema
**Tabelle: `streaks`**
- `userId`: Benutzer-ID (Foreign Key)
- `goalId`: Optional - Ziel-spezifischer Streak (NULL = globaler Streak)
- `currentCount`: Aktueller Streak-Zähler
- `longestCount`: Längster jemals erreichter Streak
- `lastSaveDate`: Datum des letzten Sparvorgangs

### ⚡ Optimierte Streak-Verwaltung (Stand: Nov 2024)

**Wichtige Änderungen:**

1. **Nur 1 DB-Eintrag pro Tag**
   - Früher: Bei jedem Sparvorgang wurde geprüft und geschrieben
   - Jetzt: Wenn `lastSaveDate` = heute → **KEINE DB-Operation**
   - Reduziert unnötige DB-Zugriffe bei mehrfachem Sparen am Tag

2. **Automatisches Cleanup bei Streak-Unterbrechung**
   - Wenn ein Tag ausgelassen wurde (Streak unterbrochen)
   - Werden **ALLE Streak-Einträge des Users gelöscht**
   - Rationale: Alte Daten sind irrelevant, User startet komplett neu
   - Spart Speicherplatz und hält Tabelle schlank

3. **UNIQUE Constraint & UPSERT**
   - **DB-Ebene**: UNIQUE Index auf `(user_id, goal_id)` verhindert Duplikate
   - **Code-Ebene**: MySQL UPSERT (`INSERT ... ON DUPLICATE KEY UPDATE`)
   - Schützt vor Race Conditions bei parallelen Requests
   - Garantiert: **Maximal 1 Streak-Eintrag pro User/Goal**

4. **Effiziente Logik-Flow:**
   ```typescript
   // 1. Hole Streak-Record
   const streakRecord = await db.select().from(streaks)...
   
   // 2. Wenn heute bereits gespart → RETURN (keine DB-Op)
   if (isSameDay(streakRecord.lastSaveDate, today)) {
     return { currentStreak, longestStreak, isNewRecord: false }
   }
   
   // 3. Wenn Streak unterbrochen → DELETE alle User-Streaks
   if (!isSameDay(streakRecord.lastSaveDate, yesterday)) {
     await db.delete(streaks).where(eq(streaks.userId, userId))
     // Neuer Eintrag wird gleich erstellt
   }
   
   // 4. Streak fortsetzen oder neu starten (mit UPSERT)
   await db.execute(sql`
     INSERT INTO streaks (user_id, goal_id, current_count, longest_count, last_save_date)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       current_count = ?,
       longest_count = ?,
       last_save_date = ?
   `)
   ```

**Performance-Vorteile:**
- ✅ Weniger DB-Writes (nur 1x pro Tag statt bei jedem Sparvorgang)
- ✅ Kleinere `streaks`-Tabelle (Auto-Cleanup bei Unterbrechung)
- ✅ Schnellere Abfragen (weniger Einträge)
- ✅ Keine redundanten Daten
- ✅ **Keine Duplikate möglich** (DB + Code Schutz)

**Migration erforderlich:**
Wenn du bereits Duplikate in der DB hast, führe die Migration aus:
```bash
mysql -u USER -p DATABASE < db/migrations/002_fix_streaks_duplicates.sql
```
Details: `Anleitungen/Streaks-Duplikate-Fix.md`

### API-Endpunkte

#### 1. `/api/streaks/current` (GET)
**Zweck:** Laden der aktuellen Streak-Daten

**Antwort:**
```json
{
  "success": true,
  "streaks": {
    "current": 5,
    "longest": 12,
    "weekData": [true, true, false, true, true, false, false],
    "byGoal": [...]
  }
}
```

**weekData-Format:**
- Array mit 7 Boolean-Werten [Mo, Di, Mi, Do, Fr, Sa, So]
- `true` = an diesem Tag gespart
- `false` = nicht gespart
- Zeigt die aktuelle Woche (Montag bis Sonntag)

#### 2. `/api/streaks/check-new` (POST)
**Zweck:** Prüft ob Streak-Popup angezeigt werden soll

**Logik:**
1. Prüft Cookie `streak_popup_shown_{userId}`
2. Wenn Cookie existiert und Datum = heute → kein Popup
3. Wenn kein Cookie oder Cookie abgelaufen → Popup anzeigen
4. Setzt Cookie mit Ablauf um Mitternacht

**Antwort:**
```json
{
  "success": true,
  "showPopup": true,
  "currentStreak": 5,
  "longestStreak": 12,
  "isNewRecord": false
}
```

#### 3. Streak-Update via `/api/savings/add-with-action` (POST)
**Automatisch:** Jeder Sparvorgang triggert `updateUserStreak()` in `server/utils/streaks.ts`

**Update-Logik:**
```typescript
// Prüfe lastSaveDate
if (lastSaveDate === gestern) {
  currentCount++ // Streak fortsetzen
} else if (lastSaveDate === heute) {
  // Keine Änderung (bereits heute gespart)
} else {
  currentCount = 1 // Streak zurücksetzen
}

// Längsten Streak aktualisieren
longestCount = Math.max(longestCount, currentCount)
```

### Frontend-Komponente

#### StreakPopup.vue
**Props:**
- `show: boolean` - Popup-Sichtbarkeit
- `streakCount: number` - Aktuelle Streak-Anzahl
- `weekData: boolean[]` - 7-Tage Übersicht

**Design-Features:**
- Flamme hinter der Zahl (größer, z-index layering)
- Weiße Zahl mit türkiser Kontur (5px stroke)
- Wochenansicht mit Lucide Icons (CheckCircle2 / Circle)
- Animationen: Flammen-Flackern, Zahl Pop-in, Day Pop-in
- Responsive für Mobile (414px, 360px)

**Integration in Dashboard:**
```vue
<StreakPopup
  :show="showStreakPopup"
  :streak-count="currentStreakData.count"
  :week-data="currentStreakData.weekData"
  @close="closeStreakPopup"
/>
```

**Trigger-Logik:**
```typescript
// Nach erfolgreichem Sparvorgang
await addActionToGoal(actionId, goalId)
// → Ruft checkAndShowStreakPopup() auf
// → API-Call zu /api/streaks/check-new
// → Wenn showPopup: true → Popup wird angezeigt
```

## Popup-Anzeige-Regeln

### Wann wird das Popup ANGEZEIGT?
✅ **Erster Sparvorgang des Tages**
- Cookie existiert nicht oder ist abgelaufen
- Streak >= 1 (inkl. Neustart)
- lastSaveDate = heute

### Wann wird das Popup NICHT angezeigt?
❌ **Mehrfache Sparvorgänge am selben Tag**
- Cookie `streak_popup_shown_{userId}` existiert mit heutigem Datum

❌ **Kein Streak vorhanden**
- Noch nie gespart (kein Streak-Record)

❌ **Heute noch nicht gespart**
- lastSaveDate ≠ heute

## Cookie-Management

**Cookie-Name:** `streak_popup_shown_{userId}`

**Eigenschaften:**
- **Wert:** Aktuelles Datum (YYYY-MM-DD)
- **Expires:** Nächster Tag um 00:00 Uhr
- **HttpOnly:** true (Sicherheit)
- **SameSite:** lax
- **Path:** /

**Ablauf:**
1. User spart um 10:00 Uhr → Popup angezeigt, Cookie gesetzt
2. User spart um 15:00 Uhr → Cookie existiert → kein Popup
3. Um 00:00 Uhr → Cookie läuft ab
4. Nächster Tag 09:00 Uhr → Cookie weg → Popup wird wieder angezeigt

## Wochenansicht-Berechnung

**Backend-Logik** (`/api/streaks/current.get.ts`):
```typescript
// Aktuelle Woche (Mo-So) berechnen
const today = new Date()
const todayDayOfWeek = today.getDay() // 0=Sonntag, 1=Montag, ...
const mondayOffset = todayDayOfWeek === 0 ? -6 : 1 - todayDayOfWeek
const monday = new Date(today)
monday.setDate(today.getDate() + mondayOffset)

// Savings der letzten 7 Tage laden
const recentSavings = await db.select()
  .from(savings)
  .where(eq(savings.userId, userId))
  .groupBy(sql`DATE(${savings.createdAt})`)

// Boolean-Array erstellen [Mo, Di, Mi, Do, Fr, Sa, So]
const weekData = [false, false, false, false, false, false, false]
for (let i = 0; i < 7; i++) {
  const dayDate = new Date(monday)
  dayDate.setDate(monday.getDate() + i)
  const hasSaving = recentSavings.some(s => isSameDay(s.createdAt, dayDate))
  weekData[i] = hasSaving
}
```

## Achievements-Integration

**Streak-basierte Achievements:**
- "3 Tage in Folge" → Streak >= 3
- "1 Woche Streak" → Streak >= 7
- "1 Monat Streak" → Streak >= 30

**Prüfung:** Automatisch via `/api/achievements/check` nach jedem Sparvorgang

## Testing-Szenarien

### Test 1: Neuer Nutzer
1. Registrieren
2. Ersten Sparvorgang → Streak = 1, Popup ✅
3. Zweiten Sparvorgang am selben Tag → Streak = 1, Popup ❌

### Test 2: Streak-Fortsetzung
1. Tag 1: Sparen → Streak = 1
2. Tag 2: Sparen → Streak = 2, Popup ✅
3. Tag 3: Sparen → Streak = 3, Popup ✅

### Test 3: Streak-Reset
1. Tag 1: Sparen → Streak = 1
2. Tag 2: Sparen → Streak = 2
3. Tag 3: NICHT sparen
4. Tag 4: Sparen → Streak = 1, Popup ✅ (Neustart)

### Test 4: Mitternachts-Übergang
1. 23:55 Uhr: Sparen → Streak = 1, Popup ✅, Cookie gesetzt
2. 00:05 Uhr (nächster Tag): Sparen → Streak = 2, Cookie abgelaufen → Popup ✅

## Troubleshooting

### Problem: Popup wird nicht angezeigt
**Mögliche Ursachen:**
- Cookie noch gültig (heute schon Popup gesehen)
- Kein Streak vorhanden (currentCount = 0)
- lastSaveDate ist nicht heute

**Lösung:**
- Browser-Cookies prüfen und `streak_popup_shown_{userId}` löschen
- DB prüfen: `SELECT * FROM streaks WHERE userId = X AND goalId IS NULL`

### Problem: Streak zählt nicht hoch
**Mögliche Ursachen:**
- Mehrfache Sparvorgänge am gleichen Tag
- `updateUserStreak()` wird nicht aufgerufen

**Lösung:**
- Logs prüfen: `server/api/savings/add-with-action.post.ts`
- DB prüfen: `lastSaveDate` korrekt gesetzt?

### Problem: Wochenansicht zeigt falsche Tage
**Mögliche Ursachen:**
- Timezone-Probleme (Server vs. Client)
- Montags-Offset falsch berechnet

**Lösung:**
- Server-Timezone prüfen
- `weekData` Berechnung in `/api/streaks/current.get.ts` debuggen

## Performance-Überlegungen

### Datenbankzugriffe
- **Pro Sparvorgang:** 2-3 Queries (Streak lesen, updaten, Achievements prüfen)
- **Optimierung:** Index auf `userId` und `goalId` in `streaks`-Tabelle

### Cookie-Overhead
- Minimal (nur Datum-String)
- Automatisches Cleanup um Mitternacht

### Frontend-State
- Streak-Daten werden gecached im Dashboard
- Nur nach erfolgreichem Sparvorgang neu geladen

## Zukünftige Erweiterungen

### Mögliche Features:
1. **Streak-Freeze** - 1x pro Monat einen Tag überspringen ohne Reset
2. **Streak-Leaderboard** - Rangliste der längsten Streaks
3. **Push-Benachrichtigungen** - Erinnerung bei Streak-Gefahr
4. **Streak-Statistiken** - Durchschnitt, Trends, Erfolgsrate
5. **Goal-spezifische Streaks** - Separate Streaks pro Sparziel

## Wichtige Files

### Backend
- `server/utils/streaks.ts` - Core Streak-Logik
- `server/api/streaks/current.get.ts` - Streak-Daten laden
- `server/api/streaks/check-new.post.ts` - Popup-Trigger-Logik
- `server/api/savings/add-with-action.post.ts` - Automatischer Streak-Update

### Frontend
- `components/StreakPopup.vue` - Popup-Komponente
- `pages/dashboard.vue` - Integration und Trigger-Logik

### Database
- `db/syfte.sql` - Schema-Definition für `streaks`-Tabelle

### Tests
- `tests/streaks/streaks.test.ts` - Unit-Tests für Streak-Logik
