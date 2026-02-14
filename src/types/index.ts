export type UserRole = 'parent' | 'child';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email?: string;
  linkedUserId?: string; // For parent-child linking
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  type: 'custom' | 'clean-room' | 'homework' | 'quiz';
  submittedAt?: Date;
  approvedAt?: Date;
  rejectedReason?: string;
  childNote?: string;
}

export interface Punishment {
  id: string;
  name: string;
  parentId: string;
  childId: string;
  tasks: Task[];
  status: 'active' | 'completed';
  createdAt: Date;
  completedAt?: Date;
  requiredTasksCount: number;
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
  score?: number;
  submittedAt?: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  selectedAnswer?: number;
}
