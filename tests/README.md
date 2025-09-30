# Syfte API Test Suite

## Übersicht

Dieses Verzeichnis enthält eine umfassende Test-Suite für alle Syfte API-Endpunkte. Die Tests verwenden Vitest und führen echte HTTP-Requests gegen den lokalen Development-Server aus.

## Test-Struktur

### Core-Tests (bereits implementiert)
- ✅ `auth/` - Authentifizierung und Benutzerverwaltung (12 Endpunkte)
- ✅ `dashboard/` - Dashboard-Daten (1 Endpunkt)
- ✅ `profile/` - Profilverwaltung (2 Endpunkte)
- ✅ `users/` - Benutzer-Settings (3 Endpunkte)

### Neue Tests (komplett implementiert)
- ✅ `goals/goals-management.test.ts` - Sparziele CRUD (7 Endpunkte)
- ✅ `goals/goals-sharing.test.ts` - Geteilte Sparziele (6 Endpunkte)
- ✅ `savings/savings-management.test.ts` - Sparvorgänge (7 Endpunkte)
- ✅ `actions/actions-management.test.ts` - Sparaktionen (7 Endpunkte)
- ✅ `friends/friends-management.test.ts` - Freundschaften (8 Endpunkte)
- ✅ `analytics/analytics-export.test.ts` - Analytics & Export (8 Endpunkte)
- ✅ `achievements/achievements.test.ts` - Gamification (4 Endpunkte)
- ✅ `push/push-notifications.test.ts` - Push-Benachrichtigungen (6 Endpunkte)
- ✅ `streaks/streaks.test.ts` - Spar-Serien (5 Endpunkte)

## Test-Features

### Authentifizierung
- JWT-Token basierte Authentifizierung
- HttpOnly Cookie Support
- Automatische Benutzer-Erstellung und Cleanup

### Datenbereinigung
- Automatische Datenbankbereinigung nach jedem Test
- Tracking aller erstellten Testdaten
- Benutzer-spezifisches Cleanup

### Test-Utilities
- `generateTestUser()` - Erstellt zufällige Testbenutzer
- `testDataTracker` - Verfolgt erstellte Daten für Cleanup
- Realistische Testdaten-Generatoren

### Mocking
- Web-Push Service (für Push-Notifications)
- Externe Services (File Upload, etc.)

## Test-Kategorien

### 1. CRUD-Operationen
- **Create**: Erstellung neuer Ressourcen
- **Read**: Abrufen von Daten (Listen, Details)
- **Update**: Aktualisierung bestehender Daten
- **Delete**: Löschen/Deaktivierung

### 2. Authentifizierung & Autorisierung
- Unauthorisierte Zugriffe (401)
- Fehlende Berechtigungen (403)
- Ressourcen-Ownership (404)

### 3. Datenvalidierung
- Input-Validierung (422)
- Schema-Validierung
- Edge Cases und Grenzwerte

### 4. Business Logic
- Berechnungen (Fortschritt, Statistiken)
- Beziehungen zwischen Entitäten
- Status-Übergänge

### 5. Performance & Pagination
- Große Datenmengen
- Paginierung
- Filterung und Sortierung

## Ausführung

### Alle Tests
```bash
npm run test
```

### Spezifische Test-Kategorien
```bash
# Nur Authentifizierung
npm run test auth

# Nur Sparziele
npm run test goals

# Nur neue Endpoints
npm run test -- goals savings actions friends analytics achievements push streaks
```

### Development-Server starten
```bash
npm run dev
# Server läuft auf http://localhost:3200
```

## Test-Konfiguration

### Environment
- **Base URL**: `http://localhost:3200`
- **Database**: Separate Test-Datenbank
- **Cleanup**: Automatisch nach jedem Test

### Vitest Config
- **Environment**: Node.js
- **Timeout**: 30 Sekunden pro Test
- **Setup**: `tests/setup.ts`
- **Teardown**: Automatische Datenbankbereinigung

## Test-Metriken

### Endpoint-Abdeckung
- **Gesamt**: 54/54 Endpunkte (100%)
- **Authentifizierung**: 8/8 (100%)
- **Sparziele**: 13/13 (100%)
- **Sparvorgänge**: 7/7 (100%)
- **Sparaktionen**: 7/7 (100%)
- **Freundschaften**: 8/8 (100%)
- **Analytics/Export**: 8/8 (100%)
- **Achievements**: 4/4 (100%)
- **Push-Notifications**: 6/6 (100%)
- **Streaks**: 5/5 (100%)

### Test-Typen
- **Unit Tests**: API-Endpunkt Logik
- **Integration Tests**: End-to-End Workflows
- **Authentication Tests**: Sicherheit & Zugriffskontrolle
- **Validation Tests**: Input/Output Validierung
- **Business Logic Tests**: Domänen-spezifische Regeln

## Best Practices

### Test-Isolation
- Jeder Test ist unabhängig
- Keine geteilten Daten zwischen Tests
- Saubere Datenbankzustände

### Realistische Daten
- Authentische Benutzer-Workflows
- Echte HTTP-Requests
- Produktions-ähnliche Szenarien

### Error Handling
- Alle HTTP-Status-Codes getestet
- Edge Cases und Fehlerfälle
- Graceful Degradation

### Maintenance
- Modulare Test-Struktur
- Wiederverwendbare Utilities
- Klare Test-Beschreibungen

## Troubleshooting

### Häufige Probleme

1. **Server nicht gestartet**
   ```bash
   npm run dev
   ```

2. **Port bereits belegt**
   ```bash
   npm run dev:3000  # Alternative Port
   ```

3. **Datenbankverbindung**
   - Überprüfe `.env` Konfiguration
   - MariaDB Server läuft
   - Korrekte Credentials

4. **Test-Timeouts**
   - Server-Performance prüfen
   - Datenbankgröße optimieren
   - Netzwerk-Latenz

### Debug-Modus
```bash
# Verbose Logging
npm run test -- --reporter=verbose

# Einzelner Test
npm run test -- --testNamePattern="should create goal"

# Test-Datei
npm run test goals-management.test.ts
```

## Zukünftige Erweiterungen

### Geplante Features
- [ ] Performance-Tests (Load Testing)
- [ ] End-to-End Tests (Playwright)
- [ ] API-Contract Tests (Pact)
- [ ] Security Tests (OWASP)

### Monitoring
- [ ] Test-Coverage Reports
- [ ] CI/CD Integration
- [ ] Automatisierte Test-Reports
- [ ] Performance-Metriken