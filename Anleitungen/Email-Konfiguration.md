# 📧 Email-Konfiguration - Postmark

## Übersicht

Syfte nutzt **Postmark** für den Versand von Transaktions-Emails (z.B. Password Reset). Die Integration erfolgt über die offizielle Postmark Node.js SDK.

## 🔑 Environment Variables

Füge folgende Variablen zu deiner `.env` Datei hinzu:

```bash
# Email Configuration (Postmark)
POSTMARK_API_KEY=d619c26d-8185-444e-a727-b68c38f787c8
MAIL_FROM=info@syfte.ch
```

### Variablen-Beschreibung

| Variable | Beschreibung | Beispiel |
|----------|-------------|----------|
| `POSTMARK_API_KEY` | Server API Token aus Postmark Dashboard | `d619c26d-8185-444e-a727-b68c38f787c8` |
| `MAIL_FROM` | Absender-Email-Adresse (muss in Postmark verifiziert sein) | `info@syfte.ch` |

## 📦 Installation

Das Postmark SDK ist bereits installiert:

```bash
npm install postmark
```

## 🚀 Verwendung

### Password Reset Email

Die Funktion `sendPasswordResetEmail()` wird automatisch vom Forgot-Password-Endpunkt aufgerufen:

```typescript
import { sendPasswordResetEmail } from '~/server/utils/email'

// In server/api/auth/forgot-password.post.ts
await sendPasswordResetEmail(user.email, resetToken)
```

### Email-Template

Das Password Reset Email enthält:
- **Betreff:** "Syfte Passwort zurücksetzen"
- **Absender:** `info@syfte.ch`
- **Inhalt:** Personalisierte HTML-Email mit Reset-Button und Link
- **Gültigkeit:** 24 Stunden (Token-basiert)

## 🔧 Development Mode

Wenn `POSTMARK_API_KEY` **nicht** gesetzt ist:
- Emails werden **nicht** versendet
- Reset-URLs werden in der **Konsole** geloggt
- Ideal für lokale Entwicklung ohne Email-Provider

```bash
📧 (No Postmark API Key) Password reset for user@example.com: http://localhost:3200/reset-password?token=abc123
```

## ✅ Testing

### 1. Postmark-Verbindung testen

Starte den Dev-Server und prüfe die Logs:

```bash
npm run dev
```

**Erfolgreiche Initialisierung:**
```
✅ Postmark client initialized
```

### 2. Password Reset Email testen

1. Rufe `/forgot-password` auf
2. Gib eine Email-Adresse ein
3. Prüfe Postmark-Dashboard > "Activity" für gesendete Emails
4. Alternativ: Prüfe Konsole-Logs

**Erfolgreiche Email-Versand:**
```
✅ Password reset email sent to user@example.com
```

**Fehler beim Versand:**
```
❌ Failed to send password reset email: [Error-Details]
```

## 🛠️ Troubleshooting

### Problem: "No Postmark API Key" Warning

**Ursache:** `POSTMARK_API_KEY` nicht in `.env` gesetzt

**Lösung:**
1. Erstelle `.env` Datei im Root-Verzeichnis
2. Füge hinzu: `POSTMARK_API_KEY=dein_api_key`
3. Starte Server neu

### Problem: "Sender signature not confirmed"

**Ursache:** Absender-Email (`info@syfte.ch`) nicht in Postmark verifiziert

**Lösung:**
1. Gehe zu Postmark Dashboard
2. **Sender Signatures** → Email-Adresse verifizieren
3. Bestätigungs-Email prüfen

### Problem: Email kommt nicht an

**Checkliste:**
1. ✅ Postmark API Key korrekt in `.env`?
2. ✅ `info@syfte.ch` in Postmark verifiziert?
3. ✅ Postmark Dashboard > Activity > Email-Status prüfen
4. ✅ Spam-Ordner beim Empfänger prüfen
5. ✅ Server-Logs auf Fehler prüfen

## 📚 Postmark Dokumentation

- **Dashboard:** https://account.postmarkapp.com/
- **API Docs:** https://postmarkapp.com/developer
- **Node.js SDK:** https://github.com/ActiveCampaign/postmark.js

## 🔐 Security Best Practices

- ⚠️ **API-Key niemals committen!** (`.env` ist in `.gitignore`)
- ✅ API-Key nur in Environment Variables speichern
- ✅ Für Production separaten Postmark-Server nutzen
- ✅ Postmark Message Stream: `outbound` für Transaktions-Emails

## 🎯 Nächste Schritte

Weitere Email-Templates hinzufügen:
- Welcome Email bei Registrierung
- Email-Änderung Bestätigung
- Account-Löschung Bestätigung
- Sparziel-Reminder (Push + Email)

---

**Erstellt:** 28. Oktober 2025  
**Maintainer:** Syfte Development Team  
**Letztes Update:** 28. Oktober 2025
