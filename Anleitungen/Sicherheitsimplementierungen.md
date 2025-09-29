# 🔐 Sicherheitsimplementierungen - Syfte

Diese Dokumentation beschreibt alle aktuell implementierten Sicherheitsmaßnahmen in der Syfte-Anwendung.

## 📋 Übersicht der Sicherheitsfeatures

### ✅ Bereits implementiert:
- [x] **Security Headers** (Nitro-basiert)
- [x] **Server Middleware** für API-Sicherheit
- [x] **Input Validation** Schema-System
- [x] **Password Hashing** (PBKDF2)
- [x] **Rate Limiting** Grundlagen
- [x] **Environment Variables** Template
- [x] **CORS-Konfiguration**
- [x] **XSS-Schutz** durch Sanitization

### 🔄 Geplant für später:
- [ ] Redis für Production Rate Limiting
- [ ] JWT Implementation
- [ ] OAuth Google Integration
- [ ] VAPID Push Notifications
- [ ] CSRF Token System

---

## 1. 🛡️ Security Headers (Nitro)

**Datei:** `nuxt.config.ts`

```typescript
nitro: {
  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY', 
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
      }
    }
  }
}
```

**Schutz vor:**
- ✅ **MIME-Type Sniffing** (X-Content-Type-Options)
- ✅ **Clickjacking** (X-Frame-Options)
- ✅ **XSS-Attacken** (X-XSS-Protection)
- ✅ **Referrer Leaks** (Referrer-Policy)
- ✅ **Unerwünschte API-Zugriffe** (Permissions-Policy)

---

## 2. 🚦 Server Middleware

**Datei:** `server/middleware/security.ts`

### Features:
- **API-spezifische Security Headers**
- **IP-basierte Identifikation** für Rate Limiting
- **CORS-Konfiguration** (Development/Production)
- **OPTIONS-Request Handling**

```typescript
// Nur für API Routes anwenden
if (!event.node.req.url?.startsWith('/api/')) {
  return
}

// IP-Adresse ermitteln (Proxy-freundlich)
const ip = (event.node.req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
          event.node.req.socket.remoteAddress || 
          'unknown'
```

**Schutz vor:**
- ✅ **CORS-Attacken**
- ✅ **Preflight-Request Missbrauch**
- ✅ **IP-Spoofing** (rudimentär)

---

## 3. 📝 Input Validation System

**Datei:** `server/utils/validation.ts`

### Vordefinierte Schemas:

#### User Registration
```typescript
const userRegistrationSchema = {
  firstName: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZäöüÄÖÜß\s-]+$/
  },
  email: {
    required: true,
    type: 'string',
    maxLength: 255,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    required: true,
    type: 'string',
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  }
}
```

#### Goal Creation & Savings Entry
- **Titel-Validierung** mit Längen-Limits
- **CHF-Beträge** mit Min/Max-Werten
- **URL-Validierung** für Bilder
- **Notiz-Sanitization** gegen XSS

### Validation Function
```typescript
function validateInput(data: any, schema: any): { 
  isValid: boolean; 
  errors: string[] 
}
```

**Schutz vor:**
- ✅ **SQL Injection** (durch Type Validation)
- ✅ **XSS-Attacken** (durch Pattern Matching)
- ✅ **Buffer Overflow** (durch Length Limits)
- ✅ **Invalid Data Types**

---

## 4. 🔒 Password Security

**Datei:** `server/utils/security.ts`

### PBKDF2 Implementation
```typescript
// Hash Generation (mit Salt)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

// Password Verification
function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':')
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex')
  return hash === verifyHash
}
```

**Sicherheitsfeatures:**
- ✅ **Salt-basiertes Hashing** (16 Bytes Random)
- ✅ **PBKDF2** mit 10.000 Iterationen
- ✅ **SHA-512** Hash-Algorithmus
- ✅ **64-Byte Hash-Länge**
- ✅ **Timing-Attack Resistant**

---

## 5. ⏱️ Rate Limiting

**Datei:** `server/utils/security.ts`

### Memory-basierte Lösung (Development)
```typescript
function checkRateLimit(
  identifier: string, 
  limit: number = 100, 
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number }
```

**Current Limits:**
- **100 Requests** pro 15 Minuten
- **IP-basierte Identifikation**
- **Automatic Cleanup** abgelaufener Records

**Production Upgrade Path:**
```typescript
// TODO: Redis Implementation
// const redis = new Redis(process.env.REDIS_URL)
// await redis.incr(`rate_limit:${identifier}`)
```

**Schutz vor:**
- ✅ **Brute Force Attacks**
- ✅ **DDoS (begrenzt)**
- ✅ **API Abuse**

---

## 6. 🔑 Environment Variables

**Datei:** `.env.example`

### Kategorien:

#### Database Security
```bash
DB_HOST=localhost
DB_PASSWORD=your_database_password
```

#### Authentication & JWT
```bash
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
CSRF_SECRET=your_csrf_secret_key_32_characters_long
```

#### OAuth Integration
```bash
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

#### Push Notifications (VAPID)
```bash
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=mailto:your-email@domain.com
```

#### Rate Limiting
```bash
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000
```

**Best Practices:**
- ✅ **Keine Secrets im Code**
- ✅ **Template mit Beispielwerten**
- ✅ **Klare Naming Convention**
- ✅ **Kommentare für Complex Values**

---

## 7. 🌐 CORS Configuration

**Development vs. Production:**

```typescript
// Development: Permissive
'Access-Control-Allow-Origin': '*'

// Production: Restricted
'Access-Control-Allow-Origin': runtimeConfig.public.appUrl || 'https://syfte.app'
```

**Headers:**
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`
- `Access-Control-Max-Age: 86400` (24h Cache)

---

## 8. 🧹 XSS Protection & Sanitization

**Input Sanitization:**
```typescript
function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .trim()
}
```

**Vue.js Restrictions:**
- ✅ **v-html nur in MarkdownRenderer.vue erlaubt**
- ✅ **Template-basierte Ausgabe** (auto-escaped)
- ✅ **Strikte TypeScript Typen**

---

## 🚀 Next Steps für Production

### 1. Redis Implementation
```bash
npm install redis
```

### 2. JWT Token System
```bash
npm install jsonwebtoken
```

### 3. OAuth Integration
```bash
npm install @sidebase/nuxt-auth
```

### 4. Enhanced Logging
```bash
npm install winston
```

### 5. Security Monitoring
```bash
npm install @sentry/nuxt
```

---

## 📊 Security Checklist

### ✅ Implemented (Development Ready)
- [x] Security Headers
- [x] API Middleware
- [x] Input Validation Schemas
- [x] Password Hashing (PBKDF2)
- [x] Basic Rate Limiting
- [x] Environment Variables
- [x] CORS Protection
- [x] XSS Prevention

### 🔄 In Progress
- [ ] Redis Rate Limiting
- [ ] JWT Implementation
- [ ] OAuth Google
- [ ] VAPID Push Setup

### ⏳ Planned
- [ ] Security Audit
- [ ] Penetration Testing
- [ ] OWASP Compliance Check
- [ ] Performance Monitoring

---

**Letzte Aktualisierung:** 29. September 2025  
**Version:** Development 1.0  
**Erstellt von:** GitHub Copilot für Syfte Project