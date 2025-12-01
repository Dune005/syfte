/**
 * Composable für PWA Installation
 * Ermöglicht das Anzeigen eines "Zur Startseite hinzufügen" Prompts
 */
export const usePwaInstall = () => {
  const deferredPrompt = ref<any>(null)
  const isInstallable = ref(false)
  const isInstalled = ref(false)

  // Prüfe ob die App bereits installiert ist
  const checkIfInstalled = () => {
    if (typeof window !== 'undefined') {
      // Check display-mode media query
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      // Check iOS standalone mode
      const isIosStandalone = (window.navigator as any).standalone === true
      
      isInstalled.value = isStandalone || isIosStandalone
    }
  }

  // Installiere die App
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

  // iOS-spezifische Installationsanleitung
  const isIos = computed(() => {
    if (typeof window === 'undefined') return false
    const userAgent = window.navigator.userAgent.toLowerCase()
    return /iphone|ipad|ipod/.test(userAgent)
  })

  const isSafari = computed(() => {
    if (typeof window === 'undefined') return false
    const userAgent = window.navigator.userAgent.toLowerCase()
    return /safari/.test(userAgent) && !/chrome/.test(userAgent)
  })

  const showIosInstallHint = computed(() => {
    return isIos.value && isSafari.value && !isInstalled.value
  })

  onMounted(() => {
    checkIfInstalled()

    // Lausche auf den beforeinstallprompt Event
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      deferredPrompt.value = e
      isInstallable.value = true
      console.log('App kann installiert werden')
    })

    // Lausche auf erfolgreiche Installation
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
