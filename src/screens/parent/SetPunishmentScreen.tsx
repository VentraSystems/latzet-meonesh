import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { taskPresets, quizPresets } from '../../data/taskPresets';

export default function SetPunishmentScreen({ navigation }: any) {
  const [punishmentName, setPunishmentName] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [customTask, setCustomTask] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, linkedUserId } = useAuth();

  const toggleTask = (taskId: string) => {
    if (selectedTasks.includes(taskId)) {
      setSelectedTasks(selectedTasks.filter((id) => id !== taskId));
    } else {
      setSelectedTasks([...selectedTasks, taskId]);
    }
  };

  const addCustomTask = () => {
    if (customTask.trim()) {
      setSelectedTasks([...selectedTasks, `custom-${Date.now()}-${customTask}`]);
      setCustomTask('');
    }
  };

  const createPunishment = async () => {
    if (!punishmentName.trim()) {
      Alert.alert('שגיאה', 'נא להזין שם לעונש');
      return;
    }

    if (selectedTasks.length === 0) {
      Alert.alert('שגיאה', 'נא לבחור לפחות משימה אחת');
      return;
    }

    if (!linkedUserId) {
      Alert.alert('שגיאה', 'לא מחובר לילד. נא לחבר ילד תחילה');
      return;
    }

    setLoading(true);
    try {
      // Create tasks
      const tasks = selectedTasks.map((taskId) => {
        const preset = taskPresets.find((t) => t.id === taskId);
        const quiz = quizPresets.find((q) => q.id === taskId);

        if (preset) {
          return {
            id: taskId,
            title: preset.title,
            description: preset.description,
            type: preset.type,
            status: 'pending',
          };
        } else if (quiz) {
          return {
            id: taskId,
            title: quiz.title,
            description: `חידון ${quiz.subject}`,
            type: 'quiz',
            status: 'pending',
            quizData: quiz,
          };
        } else {
          // Custom task
          const customTitle = taskId.split('-').slice(2).join('-');
          return {
            id: taskId,
            title: customTitle,
            description: 'משימה מותאמת אישית',
            type: 'task',
            status: 'pending',
          };
        }
      });

      // Create punishment document
      await addDoc(collection(db, 'punishments'), {
        name: punishmentName,
        parentId: user!.uid,
        childId: linkedUserId,
        tasks,
        status: 'active',
        createdAt: new Date(),
        requiredTasksCount: tasks.length,
      });

      Alert.alert('הצלחה! 🎉', 'העונש נוצר והילד יקבל התראה', [
        { text: 'אישור', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('שגיאה', 'לא הצלחנו ליצור את העונש');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>הגדר עונש חדש</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>שם העונש</Text>
        <TextInput
          style={styles.input}
          placeholder='למשל: "אין טלפון לשעתיים"'
          value={punishmentName}
          onChangeText={setPunishmentName}
          textAlign="right"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          בחר משימות ({selectedTasks.length} נבחרו)
        </Text>

        <Text style={styles.categoryTitle}>🏠 עבודות בית</Text>
        {taskPresets
          .filter((t) => t.category === 'chores')
          .map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.taskItem,
                selectedTasks.includes(task.id) && styles.taskSelected,
              ]}
              onPress={() => toggleTask(task.id)}
            >
              <Text style={styles.taskIcon}>{task.icon}</Text>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDescription}>{task.description}</Text>
              </View>
              {selectedTasks.includes(task.id) && (
                <Text style={styles.checkMark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}

        <Text style={styles.categoryTitle}>📚 שיעורי בית</Text>
        {taskPresets
          .filter((t) => t.category === 'homework')
          .map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.taskItem,
                selectedTasks.includes(task.id) && styles.taskSelected,
              ]}
              onPress={() => toggleTask(task.id)}
            >
              <Text style={styles.taskIcon}>{task.icon}</Text>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDescription}>{task.description}</Text>
              </View>
              {selectedTasks.includes(task.id) && (
                <Text style={styles.checkMark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}

        <Text style={styles.categoryTitle}>🎓 חידונים לימודיים</Text>
        <Text style={styles.quizInfo}>הילד ילמד תוך כדי יציאה מהעונש!</Text>
        {quizPresets.map((quiz) => (
          <TouchableOpacity
            key={quiz.id}
            style={[
              styles.taskItem,
              styles.quizItem,
              selectedTasks.includes(quiz.id) && styles.taskSelected,
            ]}
            onPress={() => toggleTask(quiz.id)}
          >
            <Text style={styles.taskIcon}>🧠</Text>
            <View style={styles.taskInfo}>
              <Text style={styles.taskTitle}>{quiz.title}</Text>
              <Text style={styles.taskDescription}>
                {quiz.questions.length} שאלות • {quiz.difficulty === 'easy' ? 'קל' : quiz.difficulty === 'medium' ? 'בינוני' : 'מתקדם'}
              </Text>
            </View>
            {selectedTasks.includes(quiz.id) && (
              <Text style={styles.checkMark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}

        <Text style={styles.categoryTitle}>✏️ משימה מותאמת אישית</Text>
        <View style={styles.customTaskContainer}>
          <TextInput
            style={styles.customInput}
            placeholder="כתוב משימה מותאמת אישית..."
            value={customTask}
            onChangeText={setCustomTask}
            textAlign="right"
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={addCustomTask}
          >
            <Text style={styles.addButtonText}>הוסף +</Text>
          </TouchableOpacity>
        </View>

        {selectedTasks
          .filter((id) => id.startsWith('custom-'))
          .map((id) => (
            <View key={id} style={[styles.taskItem, styles.taskSelected]}>
              <Text style={styles.taskIcon}>✏️</Text>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>
                  {id.split('-').slice(2).join('-')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => toggleTask(id)}>
                <Text style={styles.removeButton}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
      </View>

      <TouchableOpacity
        style={styles.createButton}
        onPress={createPunishment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.createButtonText}>צור עונש ושלח לילד</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.cancelButtonText}>ביטול</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'right',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3498DB',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'right',
  },
  quizInfo: {
    fontSize: 14,
    color: '#27AE60',
    marginBottom: 12,
    textAlign: 'right',
    fontStyle: 'italic',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quizItem: {
    backgroundColor: '#FFF9E6',
  },
  taskSelected: {
    borderColor: '#27AE60',
    backgroundColor: '#E8F8F5',
  },
  taskIcon: {
    fontSize: 30,
    marginLeft: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'right',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'right',
  },
  checkMark: {
    fontSize: 24,
    color: '#27AE60',
    fontWeight: 'bold',
  },
  customTaskContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginLeft: 10,
  },
  addButton: {
    backgroundColor: '#3498DB',
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  removeButton: {
    fontSize: 24,
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#27AE60',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  cancelButtonText: {
    color: '#7F8C8D',
    fontSize: 16,
  },
});
