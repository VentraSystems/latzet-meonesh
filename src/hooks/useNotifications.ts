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
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
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
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: EXPO_PROJECT_ID,
      });
      token = tokenData.data;
    } catch (e) {
      console.error('Error getting push token:', e);
      throw e;
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
