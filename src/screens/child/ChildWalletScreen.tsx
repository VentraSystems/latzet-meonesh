import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { redeemReward, WalletTransaction, WalletReward, DEFAULT_WALLET_CONFIG } from '../../utils/wallet';
import { showAlert } from '../../utils/alert';

export default function ChildWalletScreen({ navigation }: any) {
  const { user, linkedUserId } = useAuth();
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [rewards, setRewards] = useState<WalletReward[]>(DEFAULT_WALLET_CONFIG.rewards);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Listen to child's wallet data
    const unsubChild = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setBalance(d.walletBalance || 0);
        setTotalEarned(d.walletTotalEarned || 0);
        setTransactions(d.walletTransactions || []);
        setPending(d.walletPendingRedemptions || []);
      }
      setLoading(false);
    });

    // Load parent's reward config
    if (linkedUserId) {
      getDoc(doc(db, 'users', linkedUserId)).then((snap) => {
        if (snap.exists()) {
          const cfg = snap.data().walletConfig;
          if (cfg?.rewards?.length) setRewards(cfg.rewards);
        }
      });
    }

    return () => unsubChild();
  }, [user, linkedUserId]);

  const handleRedeem = async (reward: WalletReward) => {
    if (balance < reward.cost) {
      showAlert('Not enough coins', `You need ${reward.cost - balance} more coins`);
      return;
    }
    const result = await redeemReward(user!.uid, reward);
    if (result.success) {
      showAlert('Request sent! 🎉', 'Your parent will fulfill this reward soon');
    } else {
      showAlert('Error', result.error || 'Could not redeem');
    }
  };

  const formatTime = (ts: any) => {
    try {
      const d = ts?.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString();
    } catch { return ''; }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#f7971e', '#ffd200']} style={styles.centered}>
        <ActivityIndicator size="large" color="#FFF" />
      </LinearGradient>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#f7971e', '#ffd200']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💰 My Wallet</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceNum}>{balance}</Text>
          <Text style={styles.balanceCoin}>🪙 coins</Text>
        </View>
        <Text style={styles.totalEarned}>Total earned: {totalEarned} coins</Text>
      </LinearGradient>

      {/* Pending redemptions */}
      {pending.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏳ Pending Rewards</Text>
          {pending.map((p: any) => (
            <View key={p.id} style={styles.pendingCard}>
              <Text style={styles.pendingEmoji}>{p.rewardEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.pendingName}>{p.rewardName}</Text>
                <Text style={styles.pendingStatus}>Waiting for parent approval...</Text>
              </View>
              <Text style={styles.pendingCost}>-{p.rewardCost} 🪙</Text>
            </View>
          ))}
        </View>
      )}

      {/* Rewards shop */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛍️ Rewards Shop</Text>
        <View style={styles.rewardsGrid}>
          {rewards.map((reward) => {
            const canAfford = balance >= reward.cost;
            const alreadyPending = pending.some((p) => p.rewardId === reward.id);
            return (
              <TouchableOpacity
                key={reward.id}
                style={[styles.rewardCard, !canAfford && styles.rewardCardLocked]}
                onPress={() => !alreadyPending && handleRedeem(reward)}
                activeOpacity={0.8}
                disabled={alreadyPending}
              >
                <Text style={styles.rewardEmoji}>{reward.emoji}</Text>
                <Text style={styles.rewardName}>{reward.name}</Text>
                <View style={[styles.rewardCostBadge, canAfford && styles.rewardCostAffordable]}>
                  <Text style={[styles.rewardCostText, canAfford && styles.rewardCostTextAffordable]}>
                    {alreadyPending ? '⏳ Pending' : `${reward.cost} 🪙`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📜 History</Text>
          {transactions.slice(0, 20).map((tx, i) => (
            <View key={i} style={styles.txRow}>
              <Text style={styles.txEmoji}>
                {tx.type === 'earned' ? '⬆️' : tx.type === 'bonus' ? '⭐' : '⬇️'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.txReason}>{tx.reason}</Text>
                <Text style={styles.txDate}>{formatTime(tx.timestamp)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: tx.amount > 0 ? '#27AE60' : '#E74C3C' }]}>
                {tx.amount > 0 ? '+' : ''}{tx.amount} 🪙
              </Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFDF0' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 24, paddingTop: 50, alignItems: 'center', paddingBottom: 32 },
  backBtn: { position: 'absolute', top: 50, left: 20, padding: 8 },
  backBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 22, fontWeight: 'bold' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 16 },
  balanceCard: { flexDirection: 'row', alignItems: 'baseline', gap: 8, backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 20, marginBottom: 8 },
  balanceNum: { fontSize: 60, fontWeight: 'bold', color: '#FFF' },
  balanceCoin: { fontSize: 20, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  totalEarned: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  section: { margin: 16, marginBottom: 0 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  pendingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E6', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#F39C12' },
  pendingEmoji: { fontSize: 28 },
  pendingName: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  pendingStatus: { fontSize: 12, color: '#F39C12', marginTop: 2 },
  pendingCost: { fontSize: 14, fontWeight: 'bold', color: '#E67E22' },
  rewardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  rewardCard: { width: '47%', backgroundColor: '#FFF', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#f7971e', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  rewardCardLocked: { opacity: 0.55 },
  rewardEmoji: { fontSize: 36, marginBottom: 8 },
  rewardName: { fontSize: 13, color: '#2C3E50', textAlign: 'center', fontWeight: '600', marginBottom: 10, minHeight: 36 },
  rewardCostBadge: { backgroundColor: '#ECF0F1', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  rewardCostAffordable: { backgroundColor: '#D5F5E3' },
  rewardCostText: { fontSize: 13, fontWeight: 'bold', color: '#7F8C8D' },
  rewardCostTextAffordable: { color: '#27AE60' },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', gap: 10 },
  txEmoji: { fontSize: 18, width: 28, textAlign: 'center' },
  txReason: { fontSize: 14, color: '#2C3E50', fontWeight: '500' },
  txDate: { fontSize: 11, color: '#95A5A6', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: 'bold' },
});
