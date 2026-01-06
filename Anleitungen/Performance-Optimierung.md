# Performance-Optimierung für Production

## 🎯 Problem
Die Production-Umgebung (www.syfte.ch) hatte deutlich langsamere Ladezeiten als die Dev-Umgebung.

## 🔍 Identifizierte Probleme

### 1. **Fehlende Caching-Strategie**
- Keine Route-Caching-Regeln definiert
- API-Responses wurden nicht gecacht
- Statische Seiten wurden jedes Mal neu gerendert

### 2. **Suboptimale Datenbankverbindungen**
- Connection Pool mit nur 10 Verbindungen
- Keine Keep-Alive-Mechanismen
- Fehlende Timeout-Optimierungen

### 3. **Bundle Size & Code-Splitting**
- ApexCharts (~500KB) wurde in jeder Page geladen
- Keine manuellen Code-Splitting-Regeln
- Lucide Icons nicht separiert

### 4. **Fehlende Build-Optimierungen**
- Keine Prerender-Strategie für statische Seiten
- Asset-Kompression nicht aktiviert
- Keine Long-Term-Caching-Headers

## ✅ Implementierte Lösungen

### 1. Route-Caching & Prerendering

**Statische Seiten (Prerendered):**
```typescript
'/wie-es-funktioniert': { prerender: true }
'/impressum': { prerender: true }
'/datenschutz': { prerender: true }
'/agb': { prerender: true }
'/login': { prerender: true }
'/register': { prerender: true }
```
**Vorteil:** Diese Seiten werden beim Build erstellt und als statische HTML-Dateien ausgeliefert.

**SWR (Stale-While-Revalidate) Caching:**
```typescript
'/': { swr: 3600 }          // Homepage: 1 Stunde
'/dashboard': { swr: 60 }   // 1 Minute (häufig aktualisiert)
'/profil': { swr: 300 }     // 5 Minuten
'/friends': { swr: 120 }    // 2 Minuten
```
**Vorteil:** Nutzer sehen sofort gecachte Inhalte, während im Hintergrund revalidiert wird.

**API-Route-Caching:**
```typescript
'/api/dashboard': { cache: { maxAge: 60 } }      // 1 Min
'/api/goals/**': { cache: { maxAge: 30 } }       // 30 Sek
'/api/streaks/**': { cache: { maxAge: 120 } }    // 2 Min
'/api/analytics/**': { cache: { maxAge: 300 } }  // 5 Min
```

### 2. Datenbankverbindungs-Optimierung

**Vorher:**
```typescript
connectionLimit: 10
// Keine Keep-Alive, keine Timeouts
```

**Nachher:**
```typescript
connectionLimit: process.env.NODE_ENV === 'production' ? 20 : 10,
enableKeepAlive: true,
keepAliveInitialDelay: 10000,
connectTimeout: 10000,
maxIdle: 10,
idleTimeout: 60000
```

**Vorteile:**
- Doppelt so viele Verbindungen in Production
- Keep-Alive verhindert Connection-Overhead
- Intelligentes Connection-Pooling mit Idle-Timeout

### 3. Code-Splitting & Bundle-Optimierung

**Manual Chunks:**
```typescript
manualChunks: {
  'apexcharts': ['apexcharts', 'vue3-apexcharts'],
  'icons': ['lucide-vue-next']
}
```

**Vorteil:** 
- ApexCharts (~500KB) wird nur auf Seiten mit Charts geladen
- Icons werden separat geladen (nur wenn benötigt)
- Kleineres initiales Bundle → schnellere First Load

### 4. Asset-Optimierung

**Long-Term Caching:**
```typescript
'/_nuxt/**': { 
  headers: { 'cache-control': 'public, max-age=31536000, immutable' } 
}
'/images/**': { 
  headers: { 'cache-control': 'public, max-age=31536000' } 
}
```

**Asset-Kompression:**
```typescript
compressPublicAssets: true
```

**Vorteil:**
- Browser cachen Assets für 1 Jahr
- Gzip/Brotli-Kompression reduziert Transfer-Größe
- Immutable Assets → keine Revalidierung nötig

### 5. Experimental Features

```typescript
experimental: {
  payloadExtraction: false,      // Schnelleres SSR
  renderJsonPayloads: true,      // Effizientere Datenübertragung
  componentIslands: true         // Selective Hydration
}
```

**Vorteile:**
- Selective Hydration: Komponenten werden nur hydratisiert wenn nötig
- Kleinere Payload-Größe durch optimierte JSON-Serialisierung

## 📊 Erwartete Performance-Verbesserungen

### Ladezeiten
- **Statische Seiten:** 80-90% schneller (durch Prerendering)
- **Dashboard (erster Besuch):** 40-60% schneller
- **Dashboard (wiederholter Besuch):** 70-85% schneller (durch SWR-Cache)

### Bundle Size
- **Initiales Bundle:** ~30-40% kleiner (durch Code-Splitting)
- **Dashboard-spezifisches Bundle:** Separates ApexCharts-Chunk

### API-Performance
- **Häufige Anfragen:** 90% schneller (durch Cache-Hits)
- **Datenbankabfragen:** 20-30% schneller (optimierter Connection Pool)

## 🚀 Deployment-Schritte

### 1. Änderungen deployen
```bash
git add .
git commit -m "perf: Add production performance optimizations"
git push origin main
```

### 2. Vercel Deployment
Vercel erkennt automatisch die neuen `nuxt.config.ts` Einstellungen:
- Prerendered Seiten werden beim Build generiert
- Route-Rules werden in Vercel Edge Config übertragen
- Asset-Kompression wird aktiviert

### 3. Umgebungsvariablen prüfen
Stelle sicher, dass in Vercel folgende Env-Vars gesetzt sind:
- `NODE_ENV=production` (automatisch gesetzt)
- `DATABASE_URL` (mit Production-DB)
- Alle anderen `.env` Variablen

### 4. Performance testen

**Vor dem Deployment:**
```bash
npm run build
npm run preview
# Test auf localhost:3000
```

**Nach dem Deployment:**
- **Lighthouse:** https://pagespeed.web.dev/ → www.syfte.ch
- **WebPageTest:** https://www.webpagetest.org/
- **Chrome DevTools:** Network Tab (Cache-Headers prüfen)

**Metriken beobachten:**
- First Contentful Paint (FCP) → Ziel: <1.8s
- Largest Contentful Paint (LCP) → Ziel: <2.5s
- Time to Interactive (TTI) → Ziel: <3.8s
- Total Blocking Time (TBT) → Ziel: <200ms

## 🔧 Weitere Optimierungsmöglichkeiten

### Kurzfristig (wenn noch langsam):

1. **Google Fonts lokal hosten:**
   ```bash
   npm install @nuxtjs/google-fonts
   ```
   - Eliminiert externe DNS-Lookups
   - Reduziert FOUT (Flash of Unstyled Text)

2. **Image-Optimierung:**
   ```bash
   npm install @nuxt/image
   ```
   - Automatische WebP-Konvertierung
   - Lazy Loading
   - Responsive Images

3. **Redis-Cache für API:**
   - Vercel KV oder Upstash Redis
   - Ersetzt Memory-basiertes Caching
   - Persistent über Deployments hinweg

### Mittelfristig:

4. **CDN für User-Uploads:**
   - Vercel Blob Storage bereits vorhanden
   - Upload-Ordner auf CDN auslagern
   - Geografisch näher zum User

5. **Database Indexing:**
   ```sql
   CREATE INDEX idx_savings_user_date ON savings(user_id, saved_date);
   CREATE INDEX idx_goals_user_active ON goals(user_id, is_completed);
   ```

6. **Server-Side Query Batching:**
   - DataLoader Pattern für wiederholte Queries
   - Reduziert N+1 Query-Problem

### Langfristig:

7. **Edge Functions:**
   - Vercel Edge Functions für Auth
   - Geografisch näher zum User
   - Sub-100ms Response Times

8. **Incremental Static Regeneration (ISR):**
   - Dynamische Inhalte mit statischen Benefits
   - Kombination aus SSG und SSR

## 📈 Monitoring

### Setup Vercel Analytics:
```bash
npm install @vercel/analytics
```

In `nuxt.config.ts`:
```typescript
modules: [
  '@vite-pwa/nuxt',
  '@vercel/analytics/nuxt'
]
```

**Vorteile:**
- Real User Metrics (RUM)
- Core Web Vitals Tracking
- Performance-Regressions frühzeitig erkennen

### Alternative: Sentry Performance Monitoring
- Request Duration Tracking
- Database Query Performance
- Error Rate Correlation

## 🐛 Troubleshooting

### Problem: "Seite lädt noch immer langsam"
**Lösung:**
1. Cache in Browser löschen (Hard Refresh: Cmd+Shift+R)
2. Vercel Cache invalidieren: `vercel --prod --force`
3. DNS-Propagation abwarten (bis zu 24h)

### Problem: "Dashboard zeigt alte Daten"
**Lösung:**
- SWR-Cache arbeitet korrekt: Alte Daten sofort, neue im Hintergrund
- Falls zu lange gecacht: `swr`-Wert in `routeRules` reduzieren

### Problem: "ApexCharts wird trotzdem überall geladen"
**Lösung:**
- Build-Output prüfen: `npm run build` → Chunk-Größen
- `.nuxt/` Ordner löschen: `rm -rf .nuxt && npm run dev`

## 📚 Weitere Ressourcen

- [Nuxt 4 Performance Guide](https://nuxt.com/docs/guide/concepts/rendering#hybrid-rendering)
- [Vercel Edge Config](https://vercel.com/docs/storage/edge-config)
- [Web.dev Performance Patterns](https://web.dev/patterns/web-vitals-patterns)
- [Nuxt Nitro Caching](https://nitro.unjs.io/guide/cache)

---

**Status:** ✅ Optimierungen implementiert  
**Letztes Update:** 6. Januar 2026  
**Nächster Review:** Nach erstem Production-Deployment
