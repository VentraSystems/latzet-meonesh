import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { EXPO_PROJECT_ID } from '@env';

// Configure how notifications are handled when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationHookReturn {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
}

export function useNotifications(userId?: string): NotificationHookReturn {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (userId) {
      registerForPushNotificationsAsync()
        .then(async (token) => {
          if (token) {
            setExpoPushToken(token);
            // Save token to Firestore
            await updateDoc(doc(db, 'users', userId), {
              pushToken: token,
              lastTokenUpdate: new Date(),
            });
          }
        })
        .catch((err) => {
          setError(err.message);
          console.error('Failed to get push token:', err);
        });
    }

    // Listen for notifications while app is in foreground
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    // Listen for notification taps
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      handleNotificationTap(data);
    });

    return () => {
      // Cleanup subscriptions (check if function exists for Expo Go compatibility)
      if (notificationListener.current && typeof Notifications.removeNotificationSubscription === 'function') {
        try {
          Notifications.removeNotificationSubscription(notificationListener.current);
        } catch (e) {
          console.log('Could not remove notification subscription:', e);
        }
      }
      if (responseListener.current && typeof Notifications.removeNotificationSubscription === 'function') {
        try {
          Notifications.removeNotificationSubscription(responseListener.current);
        } catch (e) {
          console.log('Could not remove response subscription:', e);
        }
      }
    };
  }, [userId]);

  return { expoPushToken, notification, error };
}

async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      alert('הרשאת התראות נדחתה. לא נוכל לשלוח לך עדכונים!');
      return null;
    }

    try {
      // Only try to get token if we have a valid project ID
      if (EXPO_PROJECT_ID && EXPO_PROJECT_ID !== 'your-project-id') {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: EXPO_PROJECT_ID,
        });
        token = tokenData.data;
      } else {
        console.log('Push notifications require valid EXPO_PROJECT_ID in .env');
        console.log('App will work without notifications for testing');
        return null;
      }
    } catch (e) {
      console.error('Error getting push token:', e);
      console.log('App will continue without push notifications');
      return null; // Don't throw, just return null
    }
  } else {
    console.log('Push notifications only work on physical devices');
  }

  return token;
}

function handleNotificationTap(data: any) {
  // This will be used to navigate to relevant screens
  // For now, just log the data
  console.log('Notification data:', data);

  // TODO: Implement navigation based on notification type
  // Examples:
  // - taskSubmitted: navigate to TaskApprovalScreen
  // - taskApproved: navigate to TasksListScreen
  // - newPunishment: navigate to ChildHomeScreen
  // - punishmentCompleted: navigate to FreedomScreen
}
