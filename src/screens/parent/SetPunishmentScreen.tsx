import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, addDoc, getDoc, doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { taskPresets } from '../../data/taskPresets';
import { notifyNewPunishment } from '../../utils/notifications';
import { showAlert } from '../../utils/alert';
import { useLanguage } from '../../contexts/LanguageContext';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

const UPLOAD_API = 'https://escapechallenge.ventrasystems.com/api/upload-image';

interface HomeworkTask {
  _id: string;
  title: string;
  description: string;
  photoUri: string | null;
}

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

export default function SetPunishmentScreen({ navigation, route }: any) {
  const existingPunishmentId: string | undefined = route?.params?.punishmentId;
  const [punishmentName, setPunishmentName] = useState('');
  const [nameEditedByUser, setNameEditedByUser] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [customTask, setCustomTask] = useState('');
  const [customTaskPhotoUri, setCustomTaskPhotoUri] = useState<string | null>(null);
  const [customTaskPhotos, setCustomTaskPhotos] = useState<Record<string, string>>({});
  const customCameraInputRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  // Child info
  const [childName, setChildName] = useState('');
  const [childGrade, setChildGrade] = useState(4);

  // AI suggestions
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<string[]>([]);

  // Per-task details (notes + reference photos)
  const [expandedTaskDetail, setExpandedTaskDetail] = useState<string | null>(null);
  const [taskNotes, setTaskNotes] = useState<Record<string, string>>({});
  const [taskRefPhotos, setTaskRefPhotos] = useState<Record<string, string[]>>({});
  const [taskRepeats, setTaskRepeats] = useState<Record<string, number>>({});

  // Homework tasks
  const [homeworkTasks, setHomeworkTasks] = useState<HomeworkTask[]>([]);
  const [hwTitle, setHwTitle] = useState('');
  const [hwDesc, setHwDesc] = useState('');
  const [hwPhotoUri, setHwPhotoUri] = useState<string | null>(null);

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

  // Mini games
  const [miniGames, setMiniGames] = useState<{ gameType: string; difficulty: string }[]>([]);

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
      const taskId = `custom-${Date.now()}-${customTask}`;
      setSelectedTasks((prev) => [...prev, taskId]);
      if (customTaskPhotoUri) {
        setCustomTaskPhotos((prev) => ({ ...prev, [taskId]: customTaskPhotoUri }));
      }
      setCustomTask('');
      setCustomTaskPhotoUri(null);
    }
  };

  const pickCustomTaskPhoto = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });
    if (!result.canceled && result.assets[0]) setCustomTaskPhotoUri(result.assets[0].uri);
  };

  const takeCustomTaskPhoto = () => {
    if (Platform.OS === 'web') { customCameraInputRef.current?.click(); return; }
    ImagePicker.requestCameraPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') return;
      ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.5 }).then((result) => {
        if (!result.canceled && result.assets[0]) setCustomTaskPhotoUri(result.assets[0].uri);
      });
    });
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

  const PICK_OPTS: ImagePicker.ImagePickerOptions = {
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.4,
    exif: false,
  };

  const pickHwPhoto = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
    }
    const result = await ImagePicker.launchImageLibraryAsync(PICK_OPTS);
    if (!result.canceled && result.assets[0]) setHwPhotoUri(result.assets[0].uri);
  };

  const addHomeworkTask = () => {
    if (!hwTitle.trim()) return;
    setHomeworkTasks((prev) => [...prev, { _id: `hw-${Date.now()}`, title: hwTitle.trim(), description: hwDesc.trim(), photoUri: hwPhotoUri }]);
    setHwTitle('');
    setHwDesc('');
    setHwPhotoUri(null);
  };

  const removeHomeworkTask = (id: string) => setHomeworkTasks((prev) => prev.filter((h) => h._id !== id));

  const uploadPhoto = async (uri: string, filename?: string): Promise<string> => {
    // Compress first
    const compressed = await ImageManipulator.manipulateAsync(
      uri, [], { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );
    const base64 = compressed.base64;
    if (!base64) throw new Error('Failed to compress image');

    const name = filename || `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const resp = await fetch(UPLOAD_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64, filename: name }),
    });
    const data = await resp.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');
    return data.url;
  };

  const uploadHomeworkPhoto = (uri: string, tempId: string) =>
    uploadPhoto(uri, `hw-${user!.uid}-${tempId}-${Date.now()}.jpg`);


  const totalCount = selectedTasks.length + Object.keys(aiQuizzes).length + selectedSuggestionIds.length + homeworkTasks.length + miniGames.length + (noPhoneConfirmed !== null ? 1 : 0);

  // Auto-fill challenge name from selected tasks
  useEffect(() => {
    if (nameEditedByUser) return;
    const parts: string[] = [];

    selectedTasks.forEach((id) => {
      const preset = taskPresets.find((p) => p.id === id);
      if (preset) parts.push(language === 'en' ? preset.titleEn : preset.title);
      else if (id.startsWith('custom-')) parts.push(id.split('-').slice(2).join('-'));
    });

    selectedSuggestionIds.forEach((id) => {
      const s = aiSuggestions.find((sg: any) => sg._id === id);
      if (s) parts.push(language === 'en' ? (s.titleEn || s.title) : s.title);
    });

    Object.keys(aiQuizzes).forEach((subjectId) => {
      const subject = AI_SUBJECTS.find((s) => s.id === subjectId);
      if (subject) parts.push(language === 'en' ? `${subject.labelEn} Quiz` : `חידון ${subject.label}`);
    });

    miniGames.forEach(() => {
      parts.push(language === 'en' ? 'Mini Game' : 'משחק');
    });

    homeworkTasks.forEach((hw) => {
      parts.push(hw.title || (language === 'en' ? 'Homework' : 'שיעורי בית'));
    });

    if (noPhoneConfirmed !== null) {
      parts.push(language === 'en' ? `No Phone — ${fmtDuration(noPhoneConfirmed)}` : `בלי טלפון — ${fmtDuration(noPhoneConfirmed)}`);
    }

    if (parts.length === 0) { setPunishmentName(''); return; }

    let name: string;
    if (parts.length === 1) {
      name = parts[0];
    } else if (parts.length <= 3) {
      name = parts.join(' + ');
    } else {
      name = `${parts[0]} + ${parts.length - 1} ${language === 'en' ? 'more' : 'עוד'}`;
    }
    setPunishmentName(name);
  }, [selectedTasks, aiQuizzes, miniGames, homeworkTasks, selectedSuggestionIds, noPhoneConfirmed, nameEditedByUser, language]);

  const createPunishment = async () => {
    if (!existingPunishmentId && !punishmentName.trim()) {
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
      // Upload homework photos (skip photo on failure, don't block challenge creation)
      let homeworkWithUrls: (HomeworkTask & { photoUrl: string | null })[] = [];
      if (homeworkTasks.length > 0) {
        setLoadingMsg(language === 'en' ? 'Uploading homework photos...' : 'מעלה תמונות שיעורים...');
        homeworkWithUrls = await Promise.all(
          homeworkTasks.map(async (hw) => {
            let photoUrl: string | null = null;
            if (hw.photoUri) {
              try {
                photoUrl = await uploadHomeworkPhoto(hw.photoUri, hw._id);
              } catch (uploadErr: any) {
                console.warn('Homework photo upload failed, skipping:', uploadErr?.message);
              }
            }
            return { ...hw, photoUrl };
          })
        );
      }

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

      // Upload reference photos for preset tasks
      if (Object.values(taskRefPhotos).some((photos) => photos.length > 0)) {
        setLoadingMsg(language === 'en' ? 'Uploading reference photos...' : 'מעלה תמונות עזר...');
      }
      const uploadedRefPhotos: Record<string, string[]> = {};
      await Promise.all(
        Object.entries(taskRefPhotos).map(async ([taskId, uris]) => {
          if (uris.length === 0) return;
          const urls = await Promise.all(uris.map(async (uri, i) => {
            try { return await uploadRefPhoto(uri, taskId, i); }
            catch (e: any) { console.warn('Ref photo upload failed, skipping:', e?.message); return null; }
          }));
          uploadedRefPhotos[taskId] = urls.filter(Boolean) as string[];
        })
      );

      // Upload custom task reference photos
      await Promise.all(
        Object.entries(customTaskPhotos).map(async ([taskId, uri]) => {
          if (!uri || uploadedRefPhotos[taskId]) return;
          try {
            const url = await uploadRefPhoto(uri, taskId, 0);
            uploadedRefPhotos[taskId] = [url];
          } catch (e) { console.warn('Custom task photo upload failed:', e); }
        })
      );

      // Build preset tasks (with optional daily repeat expansion)
      const presetTasks = selectedTasks.flatMap((taskId) => {
        const preset = taskPresets.find((t) => t.id === taskId);
        const repeatDays = taskRepeats[taskId] || 1;
        const parentNote = taskNotes[taskId] || '';
        const refPhotoUrls = uploadedRefPhotos[taskId] || [];

        const buildInstance = (day: number) => {
          const unlockDate = new Date();
          unlockDate.setDate(unlockDate.getDate() + day);
          const dateStr = unlockDate.toISOString().split('T')[0]; // 'YYYY-MM-DD'

          let title: string;
          let description: string;

          if (preset) {
            if (taskId === 'no-phone-hour' && noPhoneConfirmed !== null) {
              const dur = fmtDuration(noPhoneConfirmed);
              title = language === 'en' ? `📵 No Phone — ${dur}` : `📵 בלי טלפון — ${dur}`;
              description = language === 'en' ? `No phone use for ${dur}` : `לא להשתמש בטלפון למשך ${dur}`;
            } else {
              title = language === 'en' ? preset.titleEn : preset.title;
              description = language === 'en' ? preset.descriptionEn : preset.description;
            }
          } else {
            const customTitle = taskId.split('-').slice(2).join('-');
            title = customTitle;
            description = language === 'en' ? 'Custom task' : 'משימה מותאמת אישית';
          }

          if (repeatDays > 1) {
            title = language === 'en' ? `${title} (Day ${day + 1}/${repeatDays})` : `${title} (יום ${day + 1}/${repeatDays})`;
          }

          return {
            id: repeatDays > 1 ? `${taskId}-day${day + 1}-${Date.now()}` : taskId,
            title,
            description,
            type: preset?.type || 'task',
            status: 'pending',
            unlockDate: repeatDays > 1 ? dateStr : null,
            recurringDay: repeatDays > 1 ? day + 1 : null,
            recurringTotal: repeatDays > 1 ? repeatDays : null,
            recurringGroupId: repeatDays > 1 ? `${taskId}-group-${Date.now()}` : null,
            ...(taskId === 'no-phone-hour' && noPhoneConfirmed !== null ? { noPhoneHours: noPhoneConfirmed } : {}),
            ...(parentNote ? { parentNote } : {}),
            ...(refPhotoUrls.length ? { refPhotoUrls } : {}),
          };
        };

        return Array.from({ length: repeatDays }, (_, day) => buildInstance(day));
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

      // Build homework tasks
      const hwTasksFinal = homeworkWithUrls.map((hw) => ({
        id: hw._id,
        title: `📚 ${hw.title}`,
        description: hw.description || (language === 'en' ? 'Complete the attached homework' : 'בצע את שיעורי הבית המצורפים'),
        type: 'task',
        category: 'homework',
        status: 'pending',
        ...(hw.photoUrl ? { homeworkPhotoUrl: hw.photoUrl } : {}),
      }));

      // Build mini game tasks
      const GAME_NAMES: Record<string, string> = { math_blitz: '⚡ Math Blitz', memory_sequence: '🧠 Memory Sequence' };
      const miniGameTasks = miniGames.map((g, i) => ({
        id: `minigame-${g.gameType}-${i}-${Date.now()}`,
        title: language === 'en' ? `🎮 ${GAME_NAMES[g.gameType] || 'Mini Game'}` : `🎮 משחק — ${GAME_NAMES[g.gameType] || 'Mini Game'}`,
        description: language === 'en'
          ? `${g.difficulty.toUpperCase()} · Grade ${childGrade}`
          : `${g.difficulty === 'easy' ? 'קל' : g.difficulty === 'medium' ? 'בינוני' : 'קשה'} · כיתה ${childGrade}`,
        type: 'minigame',
        gameType: g.gameType,
        difficulty: g.difficulty,
        childGrade,
        status: 'pending',
      }));

      const allTasks = [...presetTasks, ...aiTasks, ...suggestionTasks, ...hwTasksFinal, ...miniGameTasks];

      if (existingPunishmentId) {
        // Add tasks to existing challenge
        await updateDoc(doc(db, 'punishments', existingPunishmentId), {
          tasks: arrayUnion(...allTasks),
          requiredTasksCount: increment(allTasks.length),
        });

        showAlert(t.setPunishment.successTitle, t.setPunishment.addTasksSuccessMsg.replace('{n}', String(allTasks.length)), [
          { text: t.common.ok, onPress: () => navigation.goBack() },
        ]);
      } else {
        // Create new challenge
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
      }
    } catch (error: any) {
      showAlert(t.common.error, error.message || t.setPunishment.errorNoTasks);
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const pickRefPhoto = async (taskId: string) => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ ...PICK_OPTS, allowsMultipleSelection: true });
    if (!result.canceled && result.assets.length > 0) {
      const newUris = result.assets.map((a) => a.uri);
      setTaskRefPhotos((prev) => {
        const existing = prev[taskId] || [];
        const combined = [...existing, ...newUris].slice(0, 4); // max 4 photos
        return { ...prev, [taskId]: combined };
      });
    }
  };

  const removeRefPhoto = (taskId: string, idx: number) => {
    setTaskRefPhotos((prev) => {
      const updated = (prev[taskId] || []).filter((_, i) => i !== idx);
      return { ...prev, [taskId]: updated };
    });
  };

  const uploadRefPhoto = (uri: string, taskId: string, idx: number) =>
    uploadPhoto(uri, `ref-${user!.uid}-${taskId}-${idx}-${Date.now()}.jpg`);

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

  const renderTaskCard = (task: any) => {
    const selected = selectedTasks.includes(task.id);
    const isExpanded = expandedTaskDetail === task.id;
    const note = taskNotes[task.id] || '';
    const refPhotos = taskRefPhotos[task.id] || [];
    const hasDetails = note.trim() || refPhotos.length > 0;

    return (
      <View key={task.id} style={styles.taskCardWrap}>
        <TouchableOpacity
          style={[styles.taskCard, selected && styles.taskCardSelected, isExpanded && styles.taskCardExpandedTop]}
          onPress={() => {
            if (!selected) { toggleTask(task.id); return; }
            setExpandedTaskDetail(isExpanded ? null : task.id);
          }}
        >
          <Text style={styles.taskCardIcon}>{task.icon}</Text>
          <Text style={[styles.taskCardTitle, selected && styles.taskCardTitleSelected]}>
            {language === 'en' ? task.titleEn : task.title}
          </Text>
          {selected && !isExpanded && (
            <Text style={[styles.taskDetailHint, hasDetails && { color: '#3498DB' }]}>
              {hasDetails ? `✏️ ${language === 'en' ? 'has details' : 'יש פרטים'}` : `✏️ ${language === 'en' ? 'add details' : 'הוסף פרטים'}`}
            </Text>
          )}
          {selected && <Text style={styles.taskCardCheck}>✓</Text>}
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.taskDetailPanel}>
            <Text style={styles.taskDetailPanelTitle}>
              {task.icon} {language === 'en' ? task.titleEn : task.title} — {language === 'en' ? 'Specific Instructions' : 'הוראות ספציפיות'}
            </Text>
            <TextInput
              style={styles.taskDetailNoteInput}
              placeholder={language === 'en' ? 'e.g. trash from all rooms including kitchen and bathroom...' : 'למשל: אשפה מכל החדרים כולל מטבח ואמבטיה...'}
              value={note}
              onChangeText={(v) => setTaskNotes((prev) => ({ ...prev, [task.id]: v }))}
              multiline
              numberOfLines={3}
              textAlign={isRTL ? 'right' : 'left'}
            />

            <Text style={styles.taskDetailPhotoLabel}>
              {language === 'en' ? '📸 Reference photos (optional, up to 4)' : '📸 תמונות עזר (אופציונלי, עד 4)'}
            </Text>
            <View style={styles.taskDetailPhotoRow}>
              {refPhotos.map((uri, idx) => (
                <View key={idx} style={styles.refPhotoWrap}>
                  <Image source={{ uri }} style={styles.refPhotoThumb} resizeMode="cover" />
                  <TouchableOpacity style={styles.refPhotoRemove} onPress={() => removeRefPhoto(task.id, idx)}>
                    <Text style={styles.refPhotoRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {refPhotos.length < 4 && (
                <TouchableOpacity style={styles.refPhotoAdd} onPress={() => pickRefPhoto(task.id)}>
                  <Text style={styles.refPhotoAddIcon}>+</Text>
                  <Text style={styles.refPhotoAddText}>{language === 'en' ? 'Photo' : 'תמונה'}</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.taskDetailPhotoLabel}>
              🔁 {language === 'en' ? 'Repeat daily for:' : 'חזור יום יום עבור:'}
            </Text>
            <View style={styles.pillRow}>
              {[1, 3, 5, 7, 14, 30].map((days) => (
                <TouchableOpacity
                  key={days}
                  style={[styles.pill, (taskRepeats[task.id] || 1) === days && styles.noPhonePillSelected]}
                  onPress={() => setTaskRepeats((prev) => ({ ...prev, [task.id]: days }))}
                >
                  <Text style={[styles.pillText, (taskRepeats[task.id] || 1) === days && styles.pillTextSelected]}>
                    {days === 1 ? (language === 'en' ? 'Once' : 'פעם אחת') : language === 'en' ? `${days}d` : `${days} ימים`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.taskDetailDone} onPress={() => setExpandedTaskDetail(null)}>
              <Text style={styles.taskDetailDoneText}>✓ {language === 'en' ? 'Done' : 'שמור'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const choreTasks = taskPresets.filter((t) => t.category === 'chores');
  const behaviorTasks = taskPresets.filter((t) => t.category === 'behavior');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{t.setPunishment.title}</Text>

      {/* Punishment name — hidden when adding to existing challenge */}
      {!existingPunishmentId && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.setPunishment.punishmentName}</Text>
          <TextInput
            style={styles.input}
            placeholder={t.setPunishment.namePlaceholder}
            value={punishmentName}
            onChangeText={(text) => {
              setPunishmentName(text);
              setNameEditedByUser(text.length > 0);
            }}
            textAlign={isRTL ? 'right' : 'left'}
          />
        </View>
      )}

      {/* Summary badge */}
      {totalCount > 0 && (
        <View style={styles.summaryBadge}>
          <Text style={styles.summaryText}>{t.setPunishment.selectedCount.replace('{n}', String(totalCount))}</Text>
        </View>
      )}

      {/* Custom task */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.setPunishment.customTask}</Text>
        {Platform.OS === 'web' && (
          <input
            ref={customCameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={(e: any) => {
              const file = e.target.files?.[0];
              if (file) { setCustomTaskPhotoUri(URL.createObjectURL(file)); e.target.value = ''; }
            }}
          />
        )}
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
        <View style={styles.customPhotoRow}>
          <TouchableOpacity style={styles.customPhotoBtn} onPress={takeCustomTaskPhoto}>
            <Text style={styles.customPhotoBtnText}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.customPhotoBtn} onPress={pickCustomTaskPhoto}>
            <Text style={styles.customPhotoBtnText}>🖼️</Text>
          </TouchableOpacity>
          {customTaskPhotoUri && (
            <View style={styles.customPhotoPreview}>
              <Image source={{ uri: customTaskPhotoUri }} style={styles.customPhotoThumb} resizeMode="cover" />
              <TouchableOpacity onPress={() => setCustomTaskPhotoUri(null)} style={styles.customPhotoRemove}>
                <Text style={styles.customPhotoRemoveText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {selectedTasks.filter((id) => id.startsWith('custom-')).map((id) => (
          <View key={id} style={styles.customChip}>
            <TouchableOpacity onPress={() => toggleTask(id)}>
              <Text style={styles.customChipRemove}>✕</Text>
            </TouchableOpacity>
            {customTaskPhotos[id] && (
              <Image source={{ uri: customTaskPhotos[id] }} style={styles.customChipThumb} resizeMode="cover" />
            )}
            <Text style={styles.customChipText}>{id.split('-').slice(2).join('-')}</Text>
          </View>
        ))}
      </View>

      {/* Chores */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>{t.setPunishment.chores}</Text>
        <View style={styles.taskGrid}>
          {choreTasks.map((task) => renderTaskCard(task))}
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

            return renderTaskCard(task);
          })}
        </View>
      </View>

      {/* Homework */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          📚 {language === 'en' ? 'Homework Assignment' : 'שיעורי בית'}
        </Text>
        <Text style={[styles.sectionHint, { textAlign: isRTL ? 'right' : 'left' }]}>
          {language === 'en' ? 'Add a homework task — optionally attach a photo of the assignment sheet' : 'הוסף שיעור בית — אפשר לצרף תמונה של הדף'}
        </Text>

        <View style={styles.hwInputGroup}>
          <TextInput
            style={styles.hwTitleInput}
            placeholder={language === 'en' ? 'Homework title (e.g. Math p.42)' : 'שם השיעור (למשל: מתמטיקה עמ׳ 42)'}
            value={hwTitle}
            onChangeText={setHwTitle}
            textAlign={isRTL ? 'right' : 'left'}
          />
          <TextInput
            style={styles.hwDescInput}
            placeholder={language === 'en' ? 'Instructions (optional)' : 'הוראות (אופציונלי)'}
            value={hwDesc}
            onChangeText={setHwDesc}
            multiline
            numberOfLines={2}
            textAlign={isRTL ? 'right' : 'left'}
          />

          <View style={styles.hwPhotoRow}>
            {hwPhotoUri ? (
              <View style={styles.hwPhotoPreview}>
                <Image source={{ uri: hwPhotoUri }} style={styles.hwPhotoThumb} resizeMode="cover" />
                <TouchableOpacity onPress={() => setHwPhotoUri(null)} style={styles.hwPhotoRemove}>
                  <Text style={styles.hwPhotoRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.hwPhotoBtn} onPress={pickHwPhoto}>
                <Text style={styles.hwPhotoBtnText}>📎 {language === 'en' ? 'Attach homework photo' : 'צרף תמונה של הדף'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.hwAddBtn, !hwTitle.trim() && styles.hwAddBtnDisabled]}
              onPress={addHomeworkTask}
              disabled={!hwTitle.trim()}
            >
              <Text style={styles.hwAddBtnText}>➕ {language === 'en' ? 'Add' : 'הוסף'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {homeworkTasks.map((hw) => (
          <View key={hw._id} style={styles.hwChip}>
            <TouchableOpacity onPress={() => removeHomeworkTask(hw._id)} style={styles.hwChipRemove}>
              <Text style={styles.hwChipRemoveText}>✕</Text>
            </TouchableOpacity>
            {hw.photoUri && <Image source={{ uri: hw.photoUri }} style={styles.hwChipThumb} resizeMode="cover" />}
            <View style={styles.hwChipText}>
              <Text style={styles.hwChipTitle}>📚 {hw.title}</Text>
              {hw.description ? <Text style={styles.hwChipDesc} numberOfLines={1}>{hw.description}</Text> : null}
            </View>
          </View>
        ))}
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

      {/* Mini Games */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: isRTL ? 'right' : 'left' }]}>🎮 {language === 'en' ? 'Arcade Brain Games' : 'משחקי מוח'}</Text>
        <Text style={[styles.sectionHint, { textAlign: isRTL ? 'right' : 'left' }]}>
          {language === 'en' ? 'Timed challenges adapted to your child\'s grade level' : 'אתגרים מתוזמנים מותאמים לכיתת הילד'}
        </Text>
        {[
          { gameType: 'math_blitz', label: language === 'en' ? '⚡ Math Blitz' : '⚡ בליץ מתמטיקה', desc: language === 'en' ? '10 problems · 45 sec' : '10 שאלות · 45 שניות', color: '#E74C3C' },
          { gameType: 'memory_sequence', label: language === 'en' ? '🧠 Memory Sequence' : '🧠 רצף זיכרון', desc: language === 'en' ? 'Simon Says style' : 'סיימון אומר', color: '#8E54E9' },
        ].map((game) => {
          const difficulties = ['easy', 'medium', 'hard'];
          const added = miniGames.filter((g) => g.gameType === game.gameType);
          return (
            <View key={game.gameType} style={[styles.miniGameCard, { borderLeftColor: game.color }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={styles.miniGameTitle}>{game.label}</Text>
                <Text style={styles.miniGameDesc}>{game.desc}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {difficulties.map((d) => {
                  const isAdded = added.some((g) => g.difficulty === d);
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.diffChip, isAdded && { backgroundColor: game.color }]}
                      onPress={() => {
                        if (isAdded) {
                          setMiniGames((prev) => prev.filter((g) => !(g.gameType === game.gameType && g.difficulty === d)));
                        } else {
                          setMiniGames((prev) => [...prev, { gameType: game.gameType, difficulty: d }]);
                        }
                      }}
                    >
                      <Text style={[styles.diffChipText, isAdded && { color: '#FFFFFF' }]}>
                        {isAdded ? '✓ ' : ''}{d === 'easy' ? (language === 'en' ? 'Easy' : 'קל') : d === 'medium' ? (language === 'en' ? 'Medium' : 'בינוני') : (language === 'en' ? 'Hard' : 'קשה')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
        {miniGames.length > 0 && (
          <Text style={styles.miniGameCount}>✅ {miniGames.length} {language === 'en' ? 'game(s) added' : 'משחקים נוספו'}</Text>
        )}
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
            <Text style={styles.loadingText}>{loadingMsg || (existingPunishmentId ? t.setPunishment.adding : t.setPunishment.creating)}</Text>
          </View>
        ) : (
          <Text style={styles.createButtonText}>
            {existingPunishmentId
              ? t.setPunishment.addTasksBtn.replace('{n}', String(totalCount))
              : t.setPunishment.createBtn.replace('{n}', String(totalCount))}
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
  miniGameCard: { backgroundColor: '#FAFAFA', borderRadius: 12, padding: 14, marginBottom: 10, borderLeftWidth: 4 },
  miniGameTitle: { fontSize: 16, fontWeight: 'bold', color: '#2C3E50' },
  miniGameDesc: { fontSize: 12, color: '#7F8C8D' },
  diffChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#ECF0F1', borderWidth: 1, borderColor: '#BDC3C7' },
  diffChipText: { fontSize: 13, fontWeight: '600', color: '#2C3E50' },
  miniGameCount: { fontSize: 13, color: '#27AE60', fontWeight: 'bold', textAlign: 'center', marginTop: 8 },
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
  taskDetailHint: { fontSize: 10, color: '#95A5A6', marginTop: 3 },
  taskCardWrap: { width: '47%' },
  taskCardExpandedTop: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  taskDetailPanel: {
    backgroundColor: '#FAFAFA', borderWidth: 2, borderTopWidth: 0, borderColor: '#27AE60',
    borderBottomLeftRadius: 12, borderBottomRightRadius: 12, padding: 12, marginBottom: 4,
  },
  taskDetailPanelTitle: { fontSize: 13, fontWeight: 'bold', color: '#2C3E50', marginBottom: 8, textAlign: 'center' },
  taskDetailNoteInput: {
    backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8,
    padding: 8, fontSize: 13, minHeight: 72, marginBottom: 10, textAlignVertical: 'top',
  },
  taskDetailPhotoLabel: { fontSize: 12, fontWeight: '600', color: '#2C3E50', marginBottom: 6 },
  taskDetailPhotoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  refPhotoWrap: { position: 'relative' },
  refPhotoThumb: { width: 56, height: 56, borderRadius: 8 },
  refPhotoRemove: { position: 'absolute', top: 2, right: 2, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  refPhotoRemoveText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  refPhotoAdd: { width: 56, height: 56, borderRadius: 8, borderWidth: 1, borderColor: '#BDC3C7', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  refPhotoAddIcon: { fontSize: 20, color: '#7F8C8D' },
  refPhotoAddText: { fontSize: 9, color: '#7F8C8D' },
  taskDetailDone: { backgroundColor: '#27AE60', borderRadius: 8, padding: 8, alignItems: 'center' },
  taskDetailDoneText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

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
  customPhotoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  customPhotoBtn: { backgroundColor: '#F0F2FF', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#4776E6' },
  customPhotoBtnText: { fontSize: 18 },
  customPhotoPreview: { position: 'relative' },
  customPhotoThumb: { width: 48, height: 48, borderRadius: 8 },
  customPhotoRemove: { position: 'absolute', top: -4, right: -4, backgroundColor: '#E74C3C', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  customPhotoRemoveText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  addButton: { backgroundColor: '#3498DB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14 },
  addButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  customChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F8F5', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8, gap: 8, borderWidth: 1, borderColor: '#27AE60' },
  customChipText: { flex: 1, color: '#2C3E50', fontSize: 14, textAlign: 'right' },
  customChipRemove: { color: '#E74C3C', fontWeight: 'bold', fontSize: 16 },
  customChipThumb: { width: 32, height: 32, borderRadius: 6 },

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

  // Homework
  hwInputGroup: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E0E0E0', marginBottom: 10 },
  hwTitleInput: { fontSize: 15, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 10, marginBottom: 8, backgroundColor: '#F8F9FA' },
  hwDescInput: { fontSize: 14, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 10, marginBottom: 10, backgroundColor: '#F8F9FA', minHeight: 56 },
  hwPhotoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hwPhotoBtn: { flex: 1, borderWidth: 1, borderColor: '#3498DB', borderRadius: 10, padding: 10, alignItems: 'center' },
  hwPhotoBtnText: { color: '#3498DB', fontSize: 13, fontWeight: '600' },
  hwPhotoPreview: { flex: 1, position: 'relative' },
  hwPhotoThumb: { width: '100%', height: 60, borderRadius: 8 },
  hwPhotoRemove: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 10, width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  hwPhotoRemoveText: { color: '#FFF', fontSize: 11, fontWeight: 'bold' },
  hwAddBtn: { backgroundColor: '#27AE60', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  hwAddBtnDisabled: { backgroundColor: '#BDC3C7' },
  hwAddBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },
  hwChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF8FF', borderRadius: 12, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#3498DB', gap: 8 },
  hwChipRemove: { padding: 4 },
  hwChipRemoveText: { color: '#E74C3C', fontWeight: 'bold', fontSize: 14 },
  hwChipThumb: { width: 44, height: 44, borderRadius: 6 },
  hwChipText: { flex: 1 },
  hwChipTitle: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50' },
  hwChipDesc: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
});
