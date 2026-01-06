# Syfte API Dokumentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:3200/api`  
**Authentifizierung:** JWT Token via httpOnly Cookie

---

## 📋 Inhaltsverzeichnis

- [🔐 Authentication](#authentication)
- [👤 User Management & Profile](#user-management--profile)
- [📊 Dashboard](#dashboard)
- [🎯 Goals (Sparziele)](#goals-sparziele)
- [💰 Savings (Sparvorgänge)](#savings-sparvorgänge)
- [⚡ Actions (Sparaktionen)](#actions-sparaktionen)
- [🔥 Streaks](#streaks)
- [👥 Friends](#friends)
- [📈 Analytics & Export](#analytics--export)
- [📁 File Upload](#file-upload)

---

## 🔐 Authentication

### POST /api/auth/register
Benutzer registrieren

**Request Body:**
```json
{
  "firstName": "Max",
  "lastName": "Mustermann",
  "username": "maxmuster",
  "email": "max@example.com",
  "password": "SecurePassword123"
}
```

**Validation:**
- `firstName`: 2-50 Zeichen
- `lastName`: 2-50 Zeichen
- `username`: 3-30 Zeichen, nur alphanumerisch und Unterstriche
- `email`: Gültige E-Mail-Adresse
- `password`: Mindestens 8 Zeichen

**Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": 1,
    "firstName": "Max",
    "lastName": "Mustermann",
    "username": "maxmuster",
    "email": "max@example.com",
    "totalSavingsChf": 0.00,
    "createdAt": "2025-01-06T10:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Validierungsfehler
- `409` - Username oder E-Mail bereits vergeben

---

### POST /api/auth/login
Benutzer anmelden

**Request Body:**
```json
{
  "usernameOrEmail": "maxmuster",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "firstName": "Max",
    "lastName": "Mustermann",
    "username": "maxmuster",
    "email": "max@example.com",
    "totalSavingsChf": 245.50,
    "profileImageUrl": null,
    "createdAt": "2025-01-06T10:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Fehlende Felder
- `401` - Falsche Anmeldedaten

---

### POST /api/auth/logout
Benutzer abmelden

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/me
Aktuellen Benutzer abrufen (authentifiziert)

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "firstName": "Max",
    "lastName": "Mustermann",
    "username": "maxmuster",
    "email": "max@example.com",
    "totalSavingsChf": 245.50,
    "profileImageUrl": "https://example.com/profile.jpg",
    "createdAt": "2025-01-06T10:00:00.000Z"
  }
}
```

**Errors:**
- `401` - Nicht authentifiziert

---

### POST /api/auth/google
Google OAuth Authentifizierung

**Request Body:**
```json
{
  "idToken": "google-id-token"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Google authentication successful",
  "user": {
    "id": 1,
    "firstName": "Max",
    "lastName": "Mustermann",
    "email": "max@example.com"
  }
}
```

**Errors:**
- `400` - Ungültiges Google Token
- `500` - Google OAuth Fehler

---

## 👤 User Management & Profile

### GET /api/users/me
Eigenen Benutzer abrufen (authentifiziert)

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "firstName": "Max",
    "lastName": "Mustermann",
    "username": "maxmuster",
    "email": "max@example.com",
    "totalSavingsChf": 245.50,
    "profileImageUrl": "https://example.com/profile.jpg",
    "createdAt": "2025-01-06T10:00:00.000Z"
  }
}
```

**Errors:**
- `401` - Nicht authentifiziert
- `404` - Benutzer nicht gefunden

---

### POST /api/users/change-password
Passwort ändern

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewSecurePassword123"
}
```

**Validation:**
- `currentPassword`: Erforderlich
- `newPassword`: Mindestens 8 Zeichen

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Errors:**
- `400` - Validierungsfehler
- `401` - Falsches aktuelles Passwort oder nicht authentifiziert

---

### DELETE /api/users/account
Benutzerkonto löschen

**Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Hinweise:**
- Löscht alle zugehörigen Daten (Goals, Savings, Streaks, etc.)
- Aktion ist unwiderruflich

**Errors:**
- `401` - Nicht authentifiziert

---

### PUT /api/profile/update
Profil bearbeiten

**Request Body:**
```json
{
  "firstName": "Max",
  "lastName": "Mustermann",
  "profileImageUrl": "https://example.com/new-profile.jpg"
}
```

**Validation:**
- `firstName`: 2-50 Zeichen (optional)
- `lastName`: 2-50 Zeichen (optional)
- `profileImageUrl`: Gültige URL oder null (optional)

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "firstName": "Max",
    "lastName": "Mustermann",
    "username": "maxmuster",
    "email": "max@example.com",
    "profileImageUrl": "https://example.com/new-profile.jpg",
    "totalSavingsChf": 245.50
  }
}
```

**Errors:**
- `400` - Validierungsfehler
- `401` - Nicht authentifiziert

---

## 📊 Dashboard

### GET /api/dashboard
Dashboard-Daten abrufen (authentifiziert)

**Response (200):**
```json
{
  "success": true,
  "dashboard": {
    "user": {
      "id": 1,
      "firstName": "Max",
      "username": "maxmuster",
      "totalSavingsChf": 245.50,
      "profileImageUrl": "https://example.com/profile.jpg"
    },
    "goals": [
      {
        "id": 3,
        "title": "MacBook Pro",
        "targetChf": 2500.00,
        "savedChf": 245.50,
        "progress": 9.82,
        "imageUrl": "https://example.com/goal.jpg",
        "isFavorite": true,
        "isCompleted": false,
        "createdAt": "2025-01-01T10:00:00.000Z"
      }
    ],
    "streak": {
      "currentCount": 7,
      "longestCount": 15,
      "lastSaveDate": "2025-01-06"
    },
    "recentSavings": [
      {
        "id": 45,
        "amount": 5.50,
        "note": "Kaffee ausgelassen",
        "createdAt": "2025-01-06T08:30:00.000Z",
        "goal": {
          "id": 3,
          "title": "MacBook Pro"
        }
      }
    ]
  }
}
```

**Hinweise:**
- Lädt nur aktive (nicht abgeschlossene) Ziele
- Zeigt die letzten 10 Sparvorgänge
- Streak-Daten basierend auf täglichem Speichern

**Errors:**
- `401` - Nicht authentifiziert

---

## 🎯 Goals (Sparziele)

### GET /api/goals/[id]
Einzelnes Sparziel abrufen

**Response (200):**
```json
{
  "success": true,
  "goal": {
    "id": 3,
    "title": "MacBook Pro",
    "targetChf": 2500.00,
    "savedChf": 245.50,
    "progress": 9.82,
    "imageUrl": "https://example.com/goal.jpg",
    "isFavorite": true,
    "isCompleted": false,
    "ownerId": 1,
    "createdAt": "2025-01-01T10:00:00.000Z"
  }
}
```

**Errors:**
- `401` - Nicht authentifiziert
- `403` - Nicht berechtigt, dieses Ziel zu sehen
- `404` - Ziel nicht gefunden

---

### POST /api/goals/create
Neues Sparziel erstellen

**Request Body:**
```json
{
  "title": "MacBook Pro",
  "targetChf": 2500.00,
  "imageUrl": "https://example.com/goal.jpg",
  "description": "Neues MacBook für die Arbeit"
}
```

**Validation:**
- `title`: 1-100 Zeichen, erforderlich
- `targetChf`: Positiver Betrag, max 999999.99, erforderlich
- `imageUrl`: Gültige URL (optional)
- `description`: Max 500 Zeichen (optional)

**Response (201):**
```json
{
  "success": true,
  "message": "Goal created successfully",
  "goal": {
    "id": 3,
    "title": "MacBook Pro",
    "targetChf": 2500.00,
    "savedChf": 0.00,
    "imageUrl": "https://example.com/goal.jpg",
    "description": "Neues MacBook für die Arbeit",
    "isFavorite": false,
    "createdAt": "2025-01-06T10:00:00.000Z"
  }
}
```

**Hinweise:**
- Wenn es das erste Ziel des Nutzers ist, wird es automatisch als Favorit gesetzt

**Errors:**
- `400` - Validierungsfehler
- `401` - Nicht authentifiziert

---

### PUT /api/goals/[id]
Sparziel bearbeiten

**Request Body:**
```json
{
  "title": "MacBook Pro 16\"",
  "targetChf": 2800.00,
  "imageUrl": "https://example.com/new-goal.jpg",
  "description": "Aktualisierte Beschreibung"
}
```

**Validation:**
- Gleiche Validierung wie bei POST /api/goals/create
- Alle Felder sind optional

**Response (200):**
```json
{
  "success": true,
  "message": "Goal updated successfully",
  "goal": {
    "id": 3,
    "title": "MacBook Pro 16\"",
    "targetChf": 2800.00,
    "savedChf": 245.50,
    "imageUrl": "https://example.com/new-goal.jpg",
    "description": "Aktualisierte Beschreibung"
  }
}
```

**Errors:**
- `400` - Validierungsfehler
- `401` - Nicht authentifiziert
- `403` - Nicht berechtigt, dieses Ziel zu bearbeiten
- `404` - Ziel nicht gefunden

---

### DELETE /api/goals/[id]
Sparziel löschen

**Response (200):**
```json
{
  "success": true,
  "message": "Goal deleted successfully"
}
```

**Hinweise:**
- Löscht auch alle zugehörigen Sparvorgänge und Actions
- Wenn es das Lieblingsziel war, wird favoriteGoalId auf null gesetzt

**Errors:**
- `401` - Nicht authentifiziert
- `403` - Nicht berechtigt, dieses Ziel zu löschen
- `404` - Ziel nicht gefunden

---

### PUT /api/goals/[id]/favorite
Sparziel als Favorit setzen/entfernen

**Request Body:**
```json
{
  "isFavorite": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Favorite status updated",
  "goal": {
    "id": 3,
    "isFavorite": true
  }
}
```

**Hinweise:**
- Nur ein Ziel kann gleichzeitig Favorit sein
- Quick Save verwendet das Lieblingsziel

**Errors:**
- `401` - Nicht authentifiziert
- `403` - Nicht berechtigt
- `404` - Ziel nicht gefunden

---

### GET /api/goals/[id]/actions
Sparaktionen für ein Ziel abrufen

**Response (200):**
```json
{
  "success": true,
  "actions": [
    {
      "id": 1,
      "title": "Kaffee ausgelassen",
      "defaultChf": 5.50,
      "iconUrl": "☕",
      "isActive": true,
      "goalId": 3,
      "createdAt": "2025-01-01T10:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `401` - Nicht authentifiziert
- `403` - Nicht berechtigt
- `404` - Ziel nicht gefunden

---

### POST /api/goals/[id]/actions
Sparaktion zu einem Ziel hinzufügen

**Request Body:**
```json
{
  "actionId": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Action assigned to goal",
  "action": {
    "id": 1,
    "title": "Kaffee ausgelassen",
    "defaultChf": 5.50,
    "goalId": 3
  }
}
```

**Hinweise:**
- Verknüpft eine existierende Action mit einem Goal
- Action muss bereits in der actions-Tabelle existieren

**Errors:**
- `400` - Action ID fehlt
- `401` - Nicht authentifiziert
- `403` - Nicht berechtigt
- `404` - Ziel oder Action nicht gefunden

---

## 💰 Savings (Sparvorgänge)

### POST /api/savings/add-with-action
Sparvorgang mit Action erstellen

**Request Body:**
```json
{
  "actionId": 1,
  "goalId": 3,
  "amount": 5.50,
  "note": "Kaffee ausgelassen"
}
```

**Validation:**
- `actionId`: Positive Integer, erforderlich
- `goalId`: Positive Integer, erforderlich
- `amount`: Positiver Betrag, max 999999.99 (optional, verwendet defaultChf wenn nicht angegeben)
- `note`: Max 300 Zeichen (optional)

**Response (201):**
```json
{
  "success": true,
  "message": "Saving added successfully",
  "saving": {
    "id": 45,
    "userId": 1,
    "goalId": 3,
    "actionId": 1,
    "amountChf": 5.50,
    "note": "Kaffee ausgelassen",
    "createdAt": "2025-01-06T08:30:00.000Z"
  },
  "goal": {
    "id": 3,
    "savedChf": 251.00,
    "targetChf": 2500.00,
    "progress": 10.04,
    "isCompleted": false
  },
  "streak": {
    "currentCount": 8,
    "longestCount": 15
  }
}
```

**Hinweise:**
- Aktualisiert automatisch das Sparziel
- Aktualisiert User-Streak
- Prüft auf neue Achievements
- Kann nicht zu abgeschlossenen Zielen hinzufügen

**Errors:**
- `400` - Validierungsfehler oder Ziel bereits erreicht
- `401` - Nicht authentifiziert
- `403` - Nicht berechtigt
- `404` - Ziel oder Action nicht gefunden

---

### POST /api/savings/quick-add
Schneller Sparvorgang (ohne Action, zum Lieblingsziel)

**Request Body:**
```json
{
  "amount": 10.00,
  "note": "Spontanes Sparen"
}
```

**Validation:**
- `amount`: Positiver Betrag, max 999999.99, erforderlich
- `note`: Max 300 Zeichen (optional)

**Response (201):**
```json
{
  "success": true,
  "message": "Saving added to favorite goal",
  "saving": {
    "id": 46,
    "userId": 1,
    "goalId": 3,
    "amountChf": 10.00,
    "note": "Spontanes Sparen",
    "createdAt": "2025-01-06T09:00:00.000Z"
  },
  "goal": {
    "id": 3,
    "savedChf": 261.00,
    "targetChf": 2500.00,
    "progress": 10.44
  },
  "streak": {
    "currentCount": 8,
    "longestCount": 15
  }
}
```

**Hinweise:**
- Verwendet automatisch das Lieblingsziel des Nutzers
- Aktualisiert Streak und prüft Achievements
- Fehler wenn kein Lieblingsziel gesetzt ist

**Errors:**
- `400` - Validierungsfehler oder kein Lieblingsziel
- `401` - Nicht authentifiziert

---

### GET /api/savings/stats
Spar-Statistiken abrufen

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalSavingsChf": 245.50,
    "totalSavings": 48,
    "goalsCount": 3,
    "completedGoalsCount": 1,
    "currentStreak": 7,
    "longestStreak": 15,
    "averageSavingChf": 5.11,
    "thisMonth": {
      "totalChf": 45.50,
      "count": 9
    },
    "thisWeek": {
      "totalChf": 15.50,
      "count": 3
    }
  }
}
```

**Errors:**
- `401` - Nicht authentifiziert

---

## ⚡ Actions (Sparaktionen)

### GET /api/actions/my
Eigene Sparaktionen abrufen

**Response (200):**
```json
{
  "success": true,
  "actions": [
    {
      "id": 1,
      "title": "Kaffee ausgelassen",
      "defaultChf": 5.50,
      "iconUrl": "☕",
      "isActive": true,
      "userId": 1,
      "createdAt": "2025-01-01T10:00:00.000Z"
    }
  ]
}
```

**Hinweise:**
- Zeigt nur aktive Aktionen
- Sortiert nach Erstellungsdatum (neueste zuerst)

**Errors:**
- `401` - Nicht authentifiziert

---

### POST /api/actions/create
Neue Sparaktion erstellen

**Request Body:**
```json
{
  "title": "Kaffee ausgelassen",
  "defaultChf": 5.50,
  "iconUrl": "☕"
}
```

**Validation:**
- `title`: 1-100 Zeichen, erforderlich
- `defaultChf`: Positiver Betrag, max 999.99, erforderlich
- `iconUrl`: Max 255 Zeichen (optional)

**Response (201):**
```json
{
  "success": true,
  "message": "Action created successfully",
  "action": {
    "id": 1,
    "title": "Kaffee ausgelassen",
    "defaultChf": 5.50,
    "iconUrl": "☕",
    "isActive": true,
    "userId": 1,
    "createdAt": "2025-01-06T10:00:00.000Z"
  }
}
```

**Errors:**
- `400` - Validierungsfehler
- `401` - Nicht authentifiziert

---

## 🔥 Streaks

### POST /api/streaks/check-new
Prüfen, ob Streak-Popup angezeigt werden soll

**Response (200):**
```json
{
  "success": true,
  "showPopup": true,
  "streak": {
    "currentCount": 8,
    "longestCount": 15,
    "lastSaveDate": "2025-01-06"
  }
}
```

**Hinweise:**
- Wird nur einmal pro Tag angezeigt (Cookie-basiert)
- Cookie `streak_popup_shown_{userId}` läuft um Mitternacht ab

**Errors:**
- `401` - Nicht authentifiziert

---

### GET /api/streaks/current
Aktuelle Streak-Daten mit Wochenübersicht

**Response (200):**
```json
{
  "success": true,
  "streak": {
    "currentCount": 8,
    "longestCount": 15,
    "lastSaveDate": "2025-01-06",
    "weekData": [true, true, false, true, true, true, true]
  }
}
```

**Hinweise:**
- `weekData`: Array von 7 Booleans (Mo-So)
- `true` = an diesem Tag gespart, `false` = nicht gespart

**Errors:**
- `401` - Nicht authentifiziert

---

## 👥 Friends

### GET /api/friends
Eigene Freunde abrufen

**Response (200):**
```json
{
  "success": true,
  "friends": [
    {
      "userId": 2,
      "username": "anna_mueller",
      "firstName": "Anna",
      "lastName": "Müller",
      "profileImageUrl": "https://example.com/anna.jpg",
      "totalSavingsChf": 350.00,
      "friendsSince": "2025-01-01T10:00:00.000Z"
    }
  ]
}
```

**Errors:**
- `401` - Nicht authentifiziert

---

### GET /api/friends/requests
Offene Freundschaftsanfragen abrufen

**Response (200):**
```json
{
  "success": true,
  "requests": [
    {
      "id": 5,
      "fromUserId": 3,
      "fromUser": {
        "username": "peter_schmidt",
        "firstName": "Peter",
        "lastName": "Schmidt",
        "profileImageUrl": "https://example.com/peter.jpg"
      },
      "status": "pending",
      "createdAt": "2025-01-05T14:30:00.000Z"
    }
  ]
}
```

**Hinweise:**
- Zeigt nur eingehende Anfragen mit Status "pending"

**Errors:**
- `401` - Nicht authentifiziert

---

### GET /api/friends/search
Benutzer suchen

**Query Parameters:**
- `query`: Suchbegriff (Username oder Name), min 2 Zeichen

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": 4,
      "username": "lisa_bauer",
      "firstName": "Lisa",
      "lastName": "Bauer",
      "profileImageUrl": "https://example.com/lisa.jpg",
      "isFriend": false,
      "hasPendingRequest": false
    }
  ]
}
```

**Hinweise:**
- Sucht nach Username, firstName und lastName
- Zeigt keine eigenen User
- Max 20 Ergebnisse

**Errors:**
- `400` - Query zu kurz oder fehlt
- `401` - Nicht authentifiziert

---

### POST /api/friends/request
Freundschaftsanfrage senden

**Request Body:**
```json
{
  "toUserId": 4
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Friend request sent",
  "request": {
    "id": 6,
    "fromUserId": 1,
    "toUserId": 4,
    "status": "pending",
    "createdAt": "2025-01-06T10:00:00.000Z"
  }
}
```

**Errors:**
- `400` - User ID fehlt oder bereits befreundet
- `401` - Nicht authentifiziert
- `404` - Zieluser nicht gefunden

---

### PUT /api/friends/request/[id]/accept
Freundschaftsanfrage akzeptieren

**Response (200):**
```json
{
  "success": true,
  "message": "Friend request accepted",
  "friendship": {
    "id": 6,
    "status": "accepted",
    "acceptedAt": "2025-01-06T10:15:00.000Z"
  }
}
```

**Hinweise:**
- Erstellt bidirektionale Freundschaft

**Errors:**
- `401` - Nicht authentifiziert
- `403` - Nicht berechtigt (nicht der Empfänger)
- `404` - Anfrage nicht gefunden

---

### PUT /api/friends/request/[id]/decline
Freundschaftsanfrage ablehnen

**Response (200):**
```json
{
  "success": true,
  "message": "Friend request declined"
}
```

**Hinweise:**
- Löscht die Anfrage aus der Datenbank

**Errors:**
- `401` - Nicht authentifiziert
- `403` - Nicht berechtigt
- `404` - Anfrage nicht gefunden

---

### DELETE /api/friends/[id]
Freundschaft beenden

**Response (200):**
```json
{
  "success": true,
  "message": "Friendship removed"
}
```

**Hinweise:**
- Löscht beide Richtungen der Freundschaft
- Geteilte Sparziele werden nicht gelöscht

**Errors:**
- `401` - Nicht authentifiziert
- `404` - Freundschaft nicht gefunden

---

## 📈 Analytics & Export

### GET /api/analytics/savings
Spar-Analytics für Charts

**Query Parameters:**
- `period`: `week` | `month` | `year` (Default: `month`)
- `goalId`: Optional - Filter nach Sparziel

**Response (200):**
```json
{
  "success": true,
  "period": "month",
  "data": [
    {
      "date": "2025-01-01",
      "amount": 15.50,
      "count": 3
    },
    {
      "date": "2025-01-02",
      "amount": 10.00,
      "count": 2
    }
  ],
  "total": {
    "amount": 245.50,
    "count": 48
  }
}
```

**Hinweise:**
- `week`: Zeigt letzte 7 Tage
- `month`: Zeigt letzte 30 Tage
- `year`: Zeigt letzte 12 Monate (gruppiert nach Monat)

**Errors:**
- `400` - Ungültiger period-Parameter
- `401` - Nicht authentifiziert

---

### GET /api/export/savings
Sparvorgänge exportieren

**Query Parameters:**
- `format`: `csv` | `json` (Default: `csv`)

**Response (200):**
- **CSV:** `text/csv` mit Datei-Download
- **JSON:** Application/json mit Daten

**CSV Format:**
```csv
Datum,Betrag (CHF),Sparziel,Aktion,Notiz
2025-01-06,5.50,MacBook Pro,Kaffee ausgelassen,
2025-01-05,10.00,MacBook Pro,,Spontanes Sparen
```

**JSON Format:**
```json
{
  "success": true,
  "savings": [
    {
      "date": "2025-01-06",
      "amount": 5.50,
      "goal": "MacBook Pro",
      "action": "Kaffee ausgelassen",
      "note": ""
    }
  ],
  "exportedAt": "2025-01-06T10:00:00.000Z",
  "totalSavings": 48,
  "totalAmount": 245.50
}
```

**Errors:**
- `400` - Ungültiges Format
- `401` - Nicht authentifiziert

---

## 📁 File Upload

### POST /api/upload/image
Bild hochladen (Profil oder Goal-Bild)

**Request Body:**
- `multipart/form-data` mit Feld `image`

**Validation:**
- Max 5MB Dateigröße
- Erlaubte Formate: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`

**Response (200):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "url": "https://example.com/uploads/1704532800000-abc123.jpg"
}
```

**Hinweise:**
- Speichert Bilder in `/public/uploads/`
- Dateinamen: `{timestamp}-{random}.{ext}`

**Errors:**
- `400` - Keine Datei oder ungültiges Format/Größe
- `401` - Nicht authentifiziert
- `500` - Upload-Fehler

---

## 🔒 Authentifizierung & Security

### JWT Token
- **Cookie Name:** `syfte_auth`
- **HttpOnly:** Ja
- **SameSite:** Lax
- **Expires:** 30 Tage
- **Algorithm:** HS256

### Rate Limiting
- **Login:** 5 Versuche / 15 Minuten pro IP
- **Register:** 3 Versuche / Stunde pro IP
- **API Calls:** 100 Requests / Minute pro User

### Fehlerbehandlung

Alle Fehler folgen diesem Format:
```json
{
  "statusCode": 400,
  "statusMessage": "Ungültige Eingabedaten",
  "data": {
    "errors": [
      {
        "code": "invalid_type",
        "path": ["email"],
        "message": "E-Mail ist ungültig"
      }
    ]
  }
}
```

**Standard Error Codes:**
- `400` - Bad Request (Validierungsfehler)
- `401` - Unauthorized (Nicht authentifiziert)
- `403` - Forbidden (Keine Berechtigung)
- `404` - Not Found (Ressource nicht gefunden)
- `409` - Conflict (Duplikat, z.B. Username bereits vergeben)
- `429` - Too Many Requests (Rate Limit)
- `500` - Internal Server Error

---

## 📝 Notizen für Entwickler

### Datenbankschema
Siehe `db/syfte.sql` für vollständiges Schema.

### Interne Funktionen (keine API-Endpoints)
- `checkAndAwardAchievements(userId)` - In `server/utils/achievements.ts`
- `updateUserStreak(userId)` - In `server/utils/streaks.ts`

Diese werden automatisch aufgerufen nach Sparvorgängen.

### Testing
Tests befinden sich in `/tests/` - ausgenommen von dieser Dokumentation.

---

**Letzte Aktualisierung:** 6. Januar 2026
