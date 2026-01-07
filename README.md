<div align="center">
  <h1>🐑 Syfte</h1>
  <p><strong>Sparen. Motivierend. Einfach.</strong></p>
  <p>
    <a href="https://www.syfte.ch">Live App</a> •
    <a href="#-features">Features</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-contributing">Contributing</a>
  </p>
</div>

---

## 📖 Über Syfte

**Syfte** ist eine Progressive Web App, die alltägliche Verzichtsentscheidungen in sichtbare Ersparnisse verwandelt. Statt komplizierter Budgetverwaltung macht Syfte Sparen greifbar, spielerisch und motivierend – perfekt für junge Erwachsene, die ihre Sparziele erreichen wollen.

### 💡 Kernidee
- **Sparziele setzen**: „Roadtrip Italien, 800 CHF"
- **Verzichtsaktionen tracken**: Kaffee-to-go, Take-away-Essen
- **Fortschritt visualisieren**: Jeder eingesparte Betrag füllt den Zielbalken
- **Motiviert bleiben**: Streaks, Achievements und soziales Sparen mit Freunden

---

## ✨ Features

- 🎯 **Individuelle & geteilte Sparziele** mit Echtzeit-Fortschritt
- 💰 **Vordefinierte Sparaktionen** für schnelles Tracking
- 🏆 **Achievements & Streaks** für Gamification
- 👥 **Freundschaften** für soziales Sparen
- 📊 **Analytics & Datenexport** (CSV/JSON)
- 🔐 **Multi-Auth** (Passwort & Google OAuth)
- 📱 **PWA** mit Offline-Support und App-Installation

---

## 🛠 Tech Stack

**Frontend**
- Nuxt.js 4 (Vue 3 + TypeScript)
- Composition API
- CSS (kein Framework)
- ApexCharts für Visualisierungen
- PWA mit Service Worker

**Backend**
- Nuxt Server API
- MariaDB/MySQL
- Drizzle ORM
- JWT Authentication
- Security Headers (@nuxtjs/security)

**Hosting & Deployment**
- Vercel (Production)
- Eigener Webserver
- **Live**: [syfte.ch](https://www.syfte.ch)

---

## 📦 Installation

### Voraussetzungen
- Node.js 18+ 
- npm
- MySQL/MariaDB

### Setup

\`\`\`bash
# Repository klonen
git clone https://github.com/Dune005/syfte.git
cd syfte

# Dependencies installieren
npm install

# Environment-Variablen konfigurieren
cp .env.example .env
# Siehe "Environment Variables" für Details

# Datenbank einrichten
mysql -u username -p database_name < db/syfte.sql

# Development Server starten
npm run dev
\`\`\`

Die App läuft dann auf \`http://localhost:3200\`.

### Scripts

\`\`\`bash
npm run dev         # Dev Server (Port 3200)
npm run dev:3000    # Dev Server (Port 3000)
npm run dev:alt     # Dev Server (Port 3100)
npm run build       # Production Build
npm run preview     # Production Preview
\`\`\`

---

## 🔐 Environment Variables

Erstelle eine \`.env\` Datei im Root-Verzeichnis:

\`\`\`bash
# Database (erforderlich)
DATABASE_URL="mysql://user:password@host:port/database"

# JWT Authentication (erforderlich)
SESSION_SECRET="your-secret-key-min-32-characters"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# App Config
APP_URL="http://localhost:3200"
\`\`\`

**Hinweis**: \`DATABASE_URL\` und \`SESSION_SECRET\` sind zwingend erforderlich.

---

## 📊 Datenbankstruktur

Haupttabellen (vollständiges Schema in [\`db/syfte.sql\`](db/syfte.sql)):

| Tabelle | Beschreibung |
|---------|-------------|
| \`users\` | Benutzerprofile mit Gesamtersparnis |
| \`goals\` | Sparziele mit Fortschritt & Sharing |
| \`savings\` | Einzelne Sparvorgänge (Transaktionen) |
| \`achievements\` | Auszeichnungen & Meilensteine |
| \`streaks\` | Spar-Serien Tracking |
| \`friendships\` | Soziales Netzwerk |

---

## 🎨 Projektstruktur

\`\`\`
syfte/
├── pages/           # Nuxt Auto-Routing Pages
├── components/      # Vue Komponenten
├── composables/     # Wiederverwendbare Logik
├── server/          # API Routes & Utils
│   ├── api/         # REST API Endpoints
│   └── utils/       # Auth, DB, Security
├── db/              # SQL Schema & Migrationen
├── public/          # Statische Assets (PWA Icons)
└── Anleitungen/     # Projekt-Dokumentation
\`\`\`

---

## 🤝 Contributing

Contributions sind willkommen! Bitte folge diesen Schritten:

1. Fork das Repository
2. Feature Branch erstellen (\`git checkout -b feature/dein-feature\`)
3. Changes committen (Conventional Commits)
4. Tests durchführen
5. Push zum Branch (\`git push origin feature/dein-feature\`)
6. Pull Request öffnen

### Coding Guidelines
- TypeScript mit strikter Typisierung
- Vue Composition API (keine Options API)
- Async/await statt Promises
- Siehe [\`.github/copilot-instructions.md\`](.github/copilot-instructions.md) für Details

---

## 📄 Lizenz

Dieses Projekt ist lizenziert unter der [MIT License](LICENSE).

---

## 🙏 Credits

Entwickelt mit ❤️ für cleveres Sparen.

**Design**: Figma Prototype  
**Hosting**: Vercel & eigener Server
