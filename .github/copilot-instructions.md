# Project Overview
Syfte ist eine moderne Spar-App basierend auf Nuxt.js, die es Nutzern ermöglicht, Sparziele zu setzen, Fortschritte zu verfolgen und mit Freunden gemeinsam zu sparen. Die App bietet Features wie Achievements, Streaks, Push-Benachrichtigungen und Datenexport. Das Projekt befindet sich in der initialen Entwicklungsphase und wird als Full-Stack-Anwendung mit modernen Web-Technologien entwickelt.

# Tech Stack
## Backend
- Frameworks/libraries: Nuxt.js 4 (Server-Side Rendering & API Routes)
- Data store(s) and ORM: MariaDB (Schema definiert in db/syfte.sql)
- APIs/services: Nuxt Server API, Push-Benachrichtigungen (VAPID via web-push), OAuth (Google)
- Runtime/hosting: Node.js

## Frontend
- Framework(s): Nuxt.js 4 mit Vue 3
- Language/build tooling: TypeScript, Vite (integriert in Nuxt)
- Styling: CSS (kein Tailwind)
- PWA: @vite-pwa/nuxt (vollständig konfiguriert)
  - **Manifest:** Name "Syfte - Spar-App", Theme #35C2C1, standalone mode
  - **Icons:** `pwa-192x192.png`, `pwa-512x512.png`, `apple-touch-icon.png` in `/public/`
  - **iOS Support:** apple-mobile-web-app-capable, black-translucent status bar
  - **Service Worker:** Workbox mit autoUpdate, Font-Caching für Google Fonts
  - **Composable:** `usePwaInstall()` für Install-Prompt Handling
- Icons: Lucide Vue Next / eigene SVGs

## Testing
- Unit: (noch zu konfigurieren)
- E2E: (noch zu konfigurieren)
- Coverage thresholds: (noch zu definieren)

## Tooling
- Package manager(s): npm
- Lint/format: (noch zu konfigurieren)
- CI system: (noch zu konfigurieren)
- Design: Figma (UI-Design, Prototyping, Clickflows)
  - **Figma File Key:** tLgaFKFXHePoBy6zYofs0O
  - **Zugriff:** Via MCP Figma Server mit `mcp_figma_get_figma_data`
  - **Design Specs:** Siehe auch `specs/designkonzept/requirements.md` für Farbschema und Typography

## Hosting & DevOps
- Hosting: Vercel, eigener Webserver
- Code Hosting: GitHub
- Push Notifications: Web Push (VAPID) via web-push Node-Package

# Coding Guidelines
- Typing/strictness: TypeScript mit strengen Typen
- Error handling: Vue 3 Error Boundaries und Nuxt Error Pages
- Security practices: 
  - @nuxtjs/security für automatische Security Headers
  - Input Validation mit server/utils/validation.ts
  - Password Hashing mit PBKDF2 (server/utils/security.ts)
  - Rate Limiting für API-Endpunkte
  - CSRF Protection und CSP Headers
  - Environment Variables für sensible Daten (.env.example)
- Accessibility expectations: WCAG 2.1 AA Standard
- Commit style: Conventional Commits
- Branching strategy: Git Flow
- Code review requirements: Pull Request Reviews erforderlich

## Vue.js Spezifische Richtlinien
- **Syntax:** ES6+ verwenden
- **Vue API:** Composition API (nicht Options API)
- **Async:** `async/await` bevorzugen statt `.then()`
- **Composables:** Wiederverwendbare Logik in Composables extrahieren (Prefix: `use`)
- **Props:** Direkte Destrukturierung in `setup()` Funktion
- **Naming:** 
  - `camelCase` für Variablen und Funktionen
  - `PascalCase` für Komponenten und Klassen
- **v-html:** Nur im `MarkdownRenderer.vue` Component erlaubt
- **Design-Änderungen:** Bei Frontend-Änderungen die mit Design/UI zu tun haben, immer zuerst `specs/designkonzept/requirements.md` konsultieren

## iOS/Smartphone Spezifische Richtlinien
- **Viewport Meta-Tag:** Immer `viewport-fit=cover` verwenden für vollflächige Darstellung auf iPhones
- **Safe Area Insets:** CSS `env()` Funktion nutzen für sichere Bereiche:
  - `env(safe-area-inset-top)` - für die Notch (ca. 0px bei Portrait mit Status Bar)
  - `env(safe-area-inset-bottom)` - für Home-Indicator (ca. 34px auf iPhone X+)
  - `env(safe-area-inset-left/right)` - für abgerundete Ecken (ca. 44px bei Landscape)
- **Fallback-Werte:** Immer zweiten Parameter in `env()` angeben für Browser-Kompatibilität
- **Fixed Positioning:** Vorsichtig nutzen - kann auf iOS Safari Probleme mit Safe Areas verursachen
- **Scrollable Content:** Bevorzugen statt `position: fixed` für natürliches Smartphone-Verhalten (verschwindende Browser-Balken)
- **Margins:** Mindestens 16px für Mobile-Ansichten
- **Responsive Units:** Relative Einheiten (%, em, rem, vw, vh) statt fixe Pixel-Werte bevorzugen

# Project Structure
- `app.vue` - **Root Layout (MUSS im Root-Verzeichnis liegen, nicht in /app!)** - Wrapper für alle Seiten mit `<NuxtPage />`
- `pages/` - Route-basierte Pages (Nuxt Auto-Routing)
- `components/` - Vue Komponenten
- `composables/` - Vue Composables (wiederverwendbare Logik, z.B. `usePwaInstall.ts`)
- `layouts/` - Nuxt Layouts
- `middleware/` - Nuxt Middleware
- `plugins/` - Nuxt Plugins
- `server/` - Server API Routes
- `scripts/` - Build-Scripts (z.B. `generate-pwa-icons.mjs`)
- `assets/` - Statische Assets (CSS, Bilder)
- `public/` - Öffentliche statische Dateien (inkl. PWA-Icons)
- `db/` - Datenbankschemas und Migrationen
- `Anleitungen/` - Projekt-Dokumentation und Security Guides
- `.nuxt/` - Generierte Nuxt Dateien (auto-generiert)

## Wichtige Nuxt 4 Besonderheiten
- **app.vue Location:** In Nuxt 4 MUSS `app.vue` im Root-Verzeichnis liegen, nicht in `/app/`
- **app.vue Rolle:** Enthält globale Wrapper-Komponente mit `<NuxtPage />` für das Routing
- **Pages-System:** Dateien in `/pages` werden automatisch zu Routen (z.B. `pages/index.vue` → `/`)
- **Kein Tailwind:** Projekt nutzt reines CSS, keine Tailwind-Klassen verwenden

# Resources & Automation
## Scripts
- `npm run dev` — Start local development server (Port 3200)
- `npm run dev:3000` — Start auf Port 3000 (falls 3200 belegt)
- `npm run dev:alt` — Alternative Port 3100
- `npm run build` — Build the application for production
- `npm run preview` — Preview production build locally
- `npm run postinstall` — Generate Nuxt types
- `node scripts/generate-pwa-icons.mjs` — Regeneriere PWA-Icons aus Logo

## Development Server
- Local: http://localhost:3200 (Standard-Port für Syfte)
- Alternative Ports: 3000 (dev:3000), 3100 (dev:alt)
- Hot Module Replacement aktiviert
- TypeScript Support aktiviert
- Network-Zugriff: --host für externes Testing

## MCP Servers / Agents
(Noch keine konfiguriert)

## CI Tasks
(Noch nicht konfiguriert)

# Notes for Contributors
- **Environment variables:** Nutze `.env` für lokale Entwicklung (siehe `.env.example`)
  - **DATABASE_URL erforderlich:** Format `mysql://USER:PASSWORD@HOST:PORT/DATABASE`
  - Bei fehlendem DATABASE_URL: Server startet nicht (Critical Error)
- **Nuxt 4 Setup:** Bei erstmaliger Installation: `npm install drizzle-orm mysql2` für Datenbankzugriff
- Nuxt generiert automatisch TypeScript Types in `.nuxt/`
- Server API Routes werden automatisch unter `/api/` verfügbar
- Vue DevTools Extension empfohlen für Entwicklung
- Database Schema ist in `db/syfte.sql` definiert
- **Troubleshooting:** Bei "Create a Vue component in pages/" Warnung: `app.vue` muss im Root liegen, `.nuxt/` löschen hilft bei Cache-Problemen

## Sicherheitsfeatures
- **@nuxtjs/security:** Automatische Security Headers und CSP
- **Input Validation:** Server-side Validierung mit `server/utils/validation.ts`
- **Password Security:** PBKDF2 Hashing in `server/utils/security.ts`
- **Rate Limiting:** API-Schutz gegen Brute Force (Memory-basiert, Redis für Production)
- **Environment Variables:** Sichere Konfiguration über `.env` (siehe `.env.example`)
- **CORS:** Konfiguriert für Development und Production
- **Security Headers:** CSP, HSTS, X-Frame-Options, X-XSS-Protection

## App-Features (basierend auf Datenbankschema)
- **Sparziele:** Nutzer können individuelle oder geteilte Sparziele erstellen
- **Sparaktionen:** Vordefinierte Aktivitäten zum Geld sparen (z.B. "Kaffee ausgelassen")
- **Achievements:** Auszeichnungen für Meilensteine (Streaks, Sparsummen)
- **Freundschaften:** Soziales Sparen mit Freunden (pending/accepted/blocked Status)
- **Push-Benachrichtigungen:** Tägliche Erinnerungen via Web Push (VAPID)
- **Datenexport:** CSV/JSON Export für Transaktionen und Sparziele
- **Multi-Auth:** Password und Google OAuth Unterstützung

## Datenbankstruktur (MySQL)
- **users:** Benutzerprofile mit Gesamtspar-Summe
- **goals:** Sparziele mit Fortschritt und Sharing-Optionen
- **savings:** Einzelne Sparvorgänge (Transaktionen)
- **achievements:** Gamification-System mit Auszeichnungen
- **streaks:** Spar-Serien Tracking
- **daily_aggregates:** Tages-Summen für Analytics
- **friendships:** Soziales Netzwerk zwischen Nutzern

## Bekannte Besonderheiten
- Nuxt 4 Template verwendet (neueste Version)
- Auto-Import für Composables und Components aktiviert
- SSR (Server-Side Rendering) standardmäßig aktiviert

## Wichtige Erkenntnisse aus der Entwicklung
### Dashboard & Sparziele-Anzeige
- **Problem:** Sparziele wurden im Dashboard nicht angezeigt, obwohl sie in der DB existierten
- **Ursache:** `/api/goals/index` verwendet LEFT JOIN mit `savings`-Tabelle → NULL-Werte bei neuen Zielen ohne Savings
- **Lösung:** Dashboard nutzt jetzt `/api/dashboard` API, die Ziele direkt aus `goals`-Tabelle lädt
- **Lernpunkt:** Bei JOIN-Abfragen auf NULL-Werte prüfen, besonders bei optionalen Beziehungen

### API-Parameter-Konsistenz
- **Problem:** "Aktion erstellt, aber konnte nicht zugewiesen werden" Fehler
- **Ursache:** API erwartet `actionId` (singular), aber Frontend sendet `actionIds` (plural Array)
- **Lösung:** Parameter korrigiert zu `actionId: response.action.id`
- **Lernpunkt:** API-Schemas genau prüfen - Singular vs. Plural bei Parametern

### Dynamische Routing-Struktur
- **Erkenntnis:** Nuxt 4 Pages-System: `pages/goals/[id].vue` → `/goals/:id`
- **Implementierung:** Vollständige Sparziel-Detailseite mit allen CRUD-Operationen
- **Best Practice:** Route-Parameter mit `useRoute()` und `route.params.id` auslesen
- **Lernpunkt:** Konsistente Namenskonvention bei API-Endpunkten und Routes einhalten

### Frontend-Backend-Datenfluss
- **Muster:** Frontend lädt Daten → zeigt sie an → Benutzer-Interaktion → API-Aufruf → Daten-Refresh
- **Beispiel:** Sparaktion erstellen → `/api/actions/create` → `/api/goals/[id]/actions` → Detailseite neu laden
- **Lernpunkt:** Immer nach erfolgreichen Mutationen die relevanten Daten neu laden

### Streak-System & Automatisches Tracking
- **Implementierung:** `server/utils/streaks.ts` mit `updateUserStreak()` und `getCurrentStreak()`
- **Logik:** Automatische Streak-Aktualisierung bei jedem Sparvorgang in `add-with-action.post.ts`
- **Date-Handling:** Vergleich mit `isSameDay()` Helper für Streak-Kontinuität (gestern = +1, heute = gleich, sonst reset)
- **DB-Felder:** `current_count`, `longest_count`, `last_save_date` in `streaks` Tabelle
- **Lernpunkt:** Streak-Update NACH erfolgreicher Transaktion, damit keine inkonsistenten Daten entstehen

### Goal Completion & Business Logic
- **Completion Check:** `savedChf >= targetChf` definiert abgeschlossene Ziele
- **Backend Validation:** `/api/savings/add-with-action` wirft Error 400 bei Saving zu completed goals
- **Frontend Filtering:** Dashboard filtert aktive Ziele: `goals.filter(g => !g.isCompleted)` für Quick Save
- **UI-Feedback:** 
  - Grüner Badge "Erreicht!" mit Check-Icon
  - Erfolgs-Message mit Confetti-Emoji 🎉
  - Lösch-Button (roter Trash-Icon) nur bei completed goals
  - Fortschrittsbalken limitiert auf `Math.min(100, percentage)` - niemals über 100%
- **User Flow:** Completed Goal → Anzeige mit Success-UI → Löschen möglich → Redirect zu Dashboard
- **Lernpunkt:** Business Logic (Completion Check) im Backend UND Frontend synchron halten

### Streak-Popup & Cookie-basiertes Tracking
- **Implementierung:** `StreakPopup.vue` Component mit Flamme, Zahl, Wochenansicht (Mo-So), und glückliches Schaf
- **Design:**
  - Flamme (140x265px) hinter der Zahl via absolute positioning und z-index layering
  - Zahl: 120px, weiß mit 5px türkiser Kontur (`-webkit-text-stroke`)
  - Lucide Icons (CheckCircle2, Circle) für gespeicherte/nicht gespeicherte Tage
  - Responsive Design für 414px und 360px Breakpoints
- **Popup-Logik:** 
  - Wird nur beim **ersten Sparvorgang des Tages** angezeigt
  - Cookie `streak_popup_shown_{userId}` verhindert mehrfache Anzeige am gleichen Tag
  - Cookie läuft um Mitternacht ab (expires tomorrow 00:00:00)
  - API `/api/streaks/check-new` prüft Cookie und gibt `showPopup: boolean` zurück
- **Wochenansicht:** 
  - `/api/streaks/current` liefert `weekData: boolean[7]` für aktuelle Woche (Mo-So)
  - Berechnung mit Montags-Offset: `todayDayOfWeek === 0 ? -6 : 1 - todayDayOfWeek`
- **Integration:** Dashboard ruft `checkAndShowStreakPopup()` nach erfolgreichem Sparvorgang auf
- **Lernpunkt:** Cookie-basiertes Session-Tracking effektiv für tägliche UI-State-Verwaltung; siehe `Anleitungen/Streaks-System.md` für vollständige Dokumentation