# Feature-Implementierungen

Diese Datei dokumentiert wichtige Feature-Implementierungen in der Syfte-App mit technischen Details und Best Practices.

---

## 1. Streak-Tracking System

### Übersicht
Automatisches Tracking von Spar-Serien (aufeinanderfolgende Tage mit Sparaktivität).

### Technische Implementierung

**Datei:** `server/utils/streaks.ts`

**Kern-Funktionen:**
- `updateUserStreak(userId)` - Aktualisiert Streak bei jedem Sparvorgang
- `getCurrentStreak(userId)` - Lädt aktuellen Streak-Status

**Logik:**
```typescript
// Streak-Berechnung basierend auf last_save_date
if (isSameDay(lastSaveDate, today)) {
  // Heute bereits gespart → keine Änderung
  return currentStreak
} else if (isSameDay(lastSaveDate, yesterday)) {
  // Gestern gespart → Streak +1
  currentStreak.current_count++
} else {
  // Lücke → Streak zurücksetzen
  currentStreak.current_count = 1
}
```

**Integration:**
- Wird in `/api/savings/add-with-action.post.ts` nach erfolgreicher Transaktion aufgerufen
- Streak-Daten werden im Response zurückgegeben und im Dashboard angezeigt

**Datenbank:**
```sql
CREATE TABLE streaks (
  user_id INT PRIMARY KEY,
  current_count INT DEFAULT 0,
  longest_count INT DEFAULT 0,
  last_save_date DATE
);
```

### Best Practices
- ✅ Streak-Update NACH erfolgreicher Transaktion (nicht davor)
- ✅ Date-Vergleich mit Helper-Funktion `isSameDay()` für Zeitzonenunabhängigkeit
- ✅ `longest_count` wird automatisch aktualisiert wenn `current_count > longest_count`

---

## 2. Goal Completion System

### Übersicht
Automatische Erkennung und Behandlung von erreichten Sparzielen.

### Completion Logic

**Definition:** Ein Ziel gilt als abgeschlossen wenn:
```typescript
savedChf >= targetChf
```

**Berechnung:** Wird sowohl im Backend (API) als auch Frontend (UI) durchgeführt:
```typescript
const isCompleted = parseFloat(goal.savedChf) >= parseFloat(goal.targetChf)
```

### Backend-Validierung

**Datei:** `server/api/savings/add-with-action.post.ts`

**Validation Check:**
```typescript
// Lines 103-111
const currentSaved = parseFloat(goal.savedChf.toString())
const targetAmount = parseFloat(goal.targetChf.toString())

if (currentSaved >= targetAmount) {
  throw createError({
    statusCode: 400,
    statusMessage: `Dieses Sparziel ist bereits erreicht! (${currentSaved} CHF von ${targetAmount} CHF)`
  })
}
```

**Warum Backend-Validierung?**
- Verhindert Race Conditions bei gleichzeitigen Requests
- Datenintegrität: Keine Über-Ersparnisse in der Datenbank
- Zentrale Business Logic (Single Source of Truth)

### Frontend-Behandlung

**Dashboard (`pages/dashboard.vue`):**
- Filtert completed goals aus Quick Save Actions:
  ```typescript
  const activeGoals = goals.value.filter(g => !g.isCompleted)
  ```
- Visuelle Markierung mit grünem Badge "Erreicht!"
- Lösch-Icon (Trash2) erscheint nur bei completed goals
- Fortschrittsbalken begrenzt: `Math.min(100, progressPercentage)`

**Goal Detail Page (`pages/goals/[id].vue`):**
- Success-Message mit 🎉 Emoji und Completion-Details
- Alle Sparaktionen werden ausgeblendet (nur Erfolgs-Nachricht sichtbar)
- Roter "Ziel löschen" Button für Cleanup
- Redirect zu Dashboard nach erfolgreichem Löschen

### UI-Komponenten

**Completed Badge (Dashboard):**
```vue
<div v-if="goal.isCompleted" class="completed-badge">
  <Check :size="16" color="white" />
  <span>Erreicht!</span>
</div>
```

**Delete Icon (Dashboard):**
```vue
<div v-if="goal.isCompleted" class="delete-goal-icon" @click.stop="deleteGoal(goal)">
  <Trash2 :size="18" color="#EF4444" />
</div>
```

**Fortschrittsbalken-Begrenzung:**
```vue
<div class="progress-fill" :style="{ 
  width: Math.min(100, (goal.current / goal.target * 100)) + '%' 
}"></div>
```

### User Flow

1. **Normales Sparen:** Nutzer spart mit Quick Actions auf aktive Ziele
2. **Goal Erreicht:** Backend erkennt `savedChf >= targetChf`
3. **UI-Update:** Goal wird als "completed" markiert (grüner Badge)
4. **Weitere Saves:** Backend blockiert mit Error 400
5. **Löschung:** Nutzer kann completed goal via Trash-Icon löschen
6. **Redirect:** Nach Löschen zurück zum Dashboard

### Best Practices
- ✅ Business Logic (completion check) in Backend UND Frontend synchron halten
- ✅ Error-Handling mit aussagekräftigen Meldungen (`statusMessage`)
- ✅ UI-Feedback: Visuell klare Unterscheidung zwischen aktiven und completed goals
- ✅ Fortschrittsbalken niemals über 100% (UX-Konsistenz)
- ✅ Confirmation Dialog vor Löschung (Datenverlust-Schutz)

---

## 3. Dashboard Total Goals Display

### Übersicht
Anzeige der Gesamtsumme aller Sparziele (statt nur Favorit).

### Backend-Berechnung

**Datei:** `server/api/dashboard.get.ts`

**Calculation:**
```typescript
const totalGoalsTarget = goals.reduce((sum, g) => 
  sum + parseFloat(g.targetChf.toString()), 0
)

const totalGoalsSaved = goals.reduce((sum, g) => 
  sum + parseFloat(g.savedChf.toString()), 0
)

const progressPercentage = totalGoalsTarget > 0 
  ? Math.round((totalGoalsSaved / totalGoalsTarget) * 100) 
  : 0
```

### Frontend-Anzeige

**Dashboard Quick Save Header:**
```vue
<p>Alle Sparaktionen werden direkt auf dein <strong>Favoritenziel</strong> gebucht.</p>
```

**Profile Modal Stats:**
```vue
<div class="stat-card">
  <h4>Alle Sparziele</h4>
  <p>CHF {{ totalGoals.targetChf }}</p>
</div>
```

### Warum "Alle Sparziele" statt Favorit?
- **User Request:** Mehr Übersicht über Gesamtfortschritt
- **Motiviationsfaktor:** Nutzer sieht größere Summe (alle Ziele kombiniert)
- **Realistische Darstellung:** Zeigt tatsächlichen Gesamt-Sparfortschritt

---

## 4. Quick Save Action Filtering

### Problem
Nutzer konnte weiter auf completed goals sparen → Fehler 400 vom Backend.

### Lösung
**Datei:** `pages/dashboard.vue` in `selectAction()`

```typescript
// Filter nur aktive (nicht abgeschlossene) Ziele
const activeGoals = goals.value.filter(g => !g.isCompleted)

if (activeGoals.length === 0) {
  alert('Alle deine Sparziele sind bereits erreicht! Erstelle ein neues Ziel...')
  return
}

// Finde Favorit unter aktiven Zielen
const favoriteGoal = activeGoals.find(g => g.isFavorite)
```

### User Flow
1. Quick Save Button geklickt
2. System filtert nur aktive Ziele (`!isCompleted`)
3. Falls keine aktiven Ziele: Alert-Meldung
4. Falls aktive Ziele: Suche Favorit → Fallback erstes aktives Ziel
5. Saving auf ausgewähltes Ziel

### Edge Cases
- ✅ Alle Ziele completed → Alert statt API-Error
- ✅ Kein Favorit gesetzt → Erstes aktives Ziel als Fallback
- ✅ Favorit ist completed → Anderes aktives Ziel wird gewählt

---

## Allgemeine Best Practices

### Date Handling
- Immer `new Date()` für aktuelle Zeit
- Date-Vergleiche mit Helper-Funktionen (`isSameDay()`)
- Timezone-Aware: Nutzung von `toISOString()` für DB-Storage

### Error Handling
- Backend: `createError()` mit `statusCode` und `statusMessage`
- Frontend: `try/catch` mit User-Feedback (alert/toast)
- Aussagekräftige Fehlermeldungen in Deutsch

### State Management
- Reactive Refs für UI-State (`ref()`)
- Computed Properties für abgeleitete Werte
- Sofortiges State-Update nach erfolgreichen API-Calls

### UI/UX Patterns
- Loading States: `isDeleting`, `executingAction`
- Success Feedback: Temporäre Badges/Animationen (2s timeout)
- Confirmation Dialogs: Bei destruktiven Aktionen (Löschen)
- Progressive Disclosure: Completed goals zeigen andere UI als aktive

### Performance
- Daten-Refresh nur nach Mutations (nicht bei jedem Render)
- Filter-Operationen im Frontend (kein zusätzlicher API-Call)
- Optimistische UI-Updates wo möglich (z.B. successActions array)

---

## 6. Sparverlauf-Diagramm (Statistics Chart)

### Übersicht
Interaktives Liniendiagramm auf der Profil-Seite, das die Spar-Aktivität des Nutzers über verschiedene Zeiträume visualisiert.

### Was wird angezeigt?

**Zwei Datenlinien:**
1. **Tägliche Sparaktionen** (Hellgrün `#63b08e`)
   - Zeigt den gesparten Betrag pro Tag
   - Y-Achse links: CHF-Beträge
   - Ermöglicht Erkennung von Spar-Peaks und ruhigen Tagen

2. **Gesamtsumme** (Dunkelgrün `#315549`)
   - Kumulierte Summe aller Sparaktionen bis zu diesem Tag
   - Y-Achse rechts: Totale CHF
   - Zeigt den Gesamt-Fortschritt über die Zeit

**Zeiträume (Tabs):**
- **7 Tage**: Detaillierte Wochenansicht mit täglichen Werten
- **30 Tage**: Monatsübersicht für mittelfristige Trends
- **12 Monate**: Jahresansicht für langfristige Entwicklung