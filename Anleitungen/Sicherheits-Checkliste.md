# 🚨 Sicherheits-Checkliste & Commands

Schnelle Referenz für alle sicherheitsrelevanten Aufgaben in Syfte.

## 🔧 Setup Commands

### 1. Environment Variables einrichten
```bash
# .env Datei erstellen
cp .env.example .env

# Secrets generieren
openssl rand -base64 32  # JWT Secret
openssl rand -base64 32  # CSRF Secret

# VAPID Keys generieren
npx web-push generate-vapid-keys
```

### 2. Datenbank-Sicherheit
```bash
# Sichere DB-Verbindung testen
mysql -h localhost -u username -p database_name

# Schema mit Constraints importieren
mysql -u username -p syfte < db/syfte.sql
```

## 🛡️ Development Security Checks

### 1. Security Headers testen
```bash
# Lokale Headers prüfen
curl -I http://localhost:3200/

# Erwartete Header:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
```

### 2. API Endpoints testen
```bash
# CORS Preflight Test
curl -X OPTIONS http://localhost:3200/api/test \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST"

# Rate Limiting Test
for i in {1..5}; do curl http://localhost:3200/api/test; done
```

### 3. Input Validation testen
```bash
# Malicious Input Test (sollte abgelehnt werden)
curl -X POST http://localhost:3200/api/register \
  -H "Content-Type: application/json" \
  -d '{"email": "<script>alert(\"xss\")</script>"}'
```

## 🔍 Security Monitoring

### 1. Log-Files überwachen
```bash
# Development Logs
tail -f .nuxt/dev.log

# Error Tracking
grep -i "error\|warning" .nuxt/dev.log
```

### 2. Performance Monitoring
```bash
# Memory Usage
ps aux | grep node

# Port Usage
lsof -i :3200
```

## 🚫 Security Don'ts

### ❌ Niemals committen:
- `.env` Datei
- Echte API Keys oder Passwords
- Private Keys (VAPID, JWT, etc.)
- Database Dumps mit echten Daten

### ❌ Niemals in Code:
```javascript
// ❌ FALSCH
const apiKey = "sk_live_12345..."
const password = "mypassword123"

// ✅ RICHTIG  
const apiKey = process.env.API_KEY
const password = hashPassword(userInput)
```

## 🔧 Debugging Security Issues

### 1. CORS Probleme
```bash
# Browser Console Fehler:
# "Access to fetch at '...' has been blocked by CORS policy"

# Lösung: CORS Headers in server/middleware/security.ts prüfen
```

### 2. Rate Limiting Issues
```bash
# 429 Too Many Requests
# Lösung: checkRateLimit() Funktion in server/utils/security.ts

# Rate Limit Reset:
# Neustart des Dev Servers (Memory-basiert)
```

### 3. Input Validation Errors
```bash
# "Field validation failed"
# Lösung: Schema in server/utils/validation.ts prüfen
```

## 📋 Pre-Production Checklist

### Environment
- [ ] `.env` mit Production-Werten
- [ ] Alle Secrets rotiert
- [ ] Database-Passwort > 16 Zeichen
- [ ] HTTPS-URLs in .env

### Code Review
- [ ] Keine hardcoded Secrets
- [ ] Alle Inputs validiert
- [ ] Rate Limiting aktiviert
- [ ] Error Messages sanitized

### Infrastructure
- [ ] Redis für Rate Limiting
- [ ] SSL/TLS Zertifikate
- [ ] Firewall konfiguriert
- [ ] Backup-Strategy

## 🆘 Security Incident Response

### 1. Verdächtigen Traffic erkennen
```bash
# Unusual API Calls
tail -f logs/access.log | grep -E "(429|401|403)"

# Brute Force Detection
awk '{print $1}' access.log | sort | uniq -c | sort -nr | head -10
```

### 2. Sofortmaßnahmen
```bash
# Rate Limits verschärfen
# In server/utils/security.ts:
# limit: 10 (statt 100)
# windowMs: 60000 (1 Minute statt 15)

# Verdächtige IPs blocken
# In server/middleware/security.ts:
# if (ip === 'SUSPICIOUS_IP') return createError({statusCode: 403})
```

### 3. Incident Documentation
- Zeit und Datum
- Betroffene Endpunkte
- IP-Adressen
- Getroffene Maßnahmen
- Follow-up Actions

---

**Emergency Contact:** security@syfte.app  
**Last Updated:** 29. September 2025