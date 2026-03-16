import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const generateLinkingCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createLinkingCode = async (parentId: string, existingChildId?: string): Promise<string> => {
  const code = generateLinkingCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await setDoc(doc(db, 'linkingCodes', code), {
    parentId,
    expiresAt,
    used: false,
    ...(existingChildId ? { existingChildId } : {}),
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

  // If this is a reconnect code, use the existing child ID so no duplicate is added
  const effectiveChildId = data.existingChildId || childId;

  await deleteDoc(doc(db, 'linkingCodes', code));
  await setDoc(doc(db, 'linkingCodes', `pending_${data.parentId}`), {
    childId: effectiveChildId,
    parentId: data.parentId,
    createdAt: new Date(),
  });

  return { success: true, parentId: data.parentId };
};
