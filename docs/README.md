# 📚 Syfte - Projekt-Dokumentation

> Umfassende Dokumentation für die Syfte Spar-App

---

## 📑 Inhaltsverzeichnis

- [Funktionsumfang](#-funktionsumfang)
- [Known Bugs](#-known-bugs)
- [Projektlearnings](#-projektlearnings)
- [Persönliche Reflexion](#-persönliche-reflexion)
- [Weiterführende Dokumentation](#-weiterführende-dokumentation)

---

## 🎯 Funktionsumfang

### Was kann das Tool?

**Syfte** ist eine Progressive Web App für motivierendes Sparen mit folgenden Hauptfunktionen:

#### 1. Sparziele-Management
- **Sparziele erstellen**: Individuelle Ziele mit Titel, Zielbetrag und optionalem Bild
- **Geteilte Ziele**: Sparziele mit Freunden teilen und gemeinsam sparen
- **Fortschritts-Tracking**: Visuelle Fortschrittsbalken und Prozentanzeige
- **Favoriten**: Ein Sparziel als Favorit markieren für Quick-Access
- **Ziel-Archivierung**: Abgeschlossene Ziele können gelöscht werden

#### 2. Sparaktionen
- **Vordefinierte Aktionen**: Eigene Sparaktionen erstellen (z.B. "Kaffee ausgelassen", "Take-away verzichtet")
- **Quick Save**: Schnelles Hinzufügen von Ersparnissen zum Favoriten-Ziel
- **Detailliertes Tracking**: Notizen zu jedem Sparvorgang optional möglich
- **Action-Zuordnung**: Jeder Sparvorgang kann einer Aktion zugeordnet werden

#### 3. Gamification
- **Streak-System**: Tägliche Spar-Serien werden getrackt (current & longest streak)
- **Streak-Popup**: Motivierende Anzeige nach dem ersten Sparvorgang des Tages
- **Wochenübersicht**: Visuelle Darstellung der gespeicherten Tage (Mo-So)
- **Achievements**: System für Auszeichnungen und Meilensteine (Datenbank-ready)

#### 4. Soziale Features
- **Freundschaften**: Freunde hinzufügen via Benutzername-Suche
- **Freundschaftsanfragen**: Pending/Accept/Decline System
- **Geteilte Ziele**: Gemeinsam mit Freunden auf Ziele hinsparen

#### 5. Analytics & Export
- **Datenexport**: CSV/JSON Export von Transaktionen und Zielen
- **Statistiken**: Gesamtersparnis über alle Ziele hinweg
- **Visualisierungen**: ApexCharts für Spar-Trends (implementiert in SavingsChart.vue)

#### 6. Account & Security
- **Multi-Auth**: Login via Passwort oder Google OAuth
- **Profilverwaltung**: Profilbild, Name, Username, E-Mail anpassbar
- **Passwort-Änderung**: Sicheres Update mit PBKDF2 Hashing
- **Account-Löschung**: Komplette Datenlöschung möglich

#### 7. Progressive Web App
- **Installierbar**: Auf Home-Screen installierbar (iOS & Android)
- **Offline-Support**: Service Worker mit Caching-Strategien
- **Responsive Design**: Optimiert für alle Bildschirmgrößen
- **iOS-Optimierung**: Safe Area Insets, Notch-Support, Home-Indicator Handling

### Wie macht es das?

#### Technische Architektur

**Frontend (Vue 3 + Nuxt 4)**
- **Pages-basiertes Routing**: Nuxt Auto-Routing für SPA-Navigation
- **Composition API**: Moderne Vue-Syntax mit `setup()` und Composables
- **State Management**: Lokaler State + API-Calls, keine externe Store-Library
- **Reactive Data**: Vue's Reactivity System für Echtzeit-UI-Updates

**Backend (Nuxt Server API)**
- **API Routes**: RESTful API unter `/server/api/`
- **Middleware**: Auth-Middleware für geschützte Endpunkte
- **Drizzle ORM**: Type-safe Datenbankzugriff
- **JWT Authentication**: Session-Management mit HTTP-only Cookies

**Datenbank (MariaDB)**
- **Relationale Struktur**: Normalisierte Tabellen mit Foreign Keys
- **Automatische Aggregation**: Daily aggregates für Analytics
- **Trigger & Constraints**: DB-seitige Validierung und Konsistenz

**Security**
- **Input Validation**: Schema-basierte Validierung in `server/utils/validation.ts`
- **Password Hashing**: PBKDF2 mit Salt (10.000 Iterationen)
- **Security Headers**: CSP, XSS-Protection, Frame-Options via Nitro
- **Rate Limiting**: Memory-basiert (Development), Redis-ready für Production

**Streak-Tracking**
- **Automatische Updates**: Bei jedem Sparvorgang in `add-with-action.post.ts`
- **Date-Comparison**: `isSameDay()` Helper für Streak-Kontinuität
- **Cookie-basierte UI-States**: Popup nur einmal pro Tag anzeigen
- **Midnight-Reset**: Cookies laufen um 00:00 Uhr ab

**PWA Features**
- **Workbox**: Service Worker für Offline-Caching
- **Manifest**: App-Name, Icons, Theme-Color, Display-Mode
- **Install-Prompt**: Custom Composable `usePwaInstall()` für Install-Button

---

## 🐛 Known Bugs

### Performance-Probleme
- **⚠️ Lange Ladezeiten in Live-Umgebung**: Die App zeigt in der Production-Umgebung (syfte.ch) deutlich längere Ladezeiten als im Development-Modus. Mögliche Ursachen:
  - Datenbankverbindung zu langsam (Netzwerk-Latenz)
  - Fehlende Server-seitige Caching-Strategien
  - Nicht optimierte Datenbankabfragen (fehlende Indizes)
  - Service Worker Caching-Strategie nicht optimal konfiguriert
  - Große Asset-Dateien ohne Kompression

**Geplante Lösungen:**
- Redis-Caching für API-Responses implementieren
- Datenbankabfragen optimieren mit Indizes
- CDN für statische Assets einrichten
- Server-Side Rendering (SSR) optimieren

---

## 💡 Projektlearnings

### 1. Dashboard & Sparziele-Anzeige
**Problem**: Sparziele wurden im Dashboard nicht angezeigt, obwohl sie in der Datenbank existierten.

**Ursache**: Die API `/api/goals/index` verwendet einen `LEFT JOIN` mit der `savings`-Tabelle. Bei neuen Zielen ohne Sparvorgänge resultieren NULL-Werte, die nicht korrekt behandelt wurden.

**Lösung**: Das Dashboard nutzt jetzt die separate `/api/dashboard` API, die Ziele direkt aus der `goals`-Tabelle lädt ohne JOIN-Abhängigkeit.

**Learning**: Bei JOIN-Abfragen immer auf NULL-Werte prüfen, besonders bei optionalen Beziehungen.

---

### 2. API-Parameter-Konsistenz
**Problem**: "Aktion erstellt, aber konnte nicht zugewiesen werden" Fehler beim Erstellen von Sparaktionen.

**Ursache**: API erwartet `actionId` (singular), aber Frontend sendet `actionIds` (plural Array).

**Lösung**: Parameter korrigiert zu `actionId: response.action.id` im Frontend.

**Learning**: API-Schemas genau prüfen - Singular vs. Plural bei Parametern kann subtile Bugs verursachen.

---

### 3. Dynamische Routing-Struktur
**Erkenntnis**: Nuxt 4 Pages-System ermöglicht `pages/goals/[id].vue` → `/goals/:id` automatisch.

**Implementierung**: Vollständige Sparziel-Detailseite mit allen CRUD-Operationen ohne manuelle Route-Registrierung.

**Best Practice**: Route-Parameter mit `useRoute()` und `route.params.id` auslesen.

**Learning**: Konsistente Namenskonvention bei API-Endpunkten und Routes einhalten (`/api/goals/[id]` matched `/goals/:id`).

---

### 4. Frontend-Backend-Datenfluss
**Muster**: Frontend lädt Daten → zeigt sie an → Benutzer-Interaktion → API-Aufruf → Daten-Refresh.

**Beispiel**: Sparaktion erstellen → `/api/actions/create` → `/api/goals/[id]/actions` → Detailseite neu laden.

**Learning**: Immer nach erfolgreichen Mutationen die relevanten Daten neu laden für UI-Konsistenz.

---

### 5. Streak-System & Automatisches Tracking
**Implementierung**: `server/utils/streaks.ts` mit `updateUserStreak()` und `getCurrentStreak()`.

**Logik**: Automatische Streak-Aktualisierung bei jedem Sparvorgang in `add-with-action.post.ts`.

**Date-Handling**: Vergleich mit `isSameDay()` Helper für Streak-Kontinuität:
- Gestern = +1 (Streak erhöhen)
- Heute = gleich (Streak beibehalten)
- Sonst = Reset auf 1

**DB-Felder**: `current_count`, `longest_count`, `last_save_date` in `streaks` Tabelle.

**Learning**: Streak-Update NACH erfolgreicher Transaktion, damit keine inkonsistenten Daten entstehen.

---

### 6. Goal Completion & Business Logic
**Completion Check**: `savedChf >= targetChf` definiert abgeschlossene Ziele.

**Backend Validation**: `/api/savings/add-with-action` wirft Error 400 bei Saving zu completed goals.

**Frontend Filtering**: Dashboard filtert aktive Ziele: `goals.filter(g => !g.isCompleted)` für Quick Save.

**UI-Feedback**:
- Grüner Badge "Erreicht!" mit Check-Icon
- Erfolgs-Message mit Confetti-Emoji 🎉
- Lösch-Button (roter Trash-Icon) nur bei completed goals
- Fortschrittsbalken limitiert auf `Math.min(100, percentage)` - niemals über 100%

**User Flow**: Completed Goal → Anzeige mit Success-UI → Löschen möglich → Redirect zu Dashboard.

**Learning**: Business Logic (Completion Check) im Backend UND Frontend synchron halten.

---

### 7. Streak-Popup & Cookie-basiertes Tracking
**Implementierung**: `StreakPopup.vue` Component mit Flamme, Zahl, Wochenansicht (Mo-So) und glücklichem Schaf.

**Design**:
- Flamme (140x265px) hinter der Zahl via absolute positioning und z-index layering
- Zahl: 120px, weiß mit 5px türkiser Kontur (`-webkit-text-stroke`)
- Lucide Icons (CheckCircle2, Circle) für gespeicherte/nicht gespeicherte Tage
- Responsive Design für 414px und 360px Breakpoints

**Popup-Logik**:
- Wird nur beim **ersten Sparvorgang des Tages** angezeigt
- Cookie `streak_popup_shown_{userId}` verhindert mehrfache Anzeige
- Cookie läuft um Mitternacht ab (expires tomorrow 00:00:00)
- API `/api/streaks/check-new` prüft Cookie und gibt `showPopup: boolean` zurück

**Wochenansicht**:
- `/api/streaks/current` liefert `weekData: boolean[7]` für aktuelle Woche (Mo-So)
- Berechnung mit Montags-Offset: `todayDayOfWeek === 0 ? -6 : 1 - todayDayOfWeek`

**Learning**: Cookie-basiertes Session-Tracking effektiv für tägliche UI-State-Verwaltung.

---

## 🤔 Persönliche Reflexion

### Adrian Janka

#### Technische Herausforderungen

Die größte Herausforderung war definitiv, **alle Komponenten zum Laufen zu bringen**: Datenbank auf dem Webhosting-Server, Nuxt lokal, Domainregistration extern und das Deployment auf Vercel. Viele verschiedene Faktoren, die man bei einem zukünftigen Projekt idealerweise alles beim gleichen Anbieter hosten würde. Am meisten zu kämpfen hatten wir mit der Implementierung des **Streak- und Achievement-Systems** – die Logik für das tägliche Tracking und die Cookie-basierte Popup-Anzeige war komplexer als erwartet.

Eine zentrale Erkenntnis war, dass **Frontend und Backend in einem Nuxt-Projekt** unglaublich praktisch ist! Das Backend aufzusetzen und die API anzusteuern war eine komplett neue Erfahrung für mich und hat mir gezeigt, wie viel effizienter Full-Stack Development sein kann, wenn alles unter einem Framework vereint ist.

Rückblickend würde ich die **Datenbankstruktur anders angehen**. Die Datenbank war ein wilder Ritt – für das nächste Projekt macht es definitiv Sinn, nicht einfach drauf los zu schießen, sondern wirklich Tabelle für Tabelle durchzugehen und sich zu überlegen: Was braucht es wirklich? Was nicht? Sonst endet man schnell mit der eierlegenden Wollmilchsau.

Die größte **"Aha!"-Erkenntnis** kam, als wir uns für das **untere Navigationsmenü mit Icons** entschieden haben. Es machte plötzlich alles viel einfacher und strukturierter – sowohl für die User Experience als auch für unsere Code-Architektur.

#### Projektmanagement & Workflow

Die **Zusammenarbeit mit Claudio** war super! Wir haben uns perfekt ergänzt: Er kümmerte sich ums Design und Frontend, ich ums Backend (API und Datenbank). Diese klare Aufgabenteilung hat sehr gut funktioniert.

Zeitlich war es gegen Ende etwas unausgeglichen – Claudio hat eigentlich alles erledigt, da ich sehr wenig Zeit hatte. Aber über das ganze Semester hinweg sind wir durchgehend drangeblieben, was entscheidend für den Erfolg war.

**GitHub Copilot** mit sehr guten Instructions (danke Claudio!) hat hervorragend funktioniert. Die AI-Unterstützung hat uns enorm viel Zeit gespart, besonders bei repetitiven Tasks und beim Debugging.

Beim nächsten Projekt könnte definitiv **noch mehr von mir kommen** – eine ausgewogenere Zeitverteilung über das ganze Projekt hinweg wäre ideal.

#### Persönliche Entwicklung

Ich habe gelernt, eine **Full-Stack Web-App/PWA von A bis Z zu entwickeln** – von der Datenbankstruktur über die REST API bis hin zur PWA-Konfiguration. Das Backend-Development war komplett neu für mich und ich fühle mich jetzt deutlich sicherer in diesem Bereich.

Am meisten Spaß gemacht hat das **gemeinsame Problemlösen mit Claudio**. Die Momente, wenn etwas endlich geklappt hat oder genau so aussah, wie wir es uns vorgestellt hatten – das waren die Highlights. Das gemeinsame Programmieren Seite an Seite war eine wertvolle Erfahrung.

Frustrierend war, dass **unsere Datenbank nicht erreichbar war, wenn wir im Eduroam waren**. Das hat uns oft ausgebremst und zu umständlichen Workarounds gezwungen (Hotspot, externe Locations etc.).

Mit dem Endergebnis bin ich sehr zufrieden: **9/10**. Die App funktioniert stabil, sieht gut aus und erfüllt alle Kernfunktionen. Ein paar Features mehr (z.B. erweiterte Analytics, Push-Notifications) wären noch cool gewesen, aber für den gegebenen Zeitrahmen sind wir stolz auf das Resultat.

---

### Claudio Riz

#### Technische Herausforderungen
<!-- Claudios persönliche Reflexion zu:
- Welche technischen Herausforderungen waren am schwierigsten?
- Was hast du über [Technologie] gelernt?
- Welche Designentscheidungen würdest du rückblickend anders treffen?
- Was war die größte "Aha!"-Erkenntnis im Projekt?
-->

#### Projektmanagement & Workflow
<!-- Claudios Reflexion zu:
- Wie lief die Zusammenarbeit mit Adrian?
- War die Projektplanung realistisch?
- Welche Tools/Methoden haben gut funktioniert?
- Was würdest du beim nächsten Projekt anders machen?
-->

#### Persönliche Entwicklung
<!-- Claudios Reflexion zu:
- Welche neuen Skills hast du entwickelt?
- Was hat dir am meisten Spaß gemacht?
- Was war frustrierend und warum?
- Wie zufrieden bist du mit dem Endergebnis?
-->

---

## 📖 Weiterführende Dokumentation

- **[API-Dokumentation](./API-Dokumentation.md)** - Vollständige REST API Referenz
- **[Designkonzept](./Designkonzept.md)** - Farbschema, Typography, UI-Guidelines
- **[Sicherheitskonzept](../Anleitungen/Sicherheitsimplementierungen.md)** - Security Features & Best Practices
- **[Coding Guidelines](../.github/copilot-instructions.md)** - Projekt-spezifische Entwicklerrichtlinien

---

**Dokumentationsversion**: 1.0  
**Letzte Aktualisierung**: 7. Januar 2026  
**Autoren**: Adrian Janka, Claudio Riz
