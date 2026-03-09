import { doc, updateDoc, increment, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const BADGES: Record<string, { emoji: string; name: string; desc: string }> = {
  first_task:    { emoji: '🌟', name: 'צעד ראשון',      desc: 'השלמת את המשימה הראשונה שלך!' },
  quiz_master:   { emoji: '🧠', name: 'גאון',           desc: 'עברת את החידון הראשון שלך!' },
  helper:        { emoji: '🏠', name: 'עוזר ביתי',      desc: 'השלמת 5 מטלות בית' },
  brain_power:   { emoji: '📚', name: 'כוח מוח',        desc: 'עברת 3 חידונים בהצלחה' },
  warrior:       { emoji: '💪', name: 'לוחם',           desc: 'השלמת 10 משימות!' },
  perfectionist: { emoji: '🎯', name: 'פרפקציוניסט',    desc: 'קיבלת 100% בחידון!' },
  champion:      { emoji: '👑', name: 'אלוף',           desc: 'צברת 100 נקודות!' },
  free_bird:     { emoji: '🕊️', name: 'ציפור חופשית',   desc: 'יצאת מעונש 3 פעמים!' },
};

export const POINTS_PER_TASK = {
  quiz: 25,
  homework: 20,
  chore: 15,
  behavior: 15,
  custom: 10,
};

export async function awardPointsAndBadges(
  childId: string,
  taskType: string,
  quizScore?: number
) {
  const points = POINTS_PER_TASK[taskType as keyof typeof POINTS_PER_TASK] ?? 10;

  const childDoc = await getDoc(doc(db, 'users', childId));
  if (!childDoc.exists()) return;

  const data = childDoc.data();
  const currentPoints = (data.totalPoints || 0) + points;
  const currentBadges: string[] = data.badges || [];
  const completedTasks: number = (data.completedTasksCount || 0) + 1;
  const completedQuizzes: number = taskType === 'quiz' ? (data.completedQuizzesCount || 0) + 1 : (data.completedQuizzesCount || 0);
  const completedPunishments: number = data.completedPunishmentsCount || 0;

  const newBadges: string[] = [];

  if (!currentBadges.includes('first_task') && completedTasks >= 1) newBadges.push('first_task');
  if (!currentBadges.includes('quiz_master') && taskType === 'quiz' && completedQuizzes >= 1) newBadges.push('quiz_master');
  if (!currentBadges.includes('helper') && completedTasks >= 5) newBadges.push('helper');
  if (!currentBadges.includes('brain_power') && completedQuizzes >= 3) newBadges.push('brain_power');
  if (!currentBadges.includes('warrior') && completedTasks >= 10) newBadges.push('warrior');
  if (!currentBadges.includes('perfectionist') && quizScore === 100) newBadges.push('perfectionist');
  if (!currentBadges.includes('champion') && currentPoints >= 100) newBadges.push('champion');
  if (!currentBadges.includes('free_bird') && completedPunishments >= 3) newBadges.push('free_bird');

  const update: any = {
    totalPoints: increment(points),
    completedTasksCount: increment(1),
  };

  if (taskType === 'quiz') {
    update.completedQuizzesCount = increment(1);
  }

  if (newBadges.length > 0) {
    update.badges = arrayUnion(...newBadges);
  }

  await updateDoc(doc(db, 'users', childId), update);

  return { pointsEarned: points, newBadges };
}

export async function incrementCompletedPunishments(childId: string) {
  const childDoc = await getDoc(doc(db, 'users', childId));
  if (!childDoc.exists()) return;
  const data = childDoc.data();
  const count = (data.completedPunishmentsCount || 0) + 1;
  const currentBadges: string[] = data.badges || [];
  const update: any = { completedPunishmentsCount: increment(1) };
  if (!currentBadges.includes('free_bird') && count >= 3) {
    update.badges = arrayUnion('free_bird');
  }
  await updateDoc(doc(db, 'users', childId), update);
}
