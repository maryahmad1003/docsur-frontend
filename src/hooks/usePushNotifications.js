import { useState, useEffect, useCallback } from 'react';
import API from '../api/axiosConfig';

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const [subscription, setSubscription] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      setSubscription(existingSubscription);
    } catch (err) {
      console.error('Error checking subscription:', err);
    }
  };

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      setError('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      setPermission('granted');
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      setPermission(permission);
      return permission === 'granted';
    }

    return false;
  }, []);

  const subscribe = useCallback(async () => {
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setError('Permission denied');
        return null;
      }

      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await API.post('/notifications/subscribe', {
        subscription: subscription.toJSON(),
      });

      setSubscription(subscription);
      setError(null);
      return subscription;
    } catch (err) {
      console.error('Subscribe error:', err);
      setError(err.message);
      return null;
    }
  }, [requestPermission]);

  const unsubscribe = useCallback(async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        await API.post('/notifications/unsubscribe');
        setSubscription(null);
      }
    } catch (err) {
      console.error('Unsubscribe error:', err);
    }
  }, [subscription]);

  const testNotification = useCallback(async () => {
    if (permission !== 'granted') {
      await requestPermission();
    }
    
    if (Notification.permission === 'granted') {
      new Notification('DocSecur - Test', {
        body: 'Les notifications fonctionnent correctement!',
        icon: '/logo192.png',
        tag: 'test-notification',
      });
    }
  }, [permission, requestPermission]);

  return {
    permission,
    subscription,
    error,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
    subscribe,
    unsubscribe,
    testNotification,
    requestPermission,
  };
};

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default usePushNotifications;
