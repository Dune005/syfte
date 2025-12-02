/**
 * iOS PWA Navigation Fix Plugin
 * 
 * Dieses Plugin behebt das Problem, dass auf älteren iOS-Versionen
 * die Safari-UI bei Navigation erscheint, obwohl die App als PWA
 * zum Homescreen hinzugefügt wurde.
 * 
 * Das Problem tritt auf, weil ältere iOS-Versionen den Standalone-Modus
 * bei bestimmten Navigationsarten "verlieren" können.
 */

export default defineNuxtPlugin(() => {
  // Nur auf Client-Seite ausführen
  if (typeof window === 'undefined') return

  // Prüfen ob wir im Standalone-Modus sind (PWA vom Homescreen geöffnet)
  const isInStandaloneMode = (): boolean => {
    // iOS Safari Standalone Mode
    const isIOSStandalone = ('standalone' in window.navigator) && 
      (window.navigator as any).standalone === true
    
    // Standard PWA Display Mode (für neuere Browser)
    const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches
    
    // Fullscreen Mode
    const isFullscreen = window.matchMedia('(display-mode: fullscreen)').matches
    
    return isIOSStandalone || isDisplayStandalone || isFullscreen
  }

  // iOS Detection
  const isIOS = (): boolean => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && 
      !(window as any).MSStream
  }

  // Wenn wir im PWA-Modus sind, stelle sicher dass alle Links intern bleiben
  if (isInStandaloneMode() && isIOS()) {
    // Intercepte alle Klicks auf Links
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      const anchor = target.closest('a')
      
      if (!anchor) return
      
      const href = anchor.getAttribute('href')
      
      // Ignoriere leere oder spezielle Links
      if (!href || href === '#' || href.startsWith('javascript:')) return
      
      // Ignoriere externe Links (diese sollen in Safari öffnen)
      if (href.startsWith('http://') || href.startsWith('https://')) {
        // Prüfe ob es ein externer Link ist
        const url = new URL(href, window.location.origin)
        if (url.origin !== window.location.origin) {
          // Externer Link - in Safari öffnen lassen
          return
        }
      }
      
      // Ignoriere Links mit target="_blank"
      if (anchor.target === '_blank') return
      
      // Ignoriere Download-Links
      if (anchor.hasAttribute('download')) return
      
      // Für interne Links: Verhindere Standard-Navigation und nutze History API
      // Dies hält die PWA im Standalone-Modus
      event.preventDefault()
      
      // Navigiere mit der History API
      const fullPath = href.startsWith('/') ? href : `/${href}`
      
      // Nutze Nuxt's Router wenn verfügbar (für bessere SPA-Navigation)
      const nuxtApp = useNuxtApp()
      if (nuxtApp.$router) {
        nuxtApp.$router.push(fullPath)
      } else {
        // Fallback zur History API
        window.history.pushState({}, '', fullPath)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }
    }, true)

    // Verhindere auch Form-Submits die die Seite verlassen könnten
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      
      // Wenn das Form eine externe Action hat, erlaube es
      const action = form.getAttribute('action')
      if (action) {
        try {
          const url = new URL(action, window.location.origin)
          if (url.origin !== window.location.origin) {
            return // Externe Form-Action erlauben
          }
        } catch {
          // Relative URL - ist intern
        }
      }
      
      // Für interne Forms: Stelle sicher dass sie via JavaScript gehandelt werden
      // Die meisten Forms in Vue/Nuxt nutzen bereits @submit.prevent
    }, true)

    // Log für Debugging
    console.log('[iOS PWA] Navigation Handler aktiviert für Standalone-Modus')
  }

  // Zusätzlich: Setze CSS-Variablen für Safe Areas
  if (isIOS()) {
    document.documentElement.style.setProperty(
      '--safe-area-inset-top', 
      'env(safe-area-inset-top, 0px)'
    )
    document.documentElement.style.setProperty(
      '--safe-area-inset-bottom', 
      'env(safe-area-inset-bottom, 0px)'
    )
    document.documentElement.style.setProperty(
      '--safe-area-inset-left', 
      'env(safe-area-inset-left, 0px)'
    )
    document.documentElement.style.setProperty(
      '--safe-area-inset-right', 
      'env(safe-area-inset-right, 0px)'
    )
  }
})
