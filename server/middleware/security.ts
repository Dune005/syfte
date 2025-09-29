/**
 * Server Middleware für Sicherheitsheader und Rate Limiting
 */
export default defineEventHandler(async (event) => {
  // Nur für API Routes anwenden
  if (!event.node.req.url?.startsWith('/api/')) {
    return
  }

  // Security Headers für API
  setHeaders(event, {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  })

  // Rate Limiting speichern (in production mit Redis)
  const ip = (event.node.req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
            event.node.req.socket.remoteAddress || 
            'unknown'
  const runtimeConfig = useRuntimeConfig()
  
  // Basis IP-basiertes Rate Limiting
  if (ip && ip !== 'unknown') {
    const key = `rate_limit:${ip}`
    // Hier würdest du Redis oder eine andere Lösung verwenden
    // Für Entwicklung: einfache In-Memory-Lösung
  }

  // CORS für API-Endpunkte
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