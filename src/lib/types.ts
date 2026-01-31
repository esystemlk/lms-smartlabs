import { Timestamp } from "firebase/firestore";

export type UserRole = "student" | "admin" | "instructor" | "lecturer" | "developer" | "superadmin" | "service";

export interface UserData {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: any;
  contact?: string;
  country?: string;
  gender?: "male" | "female";
  bio?: string;
  photoURL?: string;
  enrolledBatches?: string[]; // List of batch IDs the user is enrolled in
  preferences?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    marketingEmails?: boolean;
    darkMode?: boolean;
    compactMode?: boolean;
  };
  [key: string]: any;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  lecturerId?: string;
  lecturerName?: string;
  image?: string;
  price?: number;
  published: boolean;
  lessonsCount: number;
  
  // Advanced Options
  level?: "Beginner" | "Intermediate" | "Advanced";
  category?: string;
  tags?: string[];
  prerequisites?: string[];
  includesCertificate?: boolean;
  
  // New: Resource Access
  resourceAvailabilityMonths?: number; // Duration in months (e.g., 3)
  
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content: string; // HTML/Markdown
  videoUrl?: string; // Main lesson video
  attachments?: { name: string; url: string }[];
  durationMinutes: number;
  order: number;
  isFree?: boolean; // For preview
  published: boolean;
  createdAt: any;
  updatedAt: any;
  type?: 'video' | 'quiz' | 'speaking' | 'writing' | 'reading' | 'listening';
}

export interface RecordedClass {
  id: string;
  title: string;
  videoUrl: string;
  date: string; // ISO date
  durationMinutes?: number;
}

export interface Batch {
  id: string;
  courseId: string;
  name: string; // e.g. "January 2026 Intake"
  startDate: string; // ISO date string
  endDate?: string;
  maxStudents?: number;
  enrolledCount: number;
  status: 'open' | 'closed' | 'ongoing' | 'completed';
  schedule?: string; // e.g. "Mon/Wed 10:00 AM"
  image?: string; // URL to batch specific image
  
  // New: Batch specific content
  recordedClasses?: RecordedClass[];
  
  createdAt: any;
  updatedAt: any;
}

export interface Enrollment {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  batchId: string;
  batchName: string;
  
  status: 'pending' | 'active' | 'rejected' | 'expired';
  paymentMethod: 'card' | 'transfer';
  paymentProofUrl?: string; // For bank transfers
  amount: number;
  
  validUntil: any; // Firestore Timestamp
  enrolledAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface Question {
  id: string;
  text: string;
  type: "multiple-choice" | "true-false" | "short-answer";
  options?: string[]; // For multiple choice
  correctAnswer: string | number;
  points: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  lessonId?: string; // Optional: can be tied to a specific lesson
  title: string;
  description?: string;
  questions: Question[];
  durationMinutes: number; // 0 for unlimited
  passingScore: number; // Percentage
  published: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, string>; // questionId -> answer
  score: number;
  passed: boolean;
  completedAt: any;
}

export interface SupportChat {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  userRole?: string;
  status: "active" | "pending" | "closed";
  unreadByAdmin: number;
  unreadByUser: number;
  lastMessage?: string;
  lastMessageAt: any;
  createdAt: any;
  updatedAt: any;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  type: "text" | "voice" | "image" | "file" | "link";
  mediaUrl?: string;
  createdAt: any;
  readBy?: string[];
}
