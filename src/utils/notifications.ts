import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface PushNotificationData {
  to: string; // Expo push token
  sound: 'default';
  title: string;
  body: string;
  data: {
    type: NotificationType;
    [key: string]: any;
  };
  badge?: number;
}

export type NotificationType =
  | 'taskSubmitted'
  | 'taskApproved'
  | 'taskRejected'
  | 'newPunishment'
  | 'punishmentCompleted'
  | 'quizPassed';

/**
 * Send a push notification to a user
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  type: NotificationType,
  additionalData?: Record<string, any>
): Promise<void> {
  try {
    // Get user's push token from Firestore
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      console.error('User not found:', userId);
      return;
    }

    const userData = userDoc.data();
    const pushToken = userData.pushToken;

    if (!pushToken) {
      console.log('User has no push token:', userId);
      return;
    }

    const message: PushNotificationData = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data: {
        type,
        ...additionalData,
      },
    };

    // Send notification via Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error sending push notification:', result);
    } else {
      console.log('Push notification sent successfully:', result);
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

/**
 * Notification helpers for specific events
 */

export async function notifyTaskSubmitted(
  parentId: string,
  childName: string,
  taskTitle: string,
  punishmentId: string,
  taskId: string
): Promise<void> {
  await sendPushNotification(
    parentId,
    '✅ משימה הוגשה',
    `${childName} הגיש/ה את המשימה "${taskTitle}"`,
    'taskSubmitted',
    { punishmentId, taskId }
  );
}

export async function notifyTaskApproved(
  childId: string,
  taskTitle: string,
  punishmentId: string,
  taskId: string
): Promise<void> {
  await sendPushNotification(
    childId,
    '🎉 משימה אושרה!',
    `ההורה אישר את המשימה "${taskTitle}"`,
    'taskApproved',
    { punishmentId, taskId }
  );
}

export async function notifyTaskRejected(
  childId: string,
  taskTitle: string,
  reason: string,
  punishmentId: string,
  taskId: string
): Promise<void> {
  await sendPushNotification(
    childId,
    '❌ משימה נדחתה',
    `המשימה "${taskTitle}" נדחתה: ${reason}`,
    'taskRejected',
    { punishmentId, taskId, reason }
  );
}

export async function notifyNewPunishment(
  childId: string,
  punishmentName: string,
  tasksCount: number,
  punishmentId: string
): Promise<void> {
  await sendPushNotification(
    childId,
    '🔒 עונש חדש',
    `${punishmentName} - ${tasksCount} משימות`,
    'newPunishment',
    { punishmentId, tasksCount }
  );
}

export async function notifyPunishmentCompleted(
  parentId: string,
  childName: string,
  punishmentName: string,
  punishmentId: string
): Promise<void> {
  await sendPushNotification(
    parentId,
    '🎉 עונש הושלם!',
    `${childName} סיים/ה את "${punishmentName}"`,
    'punishmentCompleted',
    { punishmentId }
  );
}

export async function notifyQuizPassed(
  parentId: string,
  childName: string,
  quizTitle: string,
  score: number,
  punishmentId: string,
  taskId: string
): Promise<void> {
  await sendPushNotification(
    parentId,
    '📚 חידון הושלם!',
    `${childName} עבר/ה את "${quizTitle}" עם ציון ${score}%`,
    'quizPassed',
    { punishmentId, taskId, score }
  );
}
