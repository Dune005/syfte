# Achievement Popup System

**Datum:** 1. Dezember 2025  
**Status:** ✅ Implementiert

## Überblick

Ein Popup-System das **neue Achievements** anzeigt, wenn ein User sie freischaltet. Funktioniert überall wo gespart wird.

## Features

### ✅ Achievement Popup zeigt:
- **Achievement-Bild** (z.B. `/images/auszeichnungen/badge.png`)
- **Achievement-Name** (z.B. "Sparfuchs")
- **Achievement-Beschreibung** (z.B. "Du hast 7 Tage in Folge gespart!")
- **Button:** "Gratulation! 🎉"

### ✅ Queue-System für mehrere Achievements
- Wenn mehrere Achievements gleichzeitig freigeschaltet werden
- Werden sie **nacheinander** angezeigt (Queue)
- Nach allen Achievements kommt das **Streak-Popup**

### ✅ Reihenfolge der Popups
1. **Achievement Popup(s)** - alle nacheinander
2. **Streak Popup** - nach allen Achievements

## Implementierung

### 1. Neue Komponente: `AchievementPopup.vue`

**Props:**
- `show: boolean` - Zeigt/versteckt das Popup
- `achievementName: string` - Name des Achievements
- `achievementDescription: string` - Beschreibung
- `achievementImage: string` - Pfad zum Bild

**Events:**
- `@close` - Wird ausgelöst wenn User auf "Gratulation!" klickt

**Design:**
- Lila Gradient-Hintergrund (`#667eea` → `#764ba2`)
- Rundes Achievement-Icon mit Glow-Animation
- Weißer Text auf lila Hintergrund
- Weißer Button mit lila Text
- Responsive für Mobile (414px, 360px)

### 2. Dashboard (`pages/dashboard.vue`)

**Neue State-Variablen:**
```javascript
const showAchievementPopup = ref(false)
const currentAchievement = ref({
  name: '',
  description: '',
  imageUrl: ''
})
const achievementQueue = ref([])
```

**Neue Funktionen:**
- `showAchievementPopups(achievements)` - Startet die Achievement-Queue
- `showNextAchievement()` - Zeigt nächstes Achievement oder Streak-Popup
- `closeAchievementPopup()` - Schließt Popup und zeigt nächstes

**Logik:**
```javascript
if (response.achievements?.newlyUnlocked?.length > 0) {
  // 1. Zeige alle Achievements nacheinander
  await showAchievementPopups(response.achievements.newlyUnlocked)
  // 2. Update Profil-Titel
  await updateProfileTitle()
} else {
  // Kein Achievement → Streak-Popup direkt zeigen
  await checkAndShowStreakPopup()
}
```

### 3. Goal-Detailseite (`pages/goals/[id].vue`)

Identische Implementierung wie Dashboard:
- Achievement-Popup Component hinzugefügt
- Queue-System implementiert
- Funktioniert bei allen Sparvorgängen auf der Detailseite

## User Flow

### Szenario 1: Ein Achievement freigeschaltet
```
User spart
→ API gibt 1 Achievement zurück
→ Achievement-Popup erscheint
→ User klickt "Gratulation!"
→ Streak-Popup erscheint (falls heute erster Sparvorgang)
```

### Szenario 2: Mehrere Achievements freigeschaltet
```
User spart
→ API gibt 3 Achievements zurück
→ Achievement #1 Popup erscheint
→ User klickt "Gratulation!"
→ Achievement #2 Popup erscheint
→ User klickt "Gratulation!"
→ Achievement #3 Popup erscheint
→ User klickt "Gratulation!"
→ Streak-Popup erscheint
```

### Szenario 3: Kein Achievement freigeschaltet
```
User spart
→ API gibt 0 Achievements zurück
→ Direkt Streak-Popup (falls heute erster Sparvorgang)
```

## API Response Format

Das System erwartet folgendes Format von `/api/savings/add-with-action`:

```json
{
  "success": true,
  "achievements": {
    "newlyUnlocked": [
      {
        "id": 1,
        "name": "Sparfuchs",
        "description": "Du hast 7 Tage in Folge gespart!",
        "imageUrl": "/images/auszeichnungen/sparfuchs.png"
      },
      {
        "id": 2,
        "name": "Sparheld",
        "description": "Du hast insgesamt 100 CHF gespart!",
        "imageUrl": "/images/auszeichnungen/sparheld.png"
      }
    ]
  }
}
```

## Styling Details

### Colors:
- **Background Gradient:** `#667eea` → `#764ba2` (lila)
- **Text:** White (`#ffffff`)
- **Button Background:** White
- **Button Text:** `#667eea` (lila)

### Animations:
- **Glow-Animation:** Achievement-Icon pulsiert mit Glow-Effekt
- **Popup Transition:** Scale + Fade (0.3s-0.4s cubic-bezier)

### Responsive:
- **Desktop/Tablet:** 400px max-width
- **Mobile 414px:** Angepasste Größen
- **Mobile 360px:** Kleinere Icons und Texte

## Testing

### Manueller Test:
1. **Einzelnes Achievement:**
   - Spare bis ein Achievement freigeschaltet wird
   - Prüfe: Achievement-Popup erscheint
   - Prüfe: Nach Klick erscheint Streak-Popup

2. **Mehrere Achievements:**
   - Erstelle Situation wo 2+ Achievements gleichzeitig kommen
   - Prüfe: Alle Popups erscheinen nacheinander
   - Prüfe: Streak-Popup kommt am Ende

3. **Kein Achievement:**
   - Spare normal (ohne neues Achievement)
   - Prüfe: Nur Streak-Popup erscheint

### Orte zum Testen:
- ✅ Dashboard → Schnellsparen
- ✅ Goal-Detailseite → Sparaktion ausführen

## Dateien

### Neu erstellt:
- ✅ `components/AchievementPopup.vue`

### Geändert:
- ✅ `pages/dashboard.vue`
  - Achievement-Popup Component hinzugefügt
  - Queue-System implementiert
  - Logik für Achievement → Streak Reihenfolge

- ✅ `pages/goals/[id].vue`
  - Achievement-Popup Component hinzugefügt
  - Queue-System implementiert
  - Identische Logik wie Dashboard

## Zukünftige Erweiterungen

Mögliche Features:
- [ ] Sound-Effekt beim Achievement-Unlock
- [ ] Konfetti-Animation
- [ ] "Teilen"-Button für Social Media
- [ ] Achievement-Historie anzeigen
- [ ] Achievement-Fortschritt in Echtzeit (z.B. "80/100 CHF gespart")

## Bekannte Limitierungen

- Keine Persistierung: Wenn User die Seite neu lädt, werden Popups nicht nochmal angezeigt
- Keine Offline-Queue: Achievements müssen online freigeschaltet werden
- Design ist fest codiert (keine Customization möglich)

## Verwandte Dokumentation

- `Anleitungen/Streaks-System-V2.md` - Streak-Popup System
- `server/utils/achievements.ts` - Achievement-Logik
- `components/StreakPopup.vue` - Streak-Popup Component
