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
- [🤝 Shared Goals](#shared-goals)
- [💰 Savings (Sparvorgänge)](#savings-sparvorgänge)
- [⚡ Actions (Sparaktionen)](#actions-sparaktionen)
- [🏆 Achievements](#achievements)
- [🔥 Streaks](#streaks)
- [👥 Friends](#friends)
- [🔔 Push Notifications](#push-notifications)
- [📊 Analytics & Export](#analytics--export)
- [📁 File Upload](#file-upload)
- [🛠 System](#system)

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
    "createdAt": "2025-09-30T10:00:00.000Z"
  }
}
```

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
    "createdAt": "2025-09-30T10:00:00.000Z"
  }
}
```

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
    "createdAt": "2025-09-30T10:00:00.000Z",
    "currentGoal": {
      "id": 3,
      "title": "MacBook Pro",
      "targetChf": 2500.00,
      "currentChf": 245.50,
      "progress": 9.82
    },
    "currentStreak": 7,
    "longestStreak": 15,
    "achievementsCount": 8
  }
}
```

### POST /api/auth/logout
Benutzer abmelden

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /api/auth/forgot-password
Passwort zurücksetzen anfordern

**Request Body:**
```json
{
  "email": "max@example.com"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset email sent"
}
```

### POST /api/auth/reset-password
Passwort mit Token zurücksetzen

**Request Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "NewSecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password reset successfully"
}
```

---

## 👤 User Management & Profile

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

### POST /api/users/change-password
Passwort ändern

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewSecurePassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

### GET /api/users/settings
User Settings abrufen

**Response (200):**
```json
{
  "success": true,
  "settings": {
    "timezone": "Europe/Zurich",
    "dailyPushHour": 18,
    "locale": "de-CH",
    "pushEnabled": true,
    "weekendReminders": false
  }
}
```

### PUT /api/users/settings
Settings ändern

**Request Body:**
```json
{
  "timezone": "Europe/Zurich",
  "dailyPushHour": 20,
  "locale": "de-CH",
  "pushEnabled": true,
  "weekendReminders": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "settings": {
    "timezone": "Europe/Zurich",
    "dailyPushHour": 20,
    "locale": "de-CH",
    "pushEnabled": true,
    "weekendReminders": true
  }
}
```

---

## 📊 Dashboard

### GET /api/dashboard
Komplette Dashboard-Daten

**Response (200):**
```json
{
  "success": true,
  "dashboard": {
    "user": {
      "firstName": "Max",
      "lastName": "Mustermann",
      "profileImageUrl": "https://example.com/profile.jpg",
      "totalSavingsChf": 245.50
    },
    "todaySaved": 15.50,
    "currentStreak": 7,
    "longestStreak": 15,
    "favoriteGoal": {
      "id": 3,
      "title": "MacBook Pro",
      "targetChf": 2500.00,
      "currentChf": 245.50,
      "progress": 9.82,
      "imageUrl": "https://example.com/macbook.jpg"
    },
    "allGoals": [
      {
        "id": 3,
        "title": "MacBook Pro",
        "targetChf": 2500.00,
        "currentChf": 245.50,
        "progress": 9.82,
        "isFavorite": true
      }
    ],
    "quickActions": [
      {
        "id": 1,
        "title": "Kaffee ausgelassen",
        "defaultChf": 4.50,
        "icon": "coffee"
      },
      {
        "id": 2,
        "title": "Zuhause gekocht",
        "defaultChf": 12.00,
        "icon": "home"
      }
    ],
    "recentSavings": [
      {
        "id": 15,
        "chf": 15.50,
        "description": "Kaffee ausgelassen",
        "createdAt": "2025-09-30T14:30:00.000Z",
        "goalTitle": "MacBook Pro"
      }
    ]
  }
}
```

---

## 🎯 Goals (Sparziele)

### GET /api/goals
Alle eigenen Sparziele abrufen

**Query Parameters:**
- `status` (optional): `active`, `completed`, `paused`
- `sort` (optional): `created_desc`, `created_asc`, `progress_desc`, `progress_asc`

**Response (200):**
```json
{
  "success": true,
  "goals": [
    {
      "id": 3,
      "title": "MacBook Pro",
      "description": "Neuer Laptop für die Arbeit",
      "targetChf": 2500.00,
      "currentChf": 245.50,
      "progress": 9.82,
      "status": "active",
      "isFavorite": true,
      "imageUrl": "https://example.com/macbook.jpg",
      "isShared": false,
      "createdAt": "2025-08-15T10:00:00.000Z",
      "updatedAt": "2025-09-30T14:30:00.000Z"
    }
  ],
  "totalGoals": 1,
  "completedGoals": 0,
  "totalSavedAmount": 245.50
}
```

### POST /api/goals/create
Neues Sparziel erstellen

**Request Body:**
```json
{
  "title": "Ferien in Italien",
  "description": "2 Wochen Toskana",
  "targetChf": 3000.00,
  "imageUrl": "https://example.com/italy.jpg"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Goal created successfully",
  "goal": {
    "id": 4,
    "title": "Ferien in Italien",
    "description": "2 Wochen Toskana",
    "targetChf": 3000.00,
    "currentChf": 0.00,
    "progress": 0.00,
    "status": "active",
    "isFavorite": false,
    "imageUrl": "https://example.com/italy.jpg",
    "isShared": false,
    "createdAt": "2025-09-30T15:00:00.000Z"
  }
}
```

### GET /api/goals/:id
Sparziel Details abrufen

**Response (200):**
```json
{
  "success": true,
  "goal": {
    "id": 3,
    "title": "MacBook Pro",
    "description": "Neuer Laptop für die Arbeit",
    "targetChf": 2500.00,
    "currentChf": 245.50,
    "progress": 9.82,
    "status": "active",
    "isFavorite": true,
    "imageUrl": "https://example.com/macbook.jpg",
    "isShared": false,
    "createdAt": "2025-08-15T10:00:00.000Z",
    "updatedAt": "2025-09-30T14:30:00.000Z",
    "recentSavings": [
      {
        "id": 15,
        "chf": 15.50,
        "description": "Kaffee ausgelassen",
        "createdAt": "2025-09-30T14:30:00.000Z"
      }
    ],
    "savingsCount": 12,
    "averageSaving": 20.46
  }
}
```

### PUT /api/goals/:id
Sparziel bearbeiten

**Request Body:**
```json
{
  "title": "MacBook Pro M3",
  "description": "Neuer Laptop mit M3 Chip",
  "targetChf": 2800.00,
  "imageUrl": "https://example.com/macbook-m3.jpg"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Goal updated successfully",
  "goal": {
    "id": 3,
    "title": "MacBook Pro M3",
    "description": "Neuer Laptop mit M3 Chip",
    "targetChf": 2800.00,
    "currentChf": 245.50,
    "progress": 8.77,
    "imageUrl": "https://example.com/macbook-m3.jpg"
  }
}
```

### PUT /api/goals/:id/favorite
Sparziel als Favorit markieren/entfernen

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
  "message": "Goal favorite status updated",
  "goal": {
    "id": 3,
    "isFavorite": true
  }
}
```

### POST /api/goals/:id/complete
Sparziel als erreicht markieren

**Response (200):**
```json
{
  "success": true,
  "message": "Goal completed successfully",
  "goal": {
    "id": 3,
    "status": "completed",
    "completedAt": "2025-09-30T15:30:00.000Z"
  },
  "achievementUnlocked": {
    "id": 5,
    "title": "Ziel Erreicht",
    "description": "Erstes Sparziel erfolgreich abgeschlossen"
  }
}
```

### DELETE /api/goals/:id
Sparziel löschen

**Response (200):**
```json
{
  "success": true,
  "message": "Goal deleted successfully"
}
```

### GET /api/goals/:id/actions
Verfügbare Aktionen für Sparziel abrufen

**Response (200):**
```json
{
  "success": true,
  "actions": [
    {
      "id": 1,
      "title": "Kaffee ausgelassen",
      "defaultChf": 4.50,
      "icon": "coffee",
      "isAssigned": true
    },
    {
      "id": 2,
      "title": "Zuhause gekocht",
      "defaultChf": 12.00,
      "icon": "home",
      "isAssigned": false
    }
  ]
}
```

### POST /api/goals/:id/actions
Aktionen zu Sparziel zuweisen

**Request Body:**
```json
{
  "actionIds": [1, 2, 5]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Actions assigned to goal",
  "assignedCount": 3
}
```

---

## 🤝 Shared Goals

### GET /api/goals/shared
Geteilte Sparziele abrufen

**Response (200):**
```json
{
  "success": true,
  "sharedGoals": [
    {
      "id": 7,
      "title": "Gemeinsame Ferien",
      "description": "Spanien Trip mit Freunden",
      "targetChf": 5000.00,
      "currentChf": 1250.00,
      "progress": 25.00,
      "owner": {
        "id": 2,
        "username": "sarah_m",
        "firstName": "Sarah"
      },
      "participants": [
        {
          "id": 1,
          "username": "maxmuster",
          "firstName": "Max",
          "contributedChf": 320.00
        },
        {
          "id": 2,
          "username": "sarah_m",
          "firstName": "Sarah",
          "contributedChf": 930.00
        }
      ],
      "isOwner": false,
      "createdAt": "2025-09-20T10:00:00.000Z"
    }
  ]
}
```

### POST /api/goals/shared/create
Gemeinsames Sparziel mit Freunden erstellen

**Request Body:**
```json
{
  "title": "Ski Wochenende",
  "description": "Gemeinsamer Trip nach Zermatt",
  "targetChf": 2000.00,
  "imageUrl": "https://example.com/skiing.jpg",
  "friendIds": [2, 5, 8]
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Shared goal created successfully",
  "goal": {
    "id": 8,
    "title": "Ski Wochenende",
    "description": "Gemeinsamer Trip nach Zermatt",
    "targetChf": 2000.00,
    "currentChf": 0.00,
    "progress": 0.00,
    "isShared": true,
    "participants": [
      {
        "id": 1,
        "username": "maxmuster",
        "firstName": "Max"
      },
      {
        "id": 2,
        "username": "sarah_m",
        "firstName": "Sarah"
      }
    ]
  }
}
```

---

## 💰 Savings (Sparvorgänge)

### GET /api/savings
Alle Sparvorgänge abrufen

**Query Parameters:**
- `page` (optional): Seitenzahl (default: 1)
- `limit` (optional): Anzahl pro Seite (default: 20)
- `goalId` (optional): Filter nach Sparziel
- `startDate` (optional): Startdatum (ISO string)
- `endDate` (optional): Enddatum (ISO string)

**Response (200):**
```json
{
  "success": true,
  "savings": [
    {
      "id": 15,
      "chf": 15.50,
      "description": "Kaffee ausgelassen",
      "goalId": 3,
      "goalTitle": "MacBook Pro",
      "actionId": 1,
      "actionTitle": "Kaffee ausgelassen",
      "createdAt": "2025-09-30T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  },
  "totals": {
    "totalAmount": 245.50,
    "totalSavings": 45
  }
}
```

### POST /api/savings/quick-add
Schneller Betrag zum Lieblingsziel

**Request Body:**
```json
{
  "chf": 25.00,
  "description": "Mittag zuhause"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Saving added successfully",
  "saving": {
    "id": 16,
    "chf": 25.00,
    "description": "Mittag zuhause",
    "goalId": 3,
    "goalTitle": "MacBook Pro",
    "createdAt": "2025-09-30T15:45:00.000Z"
  },
  "goalProgress": {
    "goalId": 3,
    "newProgress": 10.82,
    "totalAmount": 270.50
  },
  "streakUpdate": {
    "currentStreak": 8,
    "streakIncreased": true
  }
}
```

### POST /api/savings/add-with-action
Sparvorgang mit vordefinierter Aktion

**Request Body:**
```json
{
  "actionId": 1,
  "chf": 4.50,
  "goalId": 3,
  "description": "Kaffee ausgelassen (custom note)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Saving added with action",
  "saving": {
    "id": 17,
    "chf": 4.50,
    "description": "Kaffee ausgelassen (custom note)",
    "goalId": 3,
    "goalTitle": "MacBook Pro",
    "actionId": 1,
    "actionTitle": "Kaffee ausgelassen",
    "createdAt": "2025-09-30T16:00:00.000Z"
  }
}
```

### GET /api/savings/stats
Spar-Statistiken

**Query Parameters:**
- `period` (optional): `today`, `week`, `month`, `year` (default: `month`)

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "period": "month",
    "totalAmount": 245.50,
    "savingsCount": 12,
    "averagePerSaving": 20.46,
    "averagePerDay": 8.18,
    "topGoal": {
      "id": 3,
      "title": "MacBook Pro",
      "amount": 245.50
    },
    "topAction": {
      "id": 1,
      "title": "Kaffee ausgelassen",
      "count": 8,
      "totalAmount": 36.00
    },
    "dailyBreakdown": [
      {
        "date": "2025-09-30",
        "amount": 40.00,
        "count": 2
      }
    ]
  }
}
```

### DELETE /api/savings/:id
Sparvorgang löschen

**Response (200):**
```json
{
  "success": true,
  "message": "Saving deleted successfully",
  "goalUpdate": {
    "goalId": 3,
    "newProgress": 9.64,
    "newAmount": 230.00
  }
}
```

---

## ⚡ Actions (Sparaktionen)

### GET /api/actions
Alle verfügbaren Sparaktionen abrufen

**Response (200):**
```json
{
  "success": true,
  "actions": [
    {
      "id": 1,
      "title": "Kaffee ausgelassen",
      "description": "Anstatt Kaffee zu kaufen, zuhause getrunken",
      "defaultChf": 4.50,
      "icon": "coffee",
      "category": "food",
      "isGlobal": true,
      "creatorId": null,
      "usageCount": 145
    },
    {
      "id": 15,
      "title": "Eigene Sparaktion",
      "description": "Meine persönliche Sparaktion",
      "defaultChf": 10.00,
      "icon": "custom",
      "category": "other",
      "isGlobal": false,
      "creatorId": 1,
      "usageCount": 3
    }
  ]
}
```

### POST /api/actions/create
Neue Sparaktion erstellen

**Request Body:**
```json
{
  "title": "Öffentlicher Transport",
  "description": "Anstatt Taxi genommen",
  "defaultChf": 18.00,
  "icon": "train",
  "category": "transport"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Action created successfully",
  "action": {
    "id": 16,
    "title": "Öffentlicher Transport",
    "description": "Anstatt Taxi genommen",
    "defaultChf": 18.00,
    "icon": "train",
    "category": "transport",
    "isGlobal": false,
    "creatorId": 1,
    "isActive": true,
    "createdAt": "2025-09-30T16:30:00.000Z"
  }
}
```

### GET /api/actions/my
Eigene erstellte Sparaktionen abrufen

**Response (200):**
```json
{
  "success": true,
  "actions": [
    {
      "id": 15,
      "title": "Eigene Sparaktion",
      "description": "Meine persönliche Sparaktion",
      "defaultChf": 10.00,
      "icon": "custom",
      "category": "other",
      "isActive": true,
      "usageCount": 3,
      "createdAt": "2025-09-25T10:00:00.000Z"
    }
  ]
}
```

### PUT /api/actions/:id
Sparaktion bearbeiten

**Request Body:**
```json
{
  "title": "Öffentlicher Transport (updated)",
  "description": "Anstatt Taxi oder Uber genommen",
  "defaultChf": 20.00
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Action updated successfully",
  "action": {
    "id": 16,
    "title": "Öffentlicher Transport (updated)",
    "description": "Anstatt Taxi oder Uber genommen",
    "defaultChf": 20.00
  }
}
```

### DELETE /api/actions/:id
Sparaktion deaktivieren

**Response (200):**
```json
{
  "success": true,
  "message": "Action deactivated successfully",
  "actionId": 16
}
```

---

## 🏆 Achievements

### GET /api/achievements
Alle verfügbaren Achievements

**Response (200):**
```json
{
  "success": true,
  "achievements": [
    {
      "id": 1,
      "title": "Erste Schritte",
      "description": "Erstes Sparziel erstellt",
      "type": "goals_created",
      "targetValue": 1,
      "points": 10,
      "icon": "trophy",
      "rarity": "common",
      "isUnlocked": true,
      "unlockedAt": "2025-08-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "title": "Sparfuchs",
      "description": "100 CHF gespart",
      "type": "savings_total",
      "targetValue": 100,
      "points": 25,
      "icon": "piggy-bank",
      "rarity": "uncommon",
      "isUnlocked": false,
      "progress": 73.5
    }
  ]
}
```

### GET /api/achievements/unlocked
Erreichte Achievements des Users

**Response (200):**
```json
{
  "success": true,
  "achievements": [
    {
      "id": 1,
      "title": "Erste Schritte",
      "description": "Erstes Sparziel erstellt",
      "points": 10,
      "icon": "trophy",
      "rarity": "common",
      "unlockedAt": "2025-08-15T10:30:00.000Z"
    }
  ],
  "totalPoints": 85,
  "totalAchievements": 8
}
```

### GET /api/achievements/progress
Achievement-Fortschritt

**Response (200):**
```json
{
  "success": true,
  "progress": [
    {
      "achievementId": 2,
      "currentValue": 245.50,
      "targetValue": 100,
      "progressPercentage": 100,
      "isCompleted": true
    },
    {
      "achievementId": 5,
      "currentValue": 7,
      "targetValue": 30,
      "progressPercentage": 23.33,
      "isCompleted": false
    }
  ]
}
```

### POST /api/achievements/check
Neue Achievements prüfen und freischalten

**Response (200):**
```json
{
  "success": true,
  "newlyUnlocked": [
    {
      "id": 2,
      "title": "Sparfuchs",
      "description": "100 CHF gespart",
      "points": 25,
      "icon": "piggy-bank",
      "unlockedAt": "2025-09-30T16:45:00.000Z"
    }
  ],
  "checkedAt": "2025-09-30T16:45:00.000Z"
}
```

---

## 🔥 Streaks

### GET /api/streaks/current
Aktuelle Streak des Users

**Response (200):**
```json
{
  "success": true,
  "streak": {
    "currentStreak": 7,
    "longestStreak": 15,
    "lastSavingDate": "2025-09-30",
    "isActive": true,
    "streakStartDate": "2025-09-24"
  }
}
```

### GET /api/streaks/history
Streak-Historie

**Query Parameters:**
- `page` (optional): Seitenzahl (default: 1)
- `limit` (optional): Anzahl pro Seite (default: 10)

**Response (200):**
```json
{
  "success": true,
  "history": [
    {
      "id": 3,
      "streakLength": 15,
      "startDate": "2025-08-01",
      "endDate": "2025-08-15",
      "isActive": false
    },
    {
      "id": 4,
      "streakLength": 7,
      "startDate": "2025-09-24",
      "endDate": null,
      "isActive": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5
  }
}
```

### GET /api/streaks/stats
Umfassende Streak-Statistiken

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "currentStreak": 7,
    "longestStreak": 15,
    "totalStreaks": 5,
    "averageStreakLength": 6.8,
    "totalStreakDays": 34,
    "streakFrequency": 0.85,
    "milestones": [
      {
        "length": 7,
        "achievedAt": "2025-09-30",
        "title": "Eine Woche Streak"
      }
    ]
  }
}
```

### POST /api/streaks/check
Streak-Status überprüfen und aktualisieren

**Response (200):**
```json
{
  "success": true,
  "streak": {
    "currentStreak": 8,
    "isActive": true,
    "lastChecked": "2025-09-30T17:00:00.000Z"
  },
  "changes": {
    "streakChanged": true,
    "previousStreak": 7,
    "newStreak": 8
  }
}
```

### GET /api/streaks/leaderboard
Streak-Bestenliste der Freunde

**Query Parameters:**
- `type` (optional): `current`, `longest`, `total_days` (default: `current`)
- `limit` (optional): Anzahl Einträge (default: 10)

**Response (200):**
```json
{
  "success": true,
  "leaderboard": [
    {
      "userId": 2,
      "username": "sarah_m",
      "firstName": "Sarah",
      "currentStreak": 12,
      "longestStreak": 25,
      "totalStreakDays": 67,
      "rank": 1
    },
    {
      "userId": 1,
      "username": "maxmuster",
      "firstName": "Max",
      "currentStreak": 7,
      "longestStreak": 15,
      "totalStreakDays": 34,
      "rank": 2
    }
  ],
  "leaderboardType": "current",
  "userRank": 2
}
```

---

## 👥 Friends

### GET /api/friends
Freundesliste abrufen

**Response (200):**
```json
{
  "success": true,
  "friends": [
    {
      "id": 12,
      "userId": 2,
      "username": "sarah_m",
      "firstName": "Sarah",
      "lastName": "Mueller",
      "profileImageUrl": "https://example.com/sarah.jpg",
      "totalSavingsChf": 567.80,
      "currentStreak": 12,
      "friendshipDate": "2025-08-20T10:00:00.000Z",
      "status": "active"
    }
  ],
  "totalFriends": 1
}
```

### POST /api/friends/request
Freundschaftsanfrage senden

**Request Body:**
```json
{
  "username": "sarah_m"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Friend request sent to sarah_m",
  "requestId": 5
}
```

### GET /api/friends/requests
Offene Anfragen abrufen

**Response (200):**
```json
{
  "success": true,
  "requests": [
    {
      "id": 6,
      "fromUserId": 3,
      "fromUser": {
        "username": "peter_k",
        "firstName": "Peter",
        "lastName": "Klein",
        "profileImageUrl": "https://example.com/peter.jpg"
      },
      "status": "pending",
      "createdAt": "2025-09-29T14:20:00.000Z"
    }
  ],
  "totalRequests": 1
}
```

### PUT /api/friends/requests/:id/accept
Anfrage akzeptieren

**Response (200):**
```json
{
  "success": true,
  "message": "Friend request accepted",
  "friendship": {
    "id": 13,
    "friendId": 3,
    "username": "peter_k",
    "firstName": "Peter"
  }
}
```

### PUT /api/friends/requests/:id/decline
Anfrage ablehnen

**Response (200):**
```json
{
  "success": true,
  "message": "Friend request declined"
}
```

### DELETE /api/friends/:id
Freundschaft beenden

**Response (200):**
```json
{
  "success": true,
  "message": "Friendship with sarah_m removed"
}
```

### GET /api/friends/search
Benutzer suchen

**Query Parameters:**
- `q` (required): Suchbegriff (Username)

**Response (200):**
```json
{
  "success": true,
  "users": [
    {
      "id": 4,
      "username": "anna_s",
      "firstName": "Anna",
      "lastName": "Schmidt",
      "profileImageUrl": "https://example.com/anna.jpg",
      "friendshipStatus": "none"
    }
  ],
  "totalResults": 1
}
```

### GET /api/friends/leaderboard
Bestenliste aller Freunde

**Query Parameters:**
- `timeframe` (optional): `all_time`, `month`, `week` (default: `all_time`)

**Response (200):**
```json
{
  "success": true,
  "leaderboard": [
    {
      "userId": 2,
      "username": "sarah_m",
      "firstName": "Sarah",
      "totalSavings": 567.80,
      "savingsCount": 45,
      "currentStreak": 12,
      "rank": 1
    },
    {
      "userId": 1,
      "username": "maxmuster",
      "firstName": "Max",
      "totalSavings": 245.50,
      "savingsCount": 12,
      "currentStreak": 7,
      "rank": 2
    }
  ],
  "timeframe": "all_time",
  "userRank": 2
}
```

---

## 🔔 Push Notifications

### POST /api/push/subscribe
Push Subscription registrieren

**Request Body:**
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BGtITk5...",
      "auth": "tBHItJI5..."
    }
  },
  "notificationTypes": ["daily_reminder", "goal_progress", "achievement_unlocked"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Push notifications subscribed successfully",
  "subscriptionId": 8
}
```

### DELETE /api/push/unsubscribe
Push Subscription entfernen

**Request Body (optional):**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Push notifications unsubscribed successfully"
}
```

### GET /api/push/subscriptions
Benutzer-Subscriptions abrufen

**Response (200):**
```json
{
  "success": true,
  "subscriptions": [
    {
      "id": 8,
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "notificationTypes": ["daily_reminder", "goal_progress"],
      "isActive": true,
      "createdAt": "2025-09-30T10:00:00.000Z"
    }
  ]
}
```

### POST /api/push/test
Test-Benachrichtigung senden

**Request Body:**
```json
{
  "message": "Test notification from Syfte app"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Test notification sent successfully",
  "sentCount": 2
}
```

### PUT /api/push/settings
Push-Notification Settings ändern

**Request Body:**
```json
{
  "notificationTypes": ["daily_reminder", "goal_progress", "achievement_unlocked"],
  "dailyReminderTime": "18:00",
  "enableWeekendReminders": false
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Push notification settings updated successfully"
}
```

---

## 📊 Analytics & Export

### GET /api/analytics/savings
Detaillierte Sparverhalten-Analyse

**Query Parameters:**
- `period` (optional): `7d`, `30d`, `90d`, `1y` (default: `30d`)
- `includeDaily` (optional): `true`, `false` (default: `false`)
- `includeCategories` (optional): `true`, `false` (default: `false`)

**Response (200):**
```json
{
  "success": true,
  "analytics": {
    "totalSavings": 245.50,
    "averageDaily": 8.18,
    "savingsCount": 12,
    "period": "30d",
    "growthRate": 15.3,
    "topGoals": [
      {
        "goalId": 3,
        "title": "MacBook Pro",
        "amount": 245.50,
        "percentage": 100
      }
    ],
    "topActions": [
      {
        "actionId": 1,
        "title": "Kaffee ausgelassen",
        "count": 8,
        "totalAmount": 36.00
      }
    ],
    "dailyBreakdown": [
      {
        "date": "2025-09-30",
        "amount": 15.50,
        "count": 1
      }
    ]
  }
}
```

### GET /api/analytics/goals
Sparziele-Analytics

**Response (200):**
```json
{
  "success": true,
  "analytics": {
    "totalGoals": 3,
    "activeGoals": 2,
    "completedGoals": 1,
    "totalTargetAmount": 7500.00,
    "totalSavedAmount": 245.50,
    "averageProgress": 32.7,
    "goalProgress": [
      {
        "goalId": 3,
        "title": "MacBook Pro",
        "progress": 9.82,
        "daysActive": 46,
        "averageDaily": 5.34
      }
    ]
  }
}
```

### GET /api/export/savings
Spardaten exportieren

**Query Parameters:**
- `format` (optional): `csv`, `json` (default: `csv`)
- `startDate` (optional): ISO string
- `endDate` (optional): ISO string
- `goalId` (optional): Filter nach Sparziel

**Response (200) - CSV:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="savings-export-2025-09-30.csv"

Date,Amount,Description,Goal,Action,Created At
2025-09-30,15.50,Kaffee ausgelassen,MacBook Pro,Kaffee ausgelassen,2025-09-30T14:30:00.000Z
```

**Response (200) - JSON:**
```json
{
  "savings": [
    {
      "id": 15,
      "chf": 15.50,
      "description": "Kaffee ausgelassen",
      "goalTitle": "MacBook Pro",
      "actionTitle": "Kaffee ausgelassen",
      "createdAt": "2025-09-30T14:30:00.000Z"
    }
  ],
  "exportInfo": {
    "format": "json",
    "exportDate": "2025-09-30T17:30:00.000Z",
    "totalRecords": 1,
    "dateRange": {
      "startDate": "2025-09-01T00:00:00.000Z",
      "endDate": "2025-09-30T23:59:59.000Z"
    }
  }
}
```

### GET /api/export/goals
Sparziele exportieren

**Query Parameters:**
- `format` (optional): `csv`, `json` (default: `csv`)
- `includeDetails` (optional): `true`, `false` (default: `false`)

**Response (200) - JSON:**
```json
{
  "goals": [
    {
      "id": 3,
      "title": "MacBook Pro",
      "targetChf": 2500.00,
      "currentChf": 245.50,
      "progress": 9.82,
      "status": "active",
      "createdAt": "2025-08-15T10:00:00.000Z"
    }
  ],
  "exportInfo": {
    "format": "json",
    "exportDate": "2025-09-30T17:30:00.000Z",
    "totalRecords": 1
  }
}
```

### GET /api/export/profile
Komplette Profildaten exportieren

**Response (200):**
```json
{
  "profile": {
    "username": "maxmuster",
    "email": "max@example.com",
    "firstName": "Max",
    "lastName": "Mustermann",
    "totalSavingsChf": 245.50,
    "memberSince": "2025-08-15T10:00:00.000Z"
  },
  "goals": [
    {
      "title": "MacBook Pro",
      "targetChf": 2500.00,
      "currentChf": 245.50,
      "status": "active"
    }
  ],
  "savings": [
    {
      "chf": 15.50,
      "description": "Kaffee ausgelassen",
      "createdAt": "2025-09-30T14:30:00.000Z"
    }
  ],
  "achievements": [
    {
      "title": "Erste Schritte",
      "unlockedAt": "2025-08-15T10:30:00.000Z"
    }
  ],
  "exportInfo": {
    "exportDate": "2025-09-30T17:30:00.000Z",
    "exportType": "complete_profile"
  }
}
```

---

## 📁 File Upload

### POST /api/upload/image
Bild hochladen

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `image`
- Supported formats: JPG, PNG, WebP
- Max file size: 5MB

**Response (200):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "imageUrl": "https://example.com/uploads/12345678-1234-1234-1234-123456789012.jpg",
  "filename": "12345678-1234-1234-1234-123456789012.jpg",
  "size": 245760,
  "mimeType": "image/jpeg"
}
```

---

## 🛠 System

### GET /api/health
System Health Check

**Response (200):**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-09-30T17:45:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "storage": "available"
  },
  "version": "1.0.0"
}
```

---

## 🚨 Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE",
  "details": {}
}
```

### HTTP Status Codes
- **200**: OK - Request erfolgreich
- **201**: Created - Ressource erstellt
- **400**: Bad Request - Ungültige Anfrage
- **401**: Unauthorized - Authentifizierung erforderlich
- **403**: Forbidden - Keine Berechtigung
- **404**: Not Found - Ressource nicht gefunden
- **422**: Unprocessable Entity - Validierungsfehler
- **429**: Too Many Requests - Rate Limit erreicht
- **500**: Internal Server Error - Serverfehler

### Häufige Error Codes
- `INVALID_INPUT` - Eingabedaten ungültig
- `USER_NOT_FOUND` - Benutzer existiert nicht
- `GOAL_NOT_FOUND` - Sparziel nicht gefunden
- `INSUFFICIENT_PERMISSIONS` - Keine Berechtigung
- `VALIDATION_ERROR` - Datenvalidierung fehlgeschlagen
- `AUTHENTICATION_REQUIRED` - Login erforderlich
- `RATE_LIMIT_EXCEEDED` - Zu viele Anfragen

---

## 🔒 Authentifizierung

Die API verwendet JWT-Tokens, die als httpOnly Cookies gesetzt werden. Nach erfolgreichem Login wird automatisch ein Cookie gesetzt, das bei allen nachfolgenden Requests mitgesendet wird.

**Cookie Name:** `syfte-auth-token`  
**Security:** httpOnly, secure (in Production), sameSite: 'lax'

Für Frontend-Entwicklung ist keine manuelle Token-Verwaltung nötig - der Browser sendet das Cookie automatisch mit.