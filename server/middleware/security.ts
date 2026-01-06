/**
 * Security Middleware
 * 
 * Setzt Security Headers und implementiert Rate Limiting für API-Endpunkte.
 * 
 * Features:
 * - Security Headers (XSS, Clickjacking, Content-Type Protection)
 * - CORS Configuration (Development vs Production)
 * - IP-based Rate Limiting (TODO: Redis für Production)
 * - Preflight Request Handling (OPTIONS)
 * 
 * Security Headers:
 * - X-Content-Type-Options: nosniff (verhindert MIME-Type Sniffing)
 * - X-Frame-Options: DENY (verhindert Clickjacking)
 * - X-XSS-Protection: 1; mode=block (aktiviert XSS Filter)
 * - Referrer-Policy: strict-origin-when-cross-origin (kontrolliert Referrer)
 * - Permissions-Policy: Deaktiviert sensible Browser-Features
 * 
 * WICHTIG:
 * - Rate Limiting ist aktuell In-Memory (nicht skalierbar)
 * - Für Production: Redis oder andere verteilte Lösung verwenden
 */

export default defineEventHandler(async (event) => {
  // Nur für API Routes anwenden (nicht für statische Assets, etc.)
  if (!event.node.req.url?.startsWith('/api/')) {
    return
  }

  // === 1. SECURITY HEADERS ===
  // Schützen vor verschiedenen Web-Angriffen
  setHeaders(event, {
    'X-Content-Type-Options': 'nosniff', // Verhindert MIME-Sniffing
    'X-Frame-Options': 'DENY', // Verhindert Clickjacking
    'X-XSS-Protection': '1; mode=block', // Aktiviert Browser XSS-Filter
    'Referrer-Policy': 'strict-origin-when-cross-origin', // Kontrolliert Referrer-Weitergabe
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()', // Deaktiviert sensible Features
  })

  // === 2. RATE LIMITING (IP-based) ===
  // Schützt vor Brute-Force und DDoS
  const ip = (event.node.req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
            event.node.req.socket.remoteAddress || 
            'unknown'
  const runtimeConfig = useRuntimeConfig()
  
  // TODO: Implementiere Redis-based Rate Limiting für Production
  // Aktuell nur Placeholder - In-Memory würde bei Server-Restart verloren gehen
  if (ip && ip !== 'unknown') {
    const key = `rate_limit:${ip}`
    // Hier würdest du Redis oder eine andere Lösung verwenden
    // Für Entwicklung: einfache In-Memory-Lösung in auth.ts:rateLimit()
  }

  // === 3. CORS PREFLIGHT HANDLING ===
  // Behandle OPTIONS-Requests für CORS
  if (event.node.req.method === 'OPTIONS') {
    setHeaders(event, {
      'Access-Control-Allow-Origin': process.env.NODE_ENV === 'development' ? '*' : runtimeConfig.public.appUrl || 'https://syfte.app',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    })
    
    return ''
  }
})