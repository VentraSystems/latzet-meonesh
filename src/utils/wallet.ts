import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface WalletTransaction {
  id: string;
  amount: number;
  reason: string;
  type: 'earned' | 'bonus' | 'redeemed';
  timestamp: any;
}

export interface WalletReward {
  id: string;
  emoji: string;
  name: string;
  cost: number;
}

export const DEFAULT_WALLET_CONFIG = {
  enabled: true,
  coinsPerTask: 10,
  coinsPerQuiz: 15,
  coinsPerGame: 12,
  dailyBonus: 5,
  rewards: [
    { id: 'r1', emoji: '📱', name: '30 min extra screen time', cost: 50 },
    { id: 'r2', emoji: '🍕', name: 'Choose dinner tonight', cost: 80 },
    { id: 'r3', emoji: '💰', name: '₪10 cash allowance', cost: 150 },
    { id: 'r4', emoji: '🎮', name: '1 hour gaming', cost: 100 },
  ] as WalletReward[],
};

export const awardCoins = async (
  childId: string,
  amount: number,
  reason: string,
  type: 'earned' | 'bonus' = 'earned'
) => {
  try {
    const userRef = doc(db, 'users', childId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return;

    const data = userDoc.data();
    const currentBalance = data.walletBalance || 0;
    const transactions: WalletTransaction[] = data.walletTransactions || [];

    const newTx: WalletTransaction = {
      id: Date.now().toString(),
      amount,
      reason,
      type,
      timestamp: new Date(),
    };

    await updateDoc(userRef, {
      walletBalance: currentBalance + amount,
      walletTotalEarned: (data.walletTotalEarned || 0) + amount,
      walletTransactions: [newTx, ...transactions].slice(0, 50),
    });
  } catch (e) {
    console.error('awardCoins failed:', e);
  }
};

export const redeemReward = async (childId: string, reward: WalletReward) => {
  const userRef = doc(db, 'users', childId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) return { success: false, error: 'User not found' };

  const data = userDoc.data();
  const balance = data.walletBalance || 0;
  if (balance < reward.cost) return { success: false, error: 'Not enough coins' };

  const transactions: WalletTransaction[] = data.walletTransactions || [];
  const pending = data.walletPendingRedemptions || [];

  const tx: WalletTransaction = {
    id: Date.now().toString(),
    amount: -reward.cost,
    reason: `Redeemed: ${reward.emoji} ${reward.name}`,
    type: 'redeemed',
    timestamp: new Date(),
  };

  await updateDoc(userRef, {
    walletBalance: balance - reward.cost,
    walletTransactions: [tx, ...transactions].slice(0, 50),
    walletPendingRedemptions: [
      ...pending,
      { id: tx.id, rewardId: reward.id, rewardName: reward.name, rewardEmoji: reward.emoji, rewardCost: reward.cost, requestedAt: new Date() },
    ],
  });

  return { success: true };
};

export const fulfillRedemption = async (childId: string, redemptionId: string) => {
  const userRef = doc(db, 'users', childId);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) return;

  const data = userDoc.data();
  const pending = (data.walletPendingRedemptions || []).filter((r: any) => r.id !== redemptionId);
  await updateDoc(userRef, { walletPendingRedemptions: pending });
};
