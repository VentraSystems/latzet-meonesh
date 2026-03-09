import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { taskPresets } from '../../data/taskPresets';
import { notifyNewPunishment } from '../../utils/notifications';
import { showAlert } from '../../utils/alert';
import { useLanguage } from '../../contexts/LanguageContext';

const AI_QUIZ_URL = 'https://escapechallenge.ventrasystems.com/api/generate-quiz';
const AI_SUGGEST_URL = 'https://escapechallenge.ventrasystems.com/api/suggest-tasks';

const AI_SUBJECTS = [
  { id: 'math',      label: 'מתמטיקה',   labelEn: 'Math',       icon: '🔢', color: '#E74C3C' },
  { id: 'hebrew',    label: 'עברית',      labelEn: 'Hebrew',     icon: '📖', color: '#9B59B6' },
  { id: 'english',   label: 'אנגלית',     labelEn: 'English',    icon: '🇬🇧', color: '#3498DB' },
  { id: 'science',   label: 'מדעים',      labelEn: 'Science',    icon: '🔬', color: '#27AE60' },
  { id: 'bible',     label: 'תנ"ך',       labelEn: 'Bible',      icon: '📜', color: '#E67E22' },
  { id: 'history',   label: 'היסטוריה',   labelEn: 'History',    icon: '🏛️', color: '#795548' },
  { id: 'geography', label: 'גיאוגרפיה',  labelEn: 'Geography',  icon: '🌍', color: '#00BCD4' },
  { id: 'general',   label: 'ידע כללי',   labelEn: 'General',    icon: '🧠', color: '#F39C12' },
];

const DIFFICULTIES = [
  { id: 'easy',   label: 'קל 😊',        labelEn: 'Easy 😊' },
  { id: 'medium', label: 'בינוני 🤔',    labelEn: 'Medium 🤔' },
  { id: 'hard',   label: 'קשה 💪',       labelEn: 'Hard 💪' },
];

const GRADES = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','יא','יב'];

interface AiQuizConfig {
  subject: string;
  difficulty: string;
  grade: number; // 1-12
}

export default function SetPunishmentScreen({ navigation }: any) {
  const [punishmentName, setPunishmentName] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [customTask, setCustomTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  // Child info
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState(4);

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>([]);

  // No-phone duration picker
  const [noPhoneExpanded, setNoPhoneExpanded] = useState(false);
  const [noPhoneDuration, setNoPhoneDuration] = useState(1); // hours
  const [noPhoneConfirmed, setNoPhoneConfirmed] = useState<number | null>(null); // confirmed hours

  // AI quiz: which subject card is expanded for config
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  // Map of subjectId -> config for added quizzes
  const [aiQuizzes, setAiQuizzes] = useState<Record<string, AiQuizConfig>>({});
  // Temporary config while selecting
  const [tempDifficulty, setTempDifficulty] = useState('easy');
  const [tempGrade, setTempGrade] = useState(4);

  const { user, linkedUserId } = useAuth();
  const { t, isRTL, language } = useLanguage();

  useEffect(() => {
    if (!linkedUserId) return;
    getDoc(doc(db, 'users', linkedUserId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setChildName(data.name || '');
        setChildGrade(data.grade || 4);
      }
    });
  }, [linkedUserId]);

  const fetchAiSuggestions = async () => {
    setLoadingSuggestions(true);
    setAiSuggestions([]);
    setSelectedSuggestionIds([]);
    try {
      const resp = await fetch(AI_SUGGEST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: childGrade, age: childGrade + 5, childName: childName || (language === 'en' ? 'the child' : 'הילד'), language }),
      });
      const data = await resp.json();
      if (!data.success || !data.tasks) throw new Error('שגיאה בקבלת הצעות');
      setAiSuggestions(data.tasks.map((t: any, i: number) => ({ ...t, _id: `ai-suggest-${Date.now()}-${i}` })));
    } catch {
      showAlert(t.common.error, t.setPunishment.errorSuggest);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleTask = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const addCustomTask = () => {
    if (customTask.trim()) {
      setSelectedTasks((prev) => [...prev, `custom-${Date.now()}-${customTask}`]);
      setCustomTask('');
    }
  };

  const openSubject = (subjectId: string) => {
    if (expandedSubject === subjectId) {
      setExpandedSubject(null);
      return;
    }
    // Pre-fill with existing config if already added
    if (aiQuizzes[subjectId]) {
      setTempDifficulty(aiQuizzes[subjectId].difficulty);
      setTempGrade(aiQuizzes[subjectId].grade);
    } else {
      setTempDifficulty('easy');
      setTempGrade(childGrade);
    }
    setExpandedSubject(subjectId);
  };

  const confirmAddQuiz = (subjectId: string) => {
    setAiQuizzes((prev) => ({
      ...prev,
      [subjectId]: { subject: subjectId, difficulty: tempDifficulty, grade: tempGrade },
    }));
    setExpandedSubject(null);
  };

  const removeQuiz = (subjectId: string) => {
    setAiQuizzes((prev) => {
      const next = { ...prev };
      delete next[subjectId];
      return next;
    });
  };

  const totalCount = selectedTasks.length + Object.keys(aiQuizzes).length + selectedSuggestionIds.length;

  const createPunishment = async () => {
    if (!punishmentName.trim()) {
      showAlert(t.common.error, t.setPunishment.errorName);
      return;
    }
    if (totalCount === 0) {
      showAlert(t.common.error, t.setPunishment.errorNoTasks);
      return;
    }
    if (!linkedUserId) {
      showAlert(t.common.error, t.setPunishment.errorNoChild);
      return;
    }

    setLoading(true);

    try {
      // Generate all AI quizzes in parallel
      const aiSubjectIds = Object.keys(aiQuizzes);
      let generatedQuizzes: Record<string, any> = {};

      if (aiSubjectIds.length > 0) {
        setLoadingMsg(language === 'en' ? `Generating ${aiSubjectIds.length} AI quiz(zes)...` : `מייצר ${aiSubjectIds.length} חידון AI...`);
        const results = await Promise.all(
          aiSubjectIds.map(async (subjectId) => {
            const cfg = aiQuizzes[subjectId];
            const resp = await fetch(AI_QUIZ_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subject: cfg.subject,
                difficulty: cfg.difficulty,
                grade: cfg.grade,
                count: 5,
              }),
            });
            const data = await resp.json();
            if (!data.success) throw new Error(language === 'en' ? `Error generating quiz for ${subjectId}` : `שגיאה ביצירת חידון ${subjectId}`);
            return { subjectId, data };
          })
        );
        results.forEach(({ subjectId, data }) => {
          generatedQuizzes[subjectId] = data;
        });
      }

      setLoadingMsg(language === 'en' ? 'Saving...' : 'שומר עונש...');

      // Build preset tasks
      const presetTasks = selectedTasks.map((taskId) => {
        const preset = taskPresets.find((t) => t.id === taskId);
        if (preset) {
          // Special case: no-phone with chosen duration
          if (taskId === 'no-phone-hour' && noPhoneConfirmed !== null) {
            const dur = fmtDuration(noPhoneConfirmed);
            return {
              id: taskId,
              title: language === 'en' ? `📵 No Phone — ${dur}` : `📵 בלי טלפון — ${dur}`,
              description: language === 'en'
                ? `No phone use for ${dur}`
                : `לא להשתמש בטלפון למשך ${dur}`,
              type: preset.type,
              status: 'pending',
              noPhoneHours: noPhoneConfirmed,
            };
          }
          return {
            id: taskId,
            title: language === 'en' ? preset.titleEn : preset.title,
            description: language === 'en' ? preset.descriptionEn : preset.description,
            type: preset.type,
            status: 'pending',
          };
        }
        // Custom
        const customTitle = taskId.split('-').slice(2).join('-');
        return { id: taskId, title: customTitle, description: language === 'en' ? 'Custom task' : 'משימה מותאמת אישית', type: 'task', status: 'pending' };
      });

      // Build AI quiz tasks
      const aiTasks = aiSubjectIds.map((subjectId) => {
        const cfg = aiQuizzes[subjectId];
        const qdata = generatedQuizzes[subjectId];
        const subject = AI_SUBJECTS.find((s) => s.id === subjectId);
        const subjectLabel = language === 'en' ? (subject?.labelEn || subject?.label) : subject?.label;
        const diffLabel = language === 'en'
          ? (DIFFICULTIES.find((d) => d.id === cfg.difficulty)?.labelEn || cfg.difficulty)
          : (DIFFICULTIES.find((d) => d.id === cfg.difficulty)?.label || cfg.difficulty);
        const gradeLabel = language === 'en' ? String(cfg.grade) : (GRADES[cfg.grade - 1] || String(cfg.grade));
        return {
          id: `ai-quiz-${subjectId}-${Date.now()}`,
          title: language === 'en'
            ? `${subject?.icon} ${subjectLabel} Quiz - Grade ${gradeLabel}`
            : `${subject?.icon} חידון ${subjectLabel} - כיתה ${gradeLabel}`,
          description: language === 'en'
            ? `${diffLabel} • 5 questions • AI generated`
            : `${diffLabel} • 5 שאלות • נוצר ע"י AI`,
          type: 'quiz',
          status: 'pending',
          quizData: {
            id: `ai-quiz-${subjectId}`,
            title: language === 'en' ? `${subjectLabel} Quiz` : `חידון ${qdata.subjectName}`,
            subject: qdata.subjectName,
            difficulty: cfg.difficulty,
            questions: qdata.questions,
          },
        };
      });

      // Build AI suggested tasks
      const suggestionTasks = selectedSuggestionIds.map((id) => {
        const s = aiSuggestions.find((x) => x._id === id);
        if (!s) return null;
        return {
          id,
          title: `${s.emoji || '📋'} ${s.title}`,
          description: s.description,
          type: s.type || 'task',
          status: 'pending',
          estimatedMinutes: s.estimatedMinutes,
        };
      }).filter(Boolean);

      const allTasks = [...presetTasks, ...aiTasks, ...suggestionTasks];

      const punishmentRef = await addDoc(collection(db, 'punishments'), {
        name: punishmentName,
        parentId: user!.uid,
        childId: linkedUserId,
        tasks: allTasks,
        status: 'active',
        createdAt: new Date(),
        requiredTasksCount: allTasks.length,
      });

      await notifyNewPunishment(linkedUserId, punishmentName, allTasks.length, punishmentRef.id);

      showAlert(t.setPunishment.successTitle, t.setPunishment.successMsg.replace('{n}', String(allTasks.length)), [
        { text: t.common.ok, onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      showAlert(t.common.error, error.message || t.setPunishment.errorNoTasks);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const NO_PHONE_DURATIONS = [0.5, 1, 2, 3, 4, 6, 8, 12, 24];

  const fmtDuration = (h: number) => {
    if (language === 'en') {
      return h === 0.5 ? '30 min' : h === 1 ? '1 hour' : `${h} hours`;
    } else {
      return h === 0.5 ? '30 דק\'' : h === 1 ? 'שעה' : `${h} שעות`;
    }
  };

  const confirmNoPhone = () => {
    setNoPhoneConfirmed(noPhoneDuration);
    setNoPhoneExpanded(false);
    if (!selectedTasks.includes('no-phone-hour')) {
      setSelectedTasks((prev) => [...prev, 'no-phone-hour']);
    }
  };

  const removeNoPhone = () => {
    setNoPhoneConfirmed(null);
    setNoPhoneExpanded(false);
    setSelectedTasks((prev) => prev.filter((id) => id !== 'no-phone-hour'));
  };

  const choreTasks = taskPresets.filter((t) => t.category === 'chores');
  const behaviorTasks = taskPresets.filter((t) => t.category === 'behavior');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t.setPunishment.title}</Text>

      {/* Punishment name */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.setPunishment.punishmentName}</Text>
        <TextInput
          style={styles.input}
          placeholder={t.setPunishment.namePlaceholder}
          value={punishmentName}
          onChangeText={setPunishmentName}
          textAlign={isRTL ? 'right' : 'left'}
        />
      </View>

      {/* Summary badge */}
      {totalCount > 0 && (
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryText}>{t.setPunishment.selectedCount.replace('{n}', String(totalCount))}</Text>
        </View>
      )}

      {/* Chores */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.setPunishment.chores}</Text>
        <View style={styles.taskGrid}>
          {choreTasks.map((task) => {
            const selected = selectedTasks.includes(task.id);
            return (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, selected && styles.taskCardSelected]}
                onPress={() => toggleTask(task.id)}
              >
                <Text style={styles.taskCardIcon}>{task.icon}</Text>
                <Text style={[styles.taskCardTitle, selected && styles.taskCardTitleSelected]}>
                  {language === 'en' ? task.titleEn : task.title}
                </Text>
                {selected && <Text style={styles.taskCardCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Behavior */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.setPunishment.behavior}</Text>
        <View style={styles.taskGrid}>
          {behaviorTasks.map((task) => {
            if (task.id === 'no-phone-hour') {
              const isConfirmed = noPhoneConfirmed !== null;
              const isExpanded = noPhoneExpanded;
              return (
                <View key={task.id} style={styles.noPhoneWrap}>
                  <TouchableOpacity
                    style={[styles.taskCard, styles.noPhoneCard, isConfirmed && styles.taskCardSelected, isExpanded && styles.noPhoneCardExpanded]}
                    onPress={() => {
                      if (isExpanded) { setNoPhoneExpanded(false); return; }
                      setNoPhoneDuration(noPhoneConfirmed ?? 1);
                      setNoPhoneExpanded(true);
                    }}
                  >
                    <Text style={styles.taskCardIcon}>{task.icon}</Text>
                    <Text style={[styles.taskCardTitle, isConfirmed && styles.taskCardTitleSelected]}>
                      {isConfirmed
                        ? (language === 'en' ? `No Phone — ${fmtDuration(noPhoneConfirmed!)}` : `בלי טלפון — ${fmtDuration(noPhoneConfirmed!)}`)
                        : (language === 'en' ? task.titleEn : task.title)}
                    </Text>
                    <Text style={[styles.noPhoneHint, isConfirmed && { color: '#27AE60' }]}>
                      {isExpanded ? '▲' : '▼'} {language === 'en' ? 'choose duration' : 'בחר זמן'}
                    </Text>
                    {isConfirmed && <Text style={styles.taskCardCheck}>✓</Text>}
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.noPhonePanel}>
                      <Text style={styles.noPanelTitle}>{language === 'en' ? '📵 No Phone — choose duration' : '📵 בלי טלפון — בחר כמה זמן'}</Text>
                      <View style={styles.pillRow}>
                        {NO_PHONE_DURATIONS.map((h) => (
                          <TouchableOpacity
                            key={h}
                            style={[styles.pill, noPhoneDuration === h && styles.noPhonePillSelected]}
                            onPress={() => setNoPhoneDuration(h)}
                          >
                            <Text style={[styles.pillText, noPhoneDuration === h && styles.pillTextSelected]}>
                              {fmtDuration(h)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      <View style={styles.noPanelButtons}>
                        <TouchableOpacity style={styles.noPhoneConfirmBtn} onPress={confirmNoPhone}>
                          <Text style={styles.confirmButtonText}>{language === 'en' ? `Add — ${fmtDuration(noPhoneDuration)}` : `הוסף — ${fmtDuration(noPhoneDuration)}`}</Text>
                        </TouchableOpacity>
                        {isConfirmed && (
                          <TouchableOpacity style={styles.noPhoneRemoveBtn} onPress={removeNoPhone}>
                            <Text style={styles.confirmButtonText}>{language === 'en' ? 'Remove' : 'הסר'}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            }

            const selected = selectedTasks.includes(task.id);
            return (
              <TouchableOpacity
                key={task.id}
                style={[styles.taskCard, selected && styles.taskCardSelected]}
                onPress={() => toggleTask(task.id)}
              >
                <Text style={styles.taskCardIcon}>{task.icon}</Text>
                <Text style={[styles.taskCardTitle, selected && styles.taskCardTitleSelected]}>
                  {language === 'en' ? task.titleEn : task.title}
                </Text>
                {selected && <Text style={styles.taskCardCheck}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* AI Learning Quizzes */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.setPunishment.aiQuizzes}</Text>
        <Text style={[styles.sectionHint, { textAlign: isRTL ? 'right' : 'left' }]}>{t.setPunishment.aiHint}</Text>

        <View style={styles.subjectGrid}>
          {AI_SUBJECTS.map((subject) => {
            const isAdded = !!aiQuizzes[subject.id];
            const isExpanded = expandedSubject === subject.id;
            return (
              <View key={subject.id} style={styles.subjectCardWrap}>
                <TouchableOpacity
                  style={[
                    styles.subjectCard,
                    { borderColor: subject.color },
                    isAdded && { backgroundColor: subject.color },
                    isExpanded && styles.subjectCardExpanded,
                  ]}
                  onPress={() => openSubject(subject.id)}
                >
                  <Text style={styles.subjectIcon}>{subject.icon}</Text>
                  <Text style={[styles.subjectLabel, isAdded && styles.subjectLabelAdded]}>
                    {language === 'en' ? subject.labelEn : subject.label}
                  </Text>
                  {isAdded && (
                    <TouchableOpacity
                      style={styles.removeBadge}
                      onPress={(e) => { e.stopPropagation?.(); removeQuiz(subject.id); }}
                    >
                      <Text style={styles.removeBadgeText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                {/* Expanded config panel */}
                {isExpanded && (
                  <View style={[styles.configPanel, { borderColor: subject.color }]}>
                    <Text style={styles.configTitle}>{language === 'en' ? `Quiz Settings ${subject.icon} ${subject.labelEn}` : `הגדרות חידון ${subject.icon} ${subject.label}`}</Text>

                    <Text style={[styles.configLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t.setPunishment.diffLabel}</Text>
                    <View style={styles.pillRow}>
                      {DIFFICULTIES.map((d) => (
                        <TouchableOpacity
                          key={d.id}
                          style={[styles.pill, tempDifficulty === d.id && { backgroundColor: subject.color, borderColor: subject.color }]}
                          onPress={() => setTempDifficulty(d.id)}
                        >
                          <Text style={[styles.pillText, tempDifficulty === d.id && styles.pillTextSelected]}>
                            {language === 'en' ? d.labelEn : d.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={[styles.configLabel, { textAlign: isRTL ? 'right' : 'left' }]}>{t.setPunishment.gradeLabel}</Text>
                    <View style={styles.pillRow}>
                      {GRADES.map((g, i) => (
                        <TouchableOpacity
                          key={g}
                          style={[styles.pill, styles.pillGrade, tempGrade === i + 1 && { backgroundColor: subject.color, borderColor: subject.color }]}
                          onPress={() => setTempGrade(i + 1)}
                        >
                          <Text style={[styles.pillText, tempGrade === i + 1 && styles.pillTextSelected]}>{g}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[styles.confirmButton, { backgroundColor: subject.color }]}
                      onPress={() => confirmAddQuiz(subject.id)}
                    >
                      <Text style={styles.confirmButtonText}>
                        {isAdded ? t.setPunishment.updateQuiz : t.setPunishment.addQuiz.replace('{subject}', language === 'en' ? subject.labelEn : subject.label)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Show config summary when added */}
                {isAdded && !isExpanded && (
                  <View style={styles.addedSummary}>
                    <Text style={styles.addedSummaryText}>
                      {language === 'en' ? `Grade ${aiQuizzes[subject.id].grade}` : `כיתה ${GRADES[aiQuizzes[subject.id].grade - 1]}`} • {language === 'en' ? DIFFICULTIES.find(d => d.id === aiQuizzes[subject.id].difficulty)?.labelEn : DIFFICULTIES.find(d => d.id === aiQuizzes[subject.id].difficulty)?.label}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>

      {/* AI Task Suggestions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.setPunishment.surpriseTitle}</Text>
        <Text style={[styles.sectionHint, { textAlign: isRTL ? 'right' : 'left' }]}>{t.setPunishment.surpriseHint}</Text>

        <TouchableOpacity onPress={fetchAiSuggestions} disabled={loadingSuggestions} style={styles.surpriseButtonWrap}>
          <LinearGradient colors={['#8E54E9', '#4776E6']} style={styles.surpriseButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {loadingSuggestions ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#FFFFFF" />
                <Text style={styles.surpriseButtonText}>{t.setPunishment.generating}</Text>
              </View>
            ) : (
              <Text style={styles.surpriseButtonText}>{t.setPunishment.surpriseBtn}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {aiSuggestions.length > 0 && (
          <View style={styles.suggestionsGrid}>
            {aiSuggestions.map((s) => {
              const isSelected = selectedSuggestionIds.includes(s._id);
              return (
                <TouchableOpacity
                  key={s._id}
                  style={[styles.suggestionCard, isSelected && styles.suggestionCardSelected]}
                  onPress={() => toggleSuggestion(s._id)}
                >
                  <Text style={styles.suggestionEmoji}>{s.emoji || '📋'}</Text>
                  <Text style={[styles.suggestionTitle, isSelected && styles.suggestionTitleSelected]}>
                    {s.title}
                  </Text>
                  <Text style={styles.suggestionDesc} numberOfLines={2}>{s.description}</Text>
                  <Text style={styles.suggestionTime}>⏱ {s.estimatedMinutes} {language === 'en' ? 'min' : "דק'"}</Text>
                  {isSelected && <Text style={styles.suggestionCheck}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Custom task */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.setPunishment.customTask}</Text>
        <View style={styles.customTaskRow}>
          <TouchableOpacity style={styles.addButton} onPress={addCustomTask}>
            <Text style={styles.addButtonText}>{t.setPunishment.addCustom}</Text>
          </TouchableOpacity>
          <TextInput
            style={styles.customInput}
            placeholder={t.setPunishment.customPlaceholder}
            value={customTask}
            onChangeText={setCustomTask}
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>
        {selectedTasks.filter((id) => id.startsWith('custom-')).map((id) => (
          <View key={id} style={styles.customChip}>
            <TouchableOpacity onPress={() => toggleTask(id)}>
              <Text style={styles.customChipRemove}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.customChipText}>{id.split('-').slice(2).join('-')}</Text>
          </View>
        ))}
      </View>

      {/* Create button */}
      <TouchableOpacity
        style={[styles.createButton, totalCount === 0 && styles.createButtonDisabled]}
        onPress={createPunishment}
        disabled={loading || totalCount === 0}
      >
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.loadingText}>{loadingMsg || t.setPunishment.creating}</Text>
          </View>
        ) : (
          <Text style={styles.createButtonText}>
            {t.setPunishment.createBtn.replace('{n}', String(totalCount))}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
        <Text style={styles.cancelButtonText}>{t.setPunishment.cancel}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center', marginTop: 16, marginBottom: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2C3E50', textAlign: 'right', marginBottom: 8 },
  sectionHint: { fontSize: 13, color: '#7F8C8D', textAlign: 'right', marginBottom: 12 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  summaryBadge: { backgroundColor: '#27AE60', borderRadius: 20, padding: 10, alignItems: 'center', marginBottom: 16 },
  summaryText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },

  // Task grid (chores/behavior)
  taskGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  taskCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14,
    alignItems: 'center', borderWidth: 2, borderColor: '#E0E0E0', position: 'relative',
  },
  taskCardSelected: { borderColor: '#27AE60', backgroundColor: '#E8F8F5' },
  taskCardIcon: { fontSize: 28, marginBottom: 6 },
  taskCardTitle: { fontSize: 13, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center' },
  taskCardTitleSelected: { color: '#27AE60' },
  taskCardCheck: { position: 'absolute', top: 6, left: 8, fontSize: 16, color: '#27AE60', fontWeight: 'bold' },

  // No-phone duration picker
  noPhoneWrap: { width: '100%' },
  noPhoneCard: { width: '100%', borderRadius: 12, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  noPhoneCardExpanded: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  noPhoneHint: { fontSize: 11, color: '#95A5A6', marginTop: 4 },
  noPhonePanel: {
    backgroundColor: '#FAFAFA', borderWidth: 2, borderTopWidth: 0, borderColor: '#E0E0E0',
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12, padding: 14, marginBottom: 4,
  },
  noPanelTitle: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center', marginBottom: 12 },
  noPanelButtons: { flexDirection: 'row', gap: 8, marginTop: 14 },
  noPhoneConfirmBtn: { flex: 1, borderRadius: 10, padding: 12, alignItems: 'center', backgroundColor: '#E74C3C' },
  noPhoneRemoveBtn: { borderRadius: 10, padding: 12, alignItems: 'center', paddingHorizontal: 20, backgroundColor: '#95A5A6' },
  noPhonePillSelected: { backgroundColor: '#E74C3C', borderColor: '#E74C3C' },

  // Subject grid (AI quizzes)
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subjectCardWrap: { width: '47%' },
  subjectCard: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 2,
    alignItems: 'center', position: 'relative',
  },
  subjectCardExpanded: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  subjectIcon: { fontSize: 28, marginBottom: 6 },
  subjectLabel: { fontSize: 13, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center' },
  subjectLabelAdded: { color: '#FFFFFF' },
  removeBadge: { position: 'absolute', top: 4, left: 6, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  removeBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: 'bold' },
  addedSummary: { backgroundColor: '#F8F9FA', borderRadius: 8, padding: 6, alignItems: 'center', marginTop: 4 },
  addedSummaryText: { fontSize: 11, color: '#7F8C8D' },

  // Config panel
  configPanel: {
    backgroundColor: '#FAFAFA', borderWidth: 2, borderTopWidth: 0,
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12, padding: 14,
    marginBottom: 4,
  },
  configTitle: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center', marginBottom: 10 },
  configLabel: { fontSize: 13, fontWeight: 'bold', color: '#2C3E50', textAlign: 'right', marginBottom: 6, marginTop: 8 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, backgroundColor: '#ECF0F1', borderWidth: 1, borderColor: '#BDC3C7' },
  pillGrade: { paddingHorizontal: 8, minWidth: 32, alignItems: 'center' },
  pillText: { fontSize: 12, color: '#2C3E50' },
  pillTextSelected: { color: '#FFFFFF', fontWeight: 'bold' },
  confirmButton: { borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 14 },
  confirmButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },

  // Custom task
  customTaskRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  customInput: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#E0E0E0' },
  addButton: { backgroundColor: '#3498DB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  addButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  customChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F8F5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8, gap: 8, borderWidth: 1, borderColor: '#27AE60' },
  customChipText: { flex: 1, color: '#2C3E50', fontSize: 14, textAlign: 'right' },
  customChipRemove: { color: '#E74C3C', fontWeight: 'bold', fontSize: 16 },

  // AI Suggestions
  surpriseButtonWrap: { borderRadius: 14, overflow: 'hidden', marginBottom: 12 },
  surpriseButton: { padding: 16, alignItems: 'center', borderRadius: 14 },
  surpriseButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: 'bold' },
  suggestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  suggestionCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12,
    borderWidth: 2, borderColor: '#E0E0E0', position: 'relative',
  },
  suggestionCardSelected: { borderColor: '#8E54E9', backgroundColor: '#F3EEFF' },
  suggestionEmoji: { fontSize: 24, marginBottom: 4 },
  suggestionTitle: { fontSize: 13, fontWeight: 'bold', color: '#2C3E50', textAlign: 'right', marginBottom: 4 },
  suggestionTitleSelected: { color: '#8E54E9' },
  suggestionDesc: { fontSize: 11, color: '#7F8C8D', textAlign: 'right', lineHeight: 16 },
  suggestionTime: { fontSize: 11, color: '#95A5A6', marginTop: 6, textAlign: 'right' },
  suggestionCheck: { position: 'absolute', top: 6, left: 8, fontSize: 16, color: '#8E54E9', fontWeight: 'bold' },

  // Buttons
  createButton: { backgroundColor: '#27AE60', borderRadius: 14, padding: 18, alignItems: 'center', marginBottom: 12 },
  createButtonDisabled: { backgroundColor: '#95A5A6' },
  createButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { color: '#FFFFFF', fontSize: 15 },
  cancelButton: { padding: 12, alignItems: 'center', marginBottom: 40 },
  cancelButtonText: { color: '#7F8C8D', fontSize: 16 },
});
