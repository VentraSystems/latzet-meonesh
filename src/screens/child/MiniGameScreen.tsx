import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { awardCoins, DEFAULT_WALLET_CONFIG } from '../../utils/wallet';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type GameType = 'math_blitz' | 'memory_sequence';
type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'intro' | 'playing' | 'result';

interface MathProblem {
  question: string;
  answer: number;
  options: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Grade-appropriate math generation
function genMathProblem(difficulty: Difficulty, grade: number = 4): MathProblem {
  let a: number, b: number, op: string, answer: number;

  // Grade bands: 1-2, 3-4, 5-6, 7+
  const band = grade <= 2 ? 1 : grade <= 4 ? 2 : grade <= 6 ? 3 : 4;

  if (band === 1) {
    // Grade 1-2: simple add/sub within 20
    a = Math.floor(Math.random() * 10) + 1;
    b = Math.floor(Math.random() * 10) + 1;
    op = difficulty === 'hard' ? ['+', '-'][Math.floor(Math.random() * 2)] : '+';
  } else if (band === 2) {
    // Grade 3-4: add/sub to 100, times tables 1-5
    const useMult = difficulty !== 'easy' && Math.random() < 0.4;
    if (useMult) {
      a = Math.floor(Math.random() * 5) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      op = '×';
    } else {
      a = Math.floor(Math.random() * 50) + 10;
      b = Math.floor(Math.random() * 30) + 5;
      op = ['+', '-'][Math.floor(Math.random() * 2)];
    }
  } else if (band === 3) {
    // Grade 5-6: full times tables, division, larger numbers
    const ops = difficulty === 'easy' ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
    op = ops[Math.floor(Math.random() * ops.length)];
    if (op === '÷') {
      b = [2,3,4,5,6,7,8,9][Math.floor(Math.random()*8)];
      a = b * (Math.floor(Math.random() * 9) + 1);
    } else if (op === '×') {
      a = Math.floor(Math.random() * 12) + 1;
      b = Math.floor(Math.random() * 12) + 1;
    } else {
      a = Math.floor(Math.random() * 100) + 20;
      b = Math.floor(Math.random() * 50) + 10;
    }
  } else {
    // Grade 7+: negative numbers, order of ops, larger multiplications
    const ops = difficulty === 'easy' ? ['+', '-', '×'] : ['×', '÷', '+', '-'];
    op = ops[Math.floor(Math.random() * ops.length)];
    if (op === '÷') {
      b = [3,4,5,6,7,8,9,11,12][Math.floor(Math.random()*9)];
      a = b * (Math.floor(Math.random() * 11) + 2);
    } else if (op === '×') {
      a = Math.floor(Math.random() * 15) + 3;
      b = Math.floor(Math.random() * 15) + 3;
    } else {
      a = Math.floor(Math.random() * 200) + 50;
      b = Math.floor(Math.random() * 100) + 20;
    }
  }

  if (op === '+') answer = a + b;
  else if (op === '-') { if (a < b) [a, b] = [b, a]; answer = a - b; }
  else if (op === '×') answer = a * b;
  else answer = a / b;

  const wrongs = new Set<number>();
  while (wrongs.size < 3) {
    const delta = Math.floor(Math.random() * 8) - 4;
    const w = answer + (delta === 0 ? 1 : delta);
    if (w !== answer && w > 0) wrongs.add(w);
  }
  const options = [...wrongs, answer].sort(() => Math.random() - 0.5);
  return { question: `${a} ${op} ${b} = ?`, answer, options };
}

const MEM_COLORS = ['#E74C3C', '#3498DB', '#27AE60', '#F39C12'];
const MEM_LABELS = ['🔴', '🔵', '🟢', '🟡'];
const PASS = { math_blitz: { easy: 6, medium: 7, hard: 8 }, memory_sequence: { easy: 5, medium: 7, hard: 9 } };
const TOTAL_MATH = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function MiniGameScreen({ route, navigation }: any) {
  const {
    gameType = 'math_blitz' as GameType,
    difficulty = 'medium' as Difficulty,
    childGrade = 4,
    punishmentId,
    taskId,
  } = route.params || {};

  const passThreshold = PASS[gameType as GameType][difficulty as Difficulty];
  const [phase, setPhase] = useState<Phase>('intro');

  // ── Math Blitz state ──
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [mathIdx, setMathIdx] = useState(0);
  const [mathScore, setMathScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [btnFlash, setBtnFlash] = useState<{ idx: number; ok: boolean } | null>(null);
  const timerRef = useRef<any>(null);

  // ── Memory Sequence state ──
  const [memLevel, setMemLevel] = useState(1);
  const [memSeq, setMemSeq] = useState<number[]>([]);
  const [memPlayer, setMemPlayer] = useState<number[]>([]);
  const [memShowing, setMemShowing] = useState(false);
  const [memActive, setMemActive] = useState<number | null>(null);
  const [memWaiting, setMemWaiting] = useState(false);
  const [memFailed, setMemFailed] = useState(false);

  // ── Animations ──
  const flashAnim = useRef(new Animated.Value(1)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const timerAnim = useRef(new Animated.Value(1)).current;

  // ── Generate math problems ──
  const startMathBlitz = useCallback(() => {
    const ps = Array.from({ length: TOTAL_MATH }, () => genMathProblem(difficulty as Difficulty, childGrade));
    setProblems(ps);
    setMathIdx(0);
    setMathScore(0);
    setCombo(0);
    setTimeLeft(45);
    setPhase('playing');
  }, [difficulty]);

  // ── Math timer ──
  useEffect(() => {
    if (gameType !== 'math_blitz' || phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, gameType]);

  // ── Timer urgency animation ──
  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0 && gameType === 'math_blitz' && phase === 'playing') {
      Animated.sequence([
        Animated.timing(timerAnim, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(timerAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [timeLeft]);

  const handleMathAnswer = (opt: number) => {
    if (btnFlash) return;
    const correct = opt === problems[mathIdx].answer;
    setBtnFlash({ idx: problems[mathIdx].options.indexOf(opt), ok: correct });

    if (correct) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMathScore((s) => s + 1);
      Animated.sequence([
        Animated.timing(scoreAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(scoreAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      setCombo(0);
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
        Animated.timing(flashAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
    }

    setTimeout(() => {
      setBtnFlash(null);
      const next = mathIdx + 1;
      if (next >= TOTAL_MATH) {
        clearInterval(timerRef.current);
        setPhase('result');
      } else {
        setMathIdx(next);
      }
    }, 500);
  };

  // ── Memory Sequence ──
  const startMemGame = useCallback(() => {
    setMemLevel(1);
    setMemFailed(false);
    setMemPlayer([]);
    setMemShowing(false);
    setMemWaiting(false);
    setPhase('playing');
  }, []);

  const showSequence = useCallback((seq: number[]) => {
    setMemShowing(true);
    setMemWaiting(false);
    setMemPlayer([]);
    let i = 0;
    const show = () => {
      if (i >= seq.length) {
        setMemActive(null);
        setMemShowing(false);
        setMemWaiting(true);
        return;
      }
      setMemActive(seq[i]);
      setTimeout(() => { setMemActive(null); i++; setTimeout(show, 300); }, 600);
    };
    setTimeout(show, 500);
  }, []);

  // Start memory game when phase changes to playing
  useEffect(() => {
    if (gameType !== 'memory_sequence' || phase !== 'playing') return;
    const seq = [Math.floor(Math.random() * 4)];
    setMemSeq(seq);
    showSequence(seq);
  }, [phase, gameType]);

  const handleMemTap = (idx: number) => {
    if (!memWaiting || memShowing) return;
    const newPlayer = [...memPlayer, idx];
    setMemPlayer(newPlayer);

    // Check each step
    if (idx !== memSeq[newPlayer.length - 1]) {
      // Wrong!
      setMemFailed(true);
      setMemWaiting(false);
      setTimeout(() => setPhase('result'), 800);
      return;
    }

    if (newPlayer.length === memSeq.length) {
      // Completed this level
      const nextLevel = memLevel + 1;
      setMemLevel(nextLevel);

      if (nextLevel > passThreshold + 2) {
        // Won!
        setTimeout(() => setPhase('result'), 600);
        return;
      }

      // Next level: add one more
      const newSeq = [...memSeq, Math.floor(Math.random() * 4)];
      setMemSeq(newSeq);
      setTimeout(() => showSequence(newSeq), 800);
    }
  };

  // ── Save result to Firestore ──
  const saveResult = useCallback(async (passed: boolean) => {
    if (!punishmentId || !taskId) return;
    try {
      const { getDoc } = await import('firebase/firestore');
      const punDoc = await getDoc(doc(db, 'punishments', punishmentId));
      if (!punDoc.exists()) return;
      const pun = punDoc.data();
      const updatedTasks = pun.tasks.map((t: any) =>
        t.id === taskId
          ? {
              ...t,
              status: passed ? 'approved' : 'pending',
              gameScore: gameType === 'math_blitz' ? mathScore : memLevel - 1,
              approvedAt: passed ? new Date() : null,
            }
          : t
      );
      await updateDoc(doc(db, 'punishments', punishmentId), { tasks: updatedTasks });

      // Award wallet coins on pass
      if (passed && pun.childId) {
        try {
          const parentDoc = await getDoc(doc(db, 'users', pun.parentId));
          const walletConfig = parentDoc.exists()
            ? (parentDoc.data().walletConfig || DEFAULT_WALLET_CONFIG)
            : DEFAULT_WALLET_CONFIG;
          if (walletConfig.enabled !== false) {
            const coins = walletConfig.coinsPerGame || DEFAULT_WALLET_CONFIG.coinsPerGame;
            const taskObj = pun.tasks.find((t: any) => t.id === taskId);
            await awardCoins(pun.childId, coins, `Game: ${taskObj?.title || gameType}`);
          }
        } catch (_) {}
      }
    } catch (e) {
      console.error('Failed to save game result:', e);
    }
  }, [punishmentId, taskId, mathScore, memLevel, gameType]);

  // ── Intro screen ──
  if (phase === 'intro') {
    const isMath = gameType === 'math_blitz';
    return (
      <LinearGradient
        colors={isMath ? ['#1a1a2e', '#16213e', '#e74c3c'] : ['#1a1a2e', '#16213e', '#8E54E9']}
        style={styles.fullScreen}
      >
        <ScrollView contentContainerStyle={styles.centered}>
          <Text style={styles.bigEmoji}>{isMath ? '⚡' : '🧠'}</Text>
          <Text style={styles.gameTitle}>{isMath ? 'Math Blitz' : 'Memory Sequence'}</Text>
          <Text style={styles.diffBadge}>{difficulty.toUpperCase()} · Grade {childGrade}</Text>
          <View style={styles.rulesCard}>
            {isMath ? (
              <>
                <Text style={styles.ruleText}>⏱ 45 seconds on the clock</Text>
                <Text style={styles.ruleText}>🔢 {TOTAL_MATH} math problems</Text>
                <Text style={styles.ruleText}>🎯 Need {passThreshold}/{TOTAL_MATH} to pass</Text>
                <Text style={styles.ruleText}>🔥 Build combos for bonus points!</Text>
              </>
            ) : (
              <>
                <Text style={styles.ruleText}>👀 Watch the pattern flash</Text>
                <Text style={styles.ruleText}>👆 Tap the same sequence back</Text>
                <Text style={styles.ruleText}>📈 Each round gets longer</Text>
                <Text style={styles.ruleText}>🎯 Reach level {passThreshold} to pass</Text>
              </>
            )}
          </View>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={isMath ? startMathBlitz : startMemGame}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isMath ? ['#e74c3c', '#c0392b'] : ['#8E54E9', '#4776E6']}
              style={styles.startBtnGrad}
            >
              <Text style={styles.startBtnText}>🚀 START GAME</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ── Result screen ──
  if (phase === 'result') {
    const isMath = gameType === 'math_blitz';
    const score = isMath ? mathScore : memLevel - 1;
    const passed = score >= passThreshold;

    return (
      <LinearGradient
        colors={passed ? ['#1a1a2e', '#16213e', '#27AE60'] : ['#1a1a2e', '#16213e', '#c0392b']}
        style={styles.fullScreen}
      >
        <ScrollView contentContainerStyle={styles.centered}>
          <Text style={styles.bigEmoji}>{passed ? '🏆' : '💪'}</Text>
          <Text style={styles.gameTitle}>{passed ? 'YOU PASSED!' : 'ALMOST!'}</Text>

          <View style={styles.scoreCard}>
            <Text style={styles.scoreBig}>{score}</Text>
            <Text style={styles.scoreOf}>/ {isMath ? TOTAL_MATH : passThreshold + 2}</Text>
            <Text style={styles.scoreLabel}>{isMath ? 'correct answers' : `levels reached`}</Text>
          </View>

          {passed ? (
            <>
              <Text style={styles.passMsg}>✅ Task completed automatically!</Text>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={async () => {
                  await saveResult(true);
                  navigation.goBack();
                }}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#27AE60', '#2ECC71']} style={styles.startBtnGrad}>
                  <Text style={styles.startBtnText}>🏠 Back to Tasks</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.failMsg}>Need {passThreshold} to pass. Try again!</Text>
              <TouchableOpacity
                style={styles.startBtn}
                onPress={isMath ? startMathBlitz : startMemGame}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#E74C3C', '#c0392b']} style={styles.startBtnGrad}>
                  <Text style={styles.startBtnText}>🔄 Try Again</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.backBtnText}>← Back to Tasks</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </LinearGradient>
    );
  }

  // ── Math Blitz playing ──
  if (gameType === 'math_blitz' && phase === 'playing') {
    const prob = problems[mathIdx];
    if (!prob) return null;
    const timerPct = timeLeft / 45;
    const timerColor = timeLeft > 15 ? '#27AE60' : timeLeft > 8 ? '#F39C12' : '#E74C3C';

    return (
      <Animated.View style={[styles.fullScreen, { opacity: flashAnim }]}>
        <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.fullScreen}>
          {/* HUD */}
          <View style={styles.mathHud}>
            <View style={styles.hudItem}>
              <Text style={styles.hudLabel}>SCORE</Text>
              <Text style={styles.hudValue}>{mathScore}</Text>
            </View>
            <Animated.View style={[styles.timerCircle, { borderColor: timerColor, transform: [{ scale: timerAnim }] }]}>
              <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}</Text>
            </Animated.View>
            <View style={styles.hudItem}>
              <Text style={styles.hudLabel}>COMBO</Text>
              <Text style={[styles.hudValue, combo >= 3 ? styles.comboFire : null]}>
                {combo >= 3 ? `🔥${combo}` : `×${combo}`}
              </Text>
            </View>
          </View>

          {/* Progress */}
          <View style={styles.mathProgress}>
            <View style={[styles.mathProgressFill, { width: `${(mathIdx / TOTAL_MATH) * 100}%` as any }]} />
          </View>
          <Text style={styles.mathProgressText}>{mathIdx + 1} / {TOTAL_MATH}</Text>

          {/* Question */}
          <View style={styles.questionBox}>
            <Text style={styles.questionText}>{prob.question}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsGrid}>
            {prob.options.map((opt, i) => {
              let bg = ['#2C3E50', '#2C3E50'];
              if (btnFlash?.idx === i) bg = btnFlash.ok ? ['#27AE60', '#2ECC71'] : ['#E74C3C', '#C0392B'];
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.optionWrapper}
                  onPress={() => handleMathAnswer(opt)}
                  activeOpacity={0.7}
                  disabled={!!btnFlash}
                >
                  <LinearGradient colors={bg as [string, string]} style={styles.optionBtn}>
                    <Text style={styles.optionText}>{opt}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  // ── Memory Sequence playing ──
  if (gameType === 'memory_sequence' && phase === 'playing') {
    return (
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={styles.fullScreen}>
        {/* HUD */}
        <View style={styles.mathHud}>
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>LEVEL</Text>
            <Text style={styles.hudValue}>{memLevel}</Text>
          </View>
          <View style={styles.hudItem}>
            <Text style={styles.hudLabel}>GOAL</Text>
            <Text style={styles.hudValue}>{passThreshold}</Text>
          </View>
        </View>

        <Text style={styles.memStatus}>
          {memShowing ? '👀 Watch carefully...' : memWaiting ? '👆 Your turn!' : memFailed ? '❌ Wrong!' : ''}
        </Text>

        {/* Sequence hint dots */}
        <View style={styles.seqDots}>
          {memSeq.map((c, i) => (
            <View
              key={i}
              style={[styles.seqDot, { backgroundColor: i < memPlayer.length ? MEM_COLORS[memSeq[i]] : '#555' }]}
            />
          ))}
        </View>

        {/* 2×2 Grid */}
        <View style={styles.memGrid}>
          {MEM_COLORS.map((color, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.memCell,
                { backgroundColor: memActive === idx ? '#FFFFFF' : color },
                memActive === idx && styles.memCellActive,
              ]}
              onPress={() => handleMemTap(idx)}
              disabled={!memWaiting}
              activeOpacity={0.7}
            >
              <Text style={styles.memCellText}>{MEM_LABELS[idx]}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>
    );
  }

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  fullScreen: { flex: 1 },
  centered: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, paddingTop: 60 },
  bigEmoji: { fontSize: 80, marginBottom: 12 },
  gameTitle: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8, textAlign: 'center' },
  diffBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20, color: '#FFD700', fontWeight: 'bold', fontSize: 14, marginBottom: 24 },
  rulesCard: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, width: '100%', marginBottom: 32, gap: 10 },
  ruleText: { color: '#FFFFFF', fontSize: 16, textAlign: 'center' },
  startBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', marginBottom: 16 },
  startBtnGrad: { padding: 18, alignItems: 'center' },
  startBtnText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', letterSpacing: 1 },
  backBtn: { padding: 12 },
  backBtnText: { color: 'rgba(255,255,255,0.6)', fontSize: 16 },
  // Math HUD
  mathHud: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50 },
  hudItem: { alignItems: 'center', flex: 1 },
  hudLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  hudValue: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
  comboFire: { color: '#FF6B35', fontSize: 26 },
  timerCircle: { width: 70, height: 70, borderRadius: 35, borderWidth: 3, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)' },
  timerText: { fontSize: 28, fontWeight: 'bold' },
  mathProgress: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 20, borderRadius: 3, overflow: 'hidden' },
  mathProgressFill: { height: '100%', backgroundColor: '#8E54E9', borderRadius: 3 },
  mathProgressText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', marginTop: 6 },
  questionBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  questionText: { fontSize: 52, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', letterSpacing: 2 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12, justifyContent: 'center', paddingBottom: 40 },
  optionWrapper: { width: '45%' },
  optionBtn: { padding: 20, borderRadius: 16, alignItems: 'center', elevation: 6 },
  optionText: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },
  // Memory
  memStatus: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginVertical: 12, minHeight: 26 },
  seqDots: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24, gap: 6, flexWrap: 'wrap', paddingHorizontal: 20 },
  seqDot: { width: 14, height: 14, borderRadius: 7 },
  memGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, padding: 20 },
  memCell: { width: 140, height: 140, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  memCellActive: { transform: [{ scale: 1.08 }], shadowColor: '#FFF', shadowOpacity: 0.6, shadowRadius: 20, elevation: 20 },
  memCellText: { fontSize: 48 },
  // Result
  scoreCard: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 24, gap: 6 },
  scoreBig: { fontSize: 80, fontWeight: 'bold', color: '#FFFFFF' },
  scoreOf: { fontSize: 36, color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' },
  scoreLabel: { position: 'absolute', bottom: -24, left: 0, right: 0, textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  passMsg: { color: '#2ECC71', fontSize: 16, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  failMsg: { color: 'rgba(255,255,255,0.7)', fontSize: 15, marginBottom: 24, textAlign: 'center' },
});
