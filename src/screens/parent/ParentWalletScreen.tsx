import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { fulfillRedemption, WalletReward, DEFAULT_WALLET_CONFIG } from '../../utils/wallet';
import { showAlert } from '../../utils/alert';

export default function ParentWalletScreen({ navigation }: any) {
  const { user, linkedUserId } = useAuth();
  const [config, setConfig] = useState(DEFAULT_WALLET_CONFIG);
  const [childBalance, setChildBalance] = useState(0);
  const [childTotalEarned, setChildTotalEarned] = useState(0);
  const [pendingRedemptions, setPendingRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReward, setEditingReward] = useState<string | null>(null);
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardEmoji, setNewRewardEmoji] = useState('🎁');
  const [newRewardCost, setNewRewardCost] = useState('50');

  useEffect(() => {
    if (!user) return;

    // Load parent's wallet config
    const unsubParent = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.walletConfig) setConfig(d.walletConfig);
      }
      setLoading(false);
    });

    return () => unsubParent();
  }, [user]);

  useEffect(() => {
    if (!linkedUserId) return;

    const unsubChild = onSnapshot(doc(db, 'users', linkedUserId), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setChildBalance(d.walletBalance || 0);
        setChildTotalEarned(d.walletTotalEarned || 0);
        setPendingRedemptions(d.walletPendingRedemptions || []);
      }
    });

    return () => unsubChild();
  }, [linkedUserId]);

  const saveConfig = async (updated: typeof config) => {
    if (!user) return;
    await updateDoc(doc(db, 'users', user.uid), { walletConfig: updated });
    setConfig(updated);
  };

  const handleFulfill = async (redemption: any) => {
    if (!linkedUserId) return;
    await fulfillRedemption(linkedUserId, redemption.id);
    showAlert('✅ Fulfilled!', `You gave "${redemption.rewardName}" to your child!`);
  };

  const handleAddReward = () => {
    if (!newRewardName.trim()) return;
    const newReward: WalletReward = {
      id: Date.now().toString(),
      emoji: newRewardEmoji,
      name: newRewardName.trim(),
      cost: parseInt(newRewardCost) || 50,
    };
    const updated = { ...config, rewards: [...config.rewards, newReward] };
    saveConfig(updated);
    setNewRewardName('');
    setNewRewardEmoji('🎁');
    setNewRewardCost('50');
  };

  const handleRemoveReward = (id: string) => {
    const updated = { ...config, rewards: config.rewards.filter((r) => r.id !== id) };
    saveConfig(updated);
  };

  const updateCoinRate = (key: keyof typeof config, value: number) => {
    const updated = { ...config, [key]: value };
    saveConfig(updated);
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
        <Text style={styles.headerTitle}>💰 Kid Wallet</Text>
        {linkedUserId && (
          <View style={styles.childStats}>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{childBalance}</Text>
              <Text style={styles.statLabel}>Balance 🪙</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{childTotalEarned}</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNum}>{pendingRedemptions.length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        )}
      </LinearGradient>

      {/* Pending Redemptions */}
      {pendingRedemptions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏳ Redemption Requests</Text>
          {pendingRedemptions.map((r) => (
            <View key={r.id} style={styles.redemptionCard}>
              <Text style={styles.redemptionEmoji}>{r.rewardEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.redemptionName}>{r.rewardName}</Text>
                <Text style={styles.redemptionCost}>{r.rewardCost} coins</Text>
              </View>
              <TouchableOpacity
                style={styles.fulfillBtn}
                onPress={() => handleFulfill(r)}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.fulfillBtnGrad}>
                  <Text style={styles.fulfillBtnText}>✅ Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Coin rates */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🪙 Coins Per Achievement</Text>
        {[
          { key: 'coinsPerTask', label: '✅ Task approved', icon: '📝' },
          { key: 'coinsPerQuiz', label: '🧠 Quiz passed', icon: '🧠' },
          { key: 'coinsPerGame', label: '🎮 Game passed', icon: '🎮' },
          { key: 'dailyBonus', label: '🌟 Daily bonus', icon: '⭐' },
        ].map(({ key, label, icon }) => (
          <View key={key} style={styles.rateRow}>
            <Text style={styles.rateLabel}>{label}</Text>
            <View style={styles.rateControls}>
              <TouchableOpacity style={styles.rateBtn} onPress={() => updateCoinRate(key as any, Math.max(1, (config[key as keyof typeof config] as number) - 1))}>
                <Text style={styles.rateBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.rateValue}>{config[key as keyof typeof config] as number}</Text>
              <TouchableOpacity style={styles.rateBtn} onPress={() => updateCoinRate(key as any, (config[key as keyof typeof config] as number) + 1)}>
                <Text style={styles.rateBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      {/* Rewards shop management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛍️ Rewards Shop</Text>
        {config.rewards.map((reward) => (
          <View key={reward.id} style={styles.rewardRow}>
            <Text style={styles.rewardEmoji}>{reward.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.rewardName}>{reward.name}</Text>
              <Text style={styles.rewardCost}>{reward.cost} coins</Text>
            </View>
            <TouchableOpacity onPress={() => handleRemoveReward(reward.id)} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Add reward */}
        <View style={styles.addRewardBox}>
          <Text style={styles.addRewardTitle}>+ Add Reward</Text>
          <View style={styles.addRewardRow}>
            <TextInput
              style={styles.emojiInput}
              value={newRewardEmoji}
              onChangeText={setNewRewardEmoji}
              maxLength={2}
            />
            <TextInput
              style={[styles.nameInput]}
              value={newRewardName}
              onChangeText={setNewRewardName}
              placeholder="Reward name..."
            />
          </View>
          <View style={styles.addRewardRow}>
            <Text style={styles.costLabel}>Cost (coins):</Text>
            <TextInput
              style={styles.costInput}
              value={newRewardCost}
              onChangeText={setNewRewardCost}
              keyboardType="number-pad"
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddReward}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

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
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#FFF', marginBottom: 16 },
  childStats: { flexDirection: 'row', gap: 16 },
  statBox: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 14, padding: 14, alignItems: 'center', minWidth: 80 },
  statNum: { fontSize: 28, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2, textAlign: 'center' },
  section: { margin: 16, marginBottom: 0 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', marginBottom: 12 },
  redemptionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E6', borderRadius: 14, padding: 14, marginBottom: 10, gap: 12, borderWidth: 1, borderColor: '#F39C12' },
  redemptionEmoji: { fontSize: 30 },
  redemptionName: { fontSize: 15, fontWeight: '600', color: '#2C3E50' },
  redemptionCost: { fontSize: 12, color: '#E67E22', marginTop: 2 },
  fulfillBtn: { borderRadius: 10, overflow: 'hidden' },
  fulfillBtnGrad: { paddingHorizontal: 14, paddingVertical: 10 },
  fulfillBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  rateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF', borderRadius: 12, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  rateLabel: { fontSize: 15, color: '#2C3E50', fontWeight: '500', flex: 1 },
  rateControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rateBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F39C12', justifyContent: 'center', alignItems: 'center' },
  rateBtnText: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  rateValue: { fontSize: 20, fontWeight: 'bold', color: '#2C3E50', minWidth: 36, textAlign: 'center' },
  rewardRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 8, gap: 12 },
  rewardEmoji: { fontSize: 28 },
  rewardName: { fontSize: 14, fontWeight: '600', color: '#2C3E50' },
  rewardCost: { fontSize: 12, color: '#95A5A6', marginTop: 2 },
  removeBtn: { padding: 6 },
  removeBtnText: { color: '#E74C3C', fontWeight: 'bold', fontSize: 16 },
  addRewardBox: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 2, borderColor: '#F39C12', borderStyle: 'dashed', marginTop: 8 },
  addRewardTitle: { fontSize: 15, fontWeight: 'bold', color: '#E67E22', marginBottom: 12 },
  addRewardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  emojiInput: { width: 48, height: 44, borderWidth: 1, borderColor: '#ECF0F1', borderRadius: 10, textAlign: 'center', fontSize: 22, backgroundColor: '#FAFAFA' },
  nameInput: { flex: 1, height: 44, borderWidth: 1, borderColor: '#ECF0F1', borderRadius: 10, paddingHorizontal: 12, fontSize: 14, backgroundColor: '#FAFAFA' },
  costLabel: { fontSize: 14, color: '#7F8C8D', fontWeight: '500' },
  costInput: { width: 70, height: 44, borderWidth: 1, borderColor: '#ECF0F1', borderRadius: 10, textAlign: 'center', fontSize: 16, fontWeight: 'bold', backgroundColor: '#FAFAFA' },
  addBtn: { backgroundColor: '#F39C12', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12 },
  addBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});
