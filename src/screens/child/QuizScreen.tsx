import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { QuizQuestion } from '../../data/taskPresets';

interface Props {
  route: any;
  navigation: any;
}

export default function QuizScreen({ route, navigation }: Props) {
  const { quiz, punishmentId, taskId } = route.params;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const questions: QuizQuestion[] = quiz.questions;

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 500);
    } else {
      // Show results
      setTimeout(() => calculateResults(), 500);
    }
  };

  const calculateResults = () => {
    let correct = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });

    const percentage = (correct / questions.length) * 100;
    const passed = percentage >= 60; // Need 60% to pass

    setShowResults(true);

    if (passed) {
      // Update task as completed
      Alert.alert(
        'כל הכבוד! 🎉',
        `עברת את החידון!\nצברת ${correct} מתוך ${questions.length} נכון (${Math.round(percentage)}%)`,
        [
          {
            text: 'אישור',
            onPress: async () => {
              // Mark task as submitted
              // This would be handled by Firebase in a real app
              navigation.goBack();
            },
          },
        ]
      );
    } else {
      Alert.alert(
        'כמעט! 💪',
        `קיבלת ${correct} מתוך ${questions.length} נכון (${Math.round(percentage)}%)\nצריך לפחות 60% כדי לעבור.\nנסה שוב!`,
        [
          {
            text: 'נסה שוב',
            onPress: () => {
              setCurrentQuestion(0);
              setSelectedAnswers([]);
              setShowResults(false);
            },
          },
        ]
      );
    }
  };

  if (showResults) {
    const correct = selectedAnswers.filter(
      (answer, index) => answer === questions[index].correctAnswer
    ).length;
    const percentage = (correct / questions.length) * 100;

    return (
      <View style={styles.container}>
        <ScrollView>
          <Text style={styles.title}>תוצאות החידון</Text>

          {questions.map((q, index) => {
            const isCorrect = selectedAnswers[index] === q.correctAnswer;
            return (
              <View key={index} style={styles.resultItem}>
                <Text style={styles.questionNumber}>שאלה {index + 1}</Text>
                <Text style={styles.questionText}>{q.question}</Text>
                <Text
                  style={[
                    styles.answerText,
                    isCorrect ? styles.correctAnswer : styles.wrongAnswer,
                  ]}
                >
                  {isCorrect ? '✓' : '✗'} התשובה שלך: {q.options[selectedAnswers[index]]}
                </Text>
                {!isCorrect && (
                  <Text style={styles.correctAnswerText}>
                    תשובה נכונה: {q.options[q.correctAnswer]}
                  </Text>
                )}
              </View>
            );
          })}

          <View style={styles.scoreCard}>
            <Text style={styles.scoreText}>
              {correct} / {questions.length}
            </Text>
            <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
          </View>
        </ScrollView>
      </View>
    );
  }

  const question = questions[currentQuestion];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.questionCounter}>
          שאלה {currentQuestion + 1} מתוך {questions.length}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progress,
              { width: `${((currentQuestion + 1) / questions.length) * 100}%` },
            ]}
          />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.question}>{question.question}</Text>

        {question.options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedAnswers[currentQuestion] === index && styles.selectedOption,
            ]}
            onPress={() => handleAnswer(index)}
          >
            <Text style={styles.optionText}>{option}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    backgroundColor: '#E74C3C',
    padding: 20,
    paddingTop: 50,
  },
  questionCounter: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#FFFFFF30',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  question: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'right',
    marginBottom: 30,
    lineHeight: 32,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  selectedOption: {
    borderColor: '#E74C3C',
    backgroundColor: '#FFE5E5',
  },
  optionText: {
    fontSize: 18,
    color: '#2C3E50',
    textAlign: 'right',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  resultItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  questionNumber: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
    textAlign: 'right',
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'right',
  },
  answerText: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'right',
  },
  correctAnswer: {
    color: '#27AE60',
  },
  wrongAnswer: {
    color: '#E74C3C',
  },
  correctAnswerText: {
    fontSize: 14,
    color: '#3498DB',
    textAlign: 'right',
  },
  scoreCard: {
    backgroundColor: '#3498DB',
    borderRadius: 15,
    padding: 30,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  scoreText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  percentageText: {
    fontSize: 32,
    color: '#FFFFFF',
  },
});
