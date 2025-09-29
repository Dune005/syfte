# Syfte – Sparen. Motivierend. Einfach.  

**Syfte** ist eine mobile Web-App, die alltägliche Verzichtsentscheidungen in sichtbare Ersparnisse für persönliche Ziele verwandelt. Statt abstrakter Zahlen oder komplizierter Budgetverwaltung macht Syfte Sparen greifbar, spielerisch und motivierend.  

### Kernidee  
- **Sparziele definieren:** z. B. „Roadtrip Italien, 800 CHF“.  
- **Verzichtsaktionen festlegen:** Kaffee-to-go, Take-away-Essen usw.  
- **Fortschritt eintragen:** jeder eingesparte Betrag füllt direkt den Zielbalken.  
- **Motivation behalten:** durch Streaks, Badges und visuelle Belohnungen.  

### Warum Syfte?  
- Fokus auf **Motivation statt Verwaltung**  
- Keine Bankkonten-Verknüpfung, sofort nutzbar  
- Gamification und klare Visualisierung der Erfolge  
- Stärkt die emotionale Bindung zu persönlichen Sparzielen  

Syfte richtet sich vor allem an junge Erwachsene, die einfache, mobile und motivierende Finanzlösungen suchen.

## 🚀 Features
- **Individuelle & geteilte Sparziele** mit Fortschritts-Tracking
- **Vordefinierte Sparaktionen** (z.B. "Kaffee ausgelassen")
- **Achievements & Streaks** für Gamification
- **Freundschaften** für soziales Sparen
- **Push-Benachrichtigungen** für tägliche Erinnerungen
- **Datenexport** (CSV/JSON) für Backup und Analyse
- **Multi-Auth** (Passwort & Google OAuth)

## 🛠 Tech Stack
- **Frontend:** Nuxt.js 4 mit Vue 3 & TypeScript
- **Styling:** CSS
- **Build:** Vite (integriert in Nuxt)
- **PWA:** @vite-pwa/nuxt (Service Worker, Manifest, Offline Support)
- **Backend:** Nuxt Server API
- **Datenbank:** MariaDB
- **Auth:** Multi-Provider (Passwort, Google OAuth)
- **Push:** Web Push API (VAPID) via web-push
- **Icons:** Heroicons / eigene SVGs
- **Design:** Figma (UI-Design, Prototyping)
- **Hosting:** Vercel, eigener Webserver

## 📦 Installation & Setup

### Voraussetzungen
- Node.js 18+
- npm oder yarn
- MySQL/MariaDB

### Quick Start
```bash
# Repository klonen
git clone https://github.com/Dune005/syfte.git
cd syfte

# Dependencies installieren
npm install

# Environment-Variablen einrichten
cp .env.example .env
# .env editieren und Datenbank-Credentials eintragen

# Datenbank-Schema importieren
mysql -u username -p database_name < db/syfte.sql

# Development Server starten
npm run dev
```

Die App ist dann unter `http://localhost:3200` verfügbar.

### Verfügbare Scripts
```bash
npm run dev         # Development Server starten (Port 3200)
npm run dev:3000    # Alternative: Port 3000
npm run dev:alt     # Alternative: Port 3100
npm run build       # Production Build erstellen
npm run preview     # Production Build lokal testen
```

## 📊 Datenbankstruktur
Das vollständige Schema findest du in `db/syfte.sql`. Wichtigste Tabellen:
- `users` - Benutzerprofile mit Gesamtspar-Summe
- `goals` - Sparziele mit Fortschritt und Sharing
- `savings` - Einzelne Sparvorgänge (Transaktionen)
- `achievements` - Gamification-System
- `friendships` - Soziales Netzwerk zwischen Nutzern

## 🤝 Contributing
1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Changes committen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request erstellen

## 📄 Lizenz
[MIT](LICENSE)  