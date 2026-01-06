/**
 * usePwaInstall Composable
 * 
 * Ermöglicht das Anzeigen eines "Zur Startseite hinzufügen" Prompts
 * für Progressive Web Apps (PWA).
 * 
 * Features:
 * - Erkennt ob App installierbar ist (beforeinstallprompt Event)
 * - Zeigt nativen Install-Prompt an
 * - Erkennt iOS Geräte für spezielle Handling
 * - Prüft ob App bereits installiert ist (display-mode: standalone)
 * 
 * Returns:
 * @returns {object} isInstallable - Ob App installiert werden kann
 * @returns {object} isInstalled - Ob App bereits installiert ist
 * @returns {object} isIos - Ob Gerät ein iOS Gerät ist
 * @returns {object} showIosInstallHint - Ob iOS Installationsanleitung angezeigt werden soll
 * @returns {function} install - Funktion zum Anzeigen des Install-Prompts
 * 
 * Usage:
 * const { isInstallable, isInstalled, install } = usePwaInstall()
 * if (isInstallable.value) await install()
 */
export const usePwaInstall = () => {
  // Deferred Prompt für späteren Aufruf
  const deferredPrompt = ref<any>(null)
  const isInstallable = ref(false)
  const isInstalled = ref(false)

  /**
   * Prüft ob die App bereits installiert ist
   * Checkt sowohl Standard PWA als auch iOS Standalone Mode
   */
  const checkIfInstalled = () => {
    if (typeof window !== 'undefined') {
      // Check display-mode media query (Standard PWA)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      // Check iOS standalone mode (Safari spezifisch)
      const isIosStandalone = (window.navigator as any).standalone === true
      
      isInstalled.value = isStandalone || isIosStandalone
    }
  }

  /**
   * Installiert die App via nativem Browser-Prompt
   * @returns {Promise<boolean>} true wenn Installation erfolgreich, false wenn abgelehnt
   */
  const install = async () => {
    if (!deferredPrompt.value) {
      console.log('Installation nicht möglich - kein Prompt verfügbar')
      return false
    }

    try {
      // Zeige den nativen Install-Prompt
      deferredPrompt.value.prompt()
      
      // Warte auf die Benutzerentscheidung
      const { outcome } = await deferredPrompt.value.userChoice
      
      if (outcome === 'accepted') {
        console.log('App wurde installiert')
        isInstallable.value = false
        isInstalled.value = true
        deferredPrompt.value = null
        return true
      } else {
        console.log('Installation abgelehnt')
        return false
      }
    } catch (error) {
      console.error('Fehler bei der Installation:', error)
      return false
    }
  }

  /**
   * Computed: Erkennt ob Gerät ein iOS Gerät ist (iPhone, iPad, iPod)
   */
  const isIos = computed(() => {
    if (typeof window === 'undefined') return false
    const userAgent = window.navigator.userAgent.toLowerCase()
    return /iphone|ipad|ipod/.test(userAgent)
  })

  /**
   * Computed: Erkennt ob Browser Safari ist (für iOS PWA Support)
   */
  const isSafari = computed(() => {
    if (typeof window === 'undefined') return false
    const userAgent = window.navigator.userAgent.toLowerCase()
    return /safari/.test(userAgent) && !/chrome/.test(userAgent)
  })

  /**
   * Computed: Zeigt ob iOS Installationsanleitung angezeigt werden soll
   * Nur auf iOS Safari und wenn noch nicht installiert
   */
  const showIosInstallHint = computed(() => {
    return isIos.value && isSafari.value && !isInstalled.value
  })

  onMounted(() => {
    checkIfInstalled()

    // Event Listener: beforeinstallprompt (Chrome, Edge, etc.)
    // Wird gefeuert wenn Browser erkennt dass App installierbar ist
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      deferredPrompt.value = e
      isInstallable.value = true
      console.log('App kann installiert werden')
    })

    // Event Listener: appinstalled
    // Wird gefeuert wenn App erfolgreich installiert wurde
    window.addEventListener('appinstalled', () => {
      console.log('App wurde erfolgreich installiert')
      isInstalled.value = true
      isInstallable.value = false
      deferredPrompt.value = null
    })
  })

  return {
    isInstallable,
    isInstalled,
    isIos,
    showIosInstallHint,
    install
  }
}
