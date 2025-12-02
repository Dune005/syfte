import { ref, computed } from 'vue';

export const usePushNotifications = () => {
  const isSupported = ref(false);
  const isSubscribed = ref(false);
  const permission = ref<NotificationPermission>('default');
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Check if push notifications are supported
  const checkSupport = () => {
    if (process.client) {
      const hasServiceWorker = 'serviceWorker' in navigator;
      const hasPushManager = 'PushManager' in window;
      const hasNotification = 'Notification' in window;
      
      console.log('Push Support Check:', {
        hasServiceWorker,
        hasPushManager,
        hasNotification
      });
      
      isSupported.value = hasServiceWorker && hasPushManager && hasNotification;
      permission.value = Notification.permission;
      
      console.log('Final Support:', isSupported.value, 'Permission:', permission.value);
    }
    return isSupported.value;
  };

  // Get VAPID public key from runtime config
  const getVapidPublicKey = () => {
    const config = useRuntimeConfig();
    return config.public.vapidPublicKey || 'BGJPKY2_XzwX44VBObkzIn4c6Yi0116jzhLGk3iAML-WdJcRdu36ROzAln77zeiLVDLTuHAwzygEvy_C_2qLGmA';
  };

  // Convert VAPID key to Uint8Array
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };

  // Request notification permission
  const requestPermission = async (): Promise<boolean> => {
    if (!checkSupport()) {
      error.value = 'Push-Benachrichtigungen werden nicht unterstützt';
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      permission.value = result;
      
      if (result === 'granted') {
        return true;
      } else if (result === 'denied') {
        error.value = 'Benachrichtigungen wurden blockiert. Bitte ändere die Einstellungen in deinem Browser.';
      }
      
      return false;
    } catch (err: any) {
      error.value = err.message;
      return false;
    }
  };

  // Subscribe to push notifications
  const subscribe = async (): Promise<boolean> => {
    if (!checkSupport()) {
      error.value = 'Push-Benachrichtigungen werden nicht unterstützt';
      return false;
    }

    isLoading.value = true;
    error.value = null;

    try {
      // Request permission first
      if (permission.value !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          isLoading.value = false;
          return false;
        }
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Subscribe to push notifications
        const vapidPublicKey = getVapidPublicKey();
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey as any
        });
      }

      // Send subscription to backend
      const response = await $fetch('/api/push/subscribe', {
        method: 'POST',
        body: subscription.toJSON()
      });

      if (response) {
        isSubscribed.value = true;
        console.log('✅ Push-Benachrichtigungen aktiviert');
        return true;
      }

      return false;
    } catch (err: any) {
      console.error('Error subscribing to push notifications:', err);
      error.value = err.message || 'Fehler beim Aktivieren der Benachrichtigungen';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async (): Promise<boolean> => {
    if (!checkSupport()) {
      return false;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe();
        
        // Notify backend
        await $fetch('/api/push/unsubscribe', {
          method: 'DELETE'
        });

        isSubscribed.value = false;
        console.log('✅ Push-Benachrichtigungen deaktiviert');
        return true;
      }

      return false;
    } catch (err: any) {
      console.error('Error unsubscribing from push notifications:', err);
      error.value = err.message || 'Fehler beim Deaktivieren der Benachrichtigungen';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Check current subscription status
  const checkSubscriptionStatus = async (): Promise<boolean> => {
    if (!checkSupport()) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      isSubscribed.value = !!subscription;
      return !!subscription;
    } catch (err) {
      console.error('Error checking subscription status:', err);
      return false;
    }
  };

  // Send test notification
  const sendTestNotification = async (): Promise<boolean> => {
    try {
      const response = await $fetch('/api/push/test', {
        method: 'POST'
      });
      
      return !!response;
    } catch (err: any) {
      error.value = err.message || 'Fehler beim Senden der Test-Benachrichtigung';
      return false;
    }
  };

  // Computed properties
  const canSubscribe = computed(() => isSupported.value && !isSubscribed.value && permission.value !== 'denied');
  const canUnsubscribe = computed(() => isSupported.value && isSubscribed.value);
  const isBlocked = computed(() => permission.value === 'denied');

  return {
    // State
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    error,
    
    // Computed
    canSubscribe,
    canUnsubscribe,
    isBlocked,
    
    // Methods
    checkSupport,
    requestPermission,
    subscribe,
    unsubscribe,
    checkSubscriptionStatus,
    sendTestNotification
  };
};
