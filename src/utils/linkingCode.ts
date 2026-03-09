import { doc, setDoc, getDoc, deleteDoc, arrayUnion, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const generateLinkingCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createLinkingCode = async (parentId: string): Promise<string> => {
  const code = generateLinkingCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await setDoc(doc(db, 'linkingCodes', code), {
    parentId,
    expiresAt,
    used: false,
  });

  return code;
};

export const verifyAndUseLinkingCode = async (
  code: string,
  childId: string
): Promise<{ success: boolean; parentId?: string; error?: string }> => {
  const codeDoc = await getDoc(doc(db, 'linkingCodes', code));

  if (!codeDoc.exists()) {
    return { success: false, error: 'קוד לא תקין' };
  }

  const data = codeDoc.data();

  if (data.used) {
    return { success: false, error: 'קוד זה כבר נוצל' };
  }

  const expiresAt = data.expiresAt.toDate();
  if (expiresAt < new Date()) {
    await deleteDoc(doc(db, 'linkingCodes', code));
    return { success: false, error: 'הקוד פג תוקף' };
  }

  // Delete the code and directly update the parent's linkedUserIds
  await deleteDoc(doc(db, 'linkingCodes', code));
  await updateDoc(doc(db, 'users', data.parentId), {
    linkedUserIds: arrayUnion(childId),
    linkedUserId: childId,       // backward compat
    selectedChildId: childId,    // auto-select the newly linked child
  });

  return { success: true, parentId: data.parentId };
};
