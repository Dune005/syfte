# Syfte Backend API Endpunkte

### 🎯 Goals (Sp### 🎯 Goals (Sparziele)
- `GET /api/goals` - Alle eigenen Sparziele abrufen ✅
- `POST /api/goals/create` - Neues Sparziel erstellen (Auto-Favorite für erstes Ziel) ✅
- `GET /api/goals/:id` - Sparziel Details abrufen ✅
- `PUT /api/goals/:id` - Sparziel bearbeiten ✅
- `DELETE /api/goals/:id` - Sparziel löschen ✅
- `POST /api/goals/:id/complete` - Sparziel als erreicht markieren ✅
- `GET /api/goals/shared` - Geteilte Sparziele abrufen ✅
- `POST /api/goals/:id/share` - Sparziel mit Freunden teilen ✅
- `DELETE /api/goals/:id/share` - Sharing entfernen ✅ `GET /api/goals` - Alle eigenen Sparziele abrufen ✅
- `POST /api/goals/create` - Neues Sparziel erstellen (Auto-Favorite für erstes Ziel) ✅
- `GET /api/goals/:id` - Sparziel Details abrufen ✅
- `PUT /api/goals/:id` - Sparziel bearbeiten ✅
- `DELETE /api/goals/:id` - Sparziel löschen ✅
- `PUT /api/goals/:id/favorite` - Sparziel als Favorit markieren/entfernen ✅
- `POST /api/goals/:id/complete` - Sparziel als erreicht markieren ✅
- `GET /api/goals/:id/actions` - Verfügbare Aktionen für Sparziel abrufen ✅
- `POST /api/goals/:id/actions` - Aktionen zu Sparziel zuweisen ✅

### 🤝 Gemeinsame Sparziele (Shared Goals)
- `GET /api/goals/shared` - Geteilte Sparziele abrufen
- `POST /api/goals/shared/create` - Gemeinsames Sparziel mit Freunden erstellen ✅
- `POST /api/goals/:id/share` - Sparziel nachträglich mit Freunden teilen
- `DELETE /api/goals/:id/share` - Sharing entfernenntication Endpoints
- `POST /api/auth/register` - Benutzer registrieren (firstName, lastName, username, email, password) ✅
- `POST /api/auth/login` - Benutzer anmelden (usernameOrEmail, password) ✅
- `GET /api/auth/me` - Aktuellen Benutzer abrufen (mit Profildaten) ✅
- `POST /api/auth/logout` - Benutzer abmelden ✅
- `POST /api/auth/forgot-password` - Passwort zurücksetzen anfordern ✅
- `POST /api/auth/reset-password` - Passwort mit Token zurücksetzen ✅
- `POST /api/auth/google` - Google OAuth Login (später)

## 👤 User Management & Profile
- `PUT /api/profile/update` - Profil bearbeiten (firstName, lastName, profileImageUrl) ✅
- `POST /api/users/change-password` - Passwort ändern ✅
- `DELETE /api/users/account` - Account löschen ✅
- `GET /api/users/settings` - User Settings abrufen ✅
- `PUT /api/users/settings` - Settings ändern (timezone, dailyPushHour, locale) ✅

**Note:** Profildaten werden über `GET /api/auth/me` abgerufen und enthalten:
- Benutzerdaten (firstName, lastName, email, profileImageUrl, totalSavedChf)
- Aktuelles/Lieblings-Sparziel (currentGoal)
- Aktuelle Streak-Informationen (current, longest)
- Alle erreichten Achievements mit Bildern und Details

## � Dashboard (Hauptseite)
- `GET /api/dashboard` - Komplette Dashboard-Daten ✅
  - Benutzerdaten (Profilbild, Name, Gesamtsumme)
  - Heute gespart (CHF Betrag)
  - Alle Sparziele mit Fortschrittsbalken
  - Aktuelle Streak-Informationen
  - Verfügbare Schnell-Sparaktionen

## �🎯 Goals (Sparziele)
- `GET /api/goals` - Alle eigenen Sparziele abrufen
- `POST /api/goals/create` - Neues Sparziel erstellen (Auto-Favorite für erstes Ziel) ✅
- `GET /api/goals/:id` - Sparziel Details abrufen
- `PUT /api/goals/:id` - Sparziel bearbeiten
- `DELETE /api/goals/:id` - Sparziel löschen
- `POST /api/goals/:id/complete` - Sparziel als erreicht markieren
- `GET /api/goals/shared` - Geteilte Sparziele abrufen
- `POST /api/goals/:id/share` - Sparziel mit Freunden teilen
- `DELETE /api/goals/:id/share` - Sharing entfernen

## 💰 Savings (Sparvorgänge)
- `GET /api/savings` - Alle Sparvorgänge abrufen (mit Pagination) ✅
- `POST /api/savings/quick-add` - Schneller Betrag zum Lieblingsziel ✅
- `POST /api/savings/add-with-action` - Sparvorgang mit vordefinierter Aktion ✅
- `GET /api/savings/:id` - Sparvorgang Details ✅
- `DELETE /api/savings/:id` - Sparvorgang löschen ✅
- `GET /api/savings/stats` - Spar-Statistiken (heute, diese Woche, Monat) ✅
- `GET /api/savings/by-goal/:goalId` - Sparvorgänge für bestimmtes Ziel ✅

## 🏆 Achievements (Auszeichnungen)
- `GET /api/achievements` - Alle verfügbaren Achievements ✅
- `GET /api/achievements/earned` - Erreichte Achievements des Users ✅
- `POST /api/achievements/:id/claim` - Achievement beanspruchen ✅

## ⚡ Actions (Sparaktionen)
- `GET /api/actions` - Alle verfügbaren Sparaktionen abrufen (global + eigene) ✅
- `POST /api/actions/create` - Neue Sparaktion erstellen (für User) ✅
- `GET /api/actions/my` - Eigene erstellte Sparaktionen abrufen ✅
- `PUT /api/actions/:id` - Sparaktion bearbeiten ✅
- `DELETE /api/actions/:id` - Sparaktion deaktivieren ✅

## 📁 File Upload
- `POST /api/upload/image` - Bild hochladen (für Profile/Goals) ✅
  - Unterstützte Formate: JPG, PNG, WebP
  - Max. Dateigröße: 5MB
  - Automatische UUID-Generierung für Dateinamen

## 🔥 Streaks (Spar-Serien)
- `GET /api/streaks/current` - Aktuelle Streak des Users ✅
- `GET /api/streaks/history` - Streak-Historie ✅
- `POST /api/streaks/update` - Streak aktualisieren (automatisch bei Savings)

## 👥 Friends (Freundschaften)
- `GET /api/friends` - Freundesliste abrufen ✅
- `POST /api/friends/request` - Freundschaftsanfrage senden ✅
- `GET /api/friends/requests` - Offene Anfragen abrufen ✅
- `PUT /api/friends/request/:id/accept` - Anfrage akzeptieren ✅
- `PUT /api/friends/request/:id/decline` - Anfrage ablehnen ✅
- `DELETE /api/friends/:id` - Freundschaft beenden ✅
- `GET /api/friends/search` - Benutzer suchen (per Username) ✅
- `GET /api/friends/leaderboard` - Bestenliste aller Freunde ✅
  - Parameter: ?timeframe=all_time|month|week
  - Zeigt Ranking nach gespartem Betrag mit Positionen

## 🔔 Push Notifications (PWA)
- `POST /api/push/subscribe` - Push Subscription registrieren ✅
- `DELETE /api/push/unsubscribe` - Push Subscription entfernen ✅
- `POST /api/push/test` - Test-Benachrichtigung senden ✅
- **Feature:** Täglich automatische Push-Benachrichtigungen zur eingestellten Zeit

## 📊 Analytics & Export
- `GET /api/analytics/dashboard` - Dashboard-Daten (Übersicht) ✅
- `GET /api/analytics/savings` - Detaillierte Sparverhalten-Analyse ✅
  - **Monatstrends:** Sparsummen der letzten 12 Monate
  - **Zielaufschlüsselung:** Verteilung nach Sparzielen
  - **Aktionsanalyse:** Meistgenutzte Sparaktionen
  - **Wochentag-Muster:** Durchschnittliches Sparverhalten je Wochentag
  - **30-Tage-Trend:** Tägliche Aktivität der letzten 30 Tage
  - **Übersichtsstatistiken:** Total, Durchschnitt, Min/Max Beträge
- `GET /api/analytics/goals-progress` - Fortschritt aller Sparziele ✅
- `GET /api/export/savings` - Spardaten als CSV/JSON exportieren ✅
- `GET /api/export/goals` - Sparziele als CSV/JSON exportieren ✅

## 🛠 System/Health
- `GET /api/health` - System Health Check ✅
- `GET /api/version` - API Version Info ✅