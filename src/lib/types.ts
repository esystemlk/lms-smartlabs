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
  enrolledCourses?: string[]; // List of course IDs
  favorites?: string[]; // List of favorite course IDs
  preferences?: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    marketingEmails?: boolean;
    darkMode?: boolean;
    compactMode?: boolean;
    customTheme?: {
      primary: string;
      background: string;
      foreground: string;
      card: string;
      sidebar: string;
    };
  };
  [key: string]: any;
}

export interface Note {
  id?: string;
  userId: string;
  lessonId: string;
  courseId: string;
  content: string;
  createdAt: any;
  updatedAt: any;
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
  price?: number; // Deprecated: Use priceLKR instead
  priceLKR?: number;
  priceUSD?: number;
  published: boolean;
  enrollmentStatus?: 'open' | 'closed'; // New: Control enrollment availability
  lessonsCount: number;

  // Advanced Options
  level?: "Beginner" | "Intermediate" | "Advanced";
  category?: string;
  tags?: string[];
  prerequisites?: string[];
  learningOutcomes?: string[];
  includesCertificate?: boolean;

  // New: Resource Access
  resourceAvailabilityMonths?: number; // Duration in months (e.g., 3)
  endDate?: string; // ISO Date string (YYYY-MM-DD) for fixed course end date

  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface Assignment {
  id: string;
  courseId: string;
  batchId?: string; // Optional: assign to specific batch
  title: string;
  description: string;
  dueDate: any; // Firestore Timestamp
  points: number;
  attachments?: { name: string; url: string }[];
  createdAt: any;
  updatedAt: any;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content?: string; // Text submission
  attachments?: { name: string; url: string }[]; // File submission
  submittedAt: any;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'late';
}

export interface Resource {
  id: string;
  courseId: string;
  folderId?: string; // Optional: if null/undefined, it's in root
  title: string;
  description?: string;
  type: 'pdf' | 'video' | 'audio' | 'image' | 'archive' | 'other';
  url: string;
  createdAt: any;
}

export interface ResourceFolder {
  id: string;
  courseId: string;
  parentId?: string; // For nested folders
  name: string;
  createdAt: any;
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
  type?: 'video' | 'quiz' | 'speaking' | 'writing' | 'reading' | 'listening' | 'live_class';

  // Zoom / Live Class fields
  zoomMeetingId?: string;
  zoomStartUrl?: string;
  zoomJoinUrl?: string;
  zoomPassword?: string;
  startTime?: string; // ISO string
  duration?: number; // minutes
  batchIds?: string[]; // IDs of batches this live class is scheduled for
  status?: 'scheduled' | 'completed' | 'cancelled';
  
  // Bunny.net / Recording fields
  bunnyVideoId?: string;
  recordingStatus?: 'processing' | 'processed' | 'failed';
  recordingUrl?: string;
}

export interface RecordedClass {
  id: string;
  title: string;
  videoUrl: string;
  date: string; // ISO date
  durationMinutes?: number;
}

export interface CommunityMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderPhotoURL?: string;
  type: 'text' | 'voice' | 'image' | 'link';
  mediaUrl?: string; // For voice/image
  metadata?: {
    title?: string;
    description?: string;
    thumbnail?: string;
  };
  createdAt: any; // Firestore Timestamp
  replyTo?: string; // ID of message being replied to
  replyToId?: string; // Explicit ID of the message being replied to
  replyToName?: string; // Name of the user being replied to
  replyToContent?: string; // Snippet of the content being replied to
  isEdited?: boolean;
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

  status: 'pending' | 'active' | 'rejected' | 'expired' | 'completed' | 'pending_payment';
  paymentMethod: 'card' | 'transfer' | 'admin' | 'payhere';
  paymentProofUrl?: string; // For bank transfers
  amount: number;

  validUntil: any; // Firestore Timestamp
  enrolledAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
  
  // Progress Tracking
  progress?: number; // 0-100 percentage
  completedLessonIds?: string[]; // IDs of completed lessons
  lastAccessed?: any; // Firestore Timestamp
}

export interface Question {
  id: string;
  text: string;
  type: "multiple-choice" | "true-false" | "short-answer";
  options?: string[]; // For multiple choice
  correctAnswer: string | number;
  points: number;
}

export interface AttendanceRecord {
  id?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  courseId: string;
  batchId?: string; // Optional, as some courses might not have batches
  lessonId?: string; // Optional, linked to a specific live class or lesson
  date: any; // Firestore Timestamp
  status: 'present' | 'absent' | 'late' | 'excused';
  method: 'zoom_auto' | 'manual' | 'qr';
  recordedBy?: string; // Admin ID if manual
  recordedAt: any; // Firestore Timestamp
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

export interface ActivityLog {
  id: string;
  action: string; // e.g., "created_course", "deleted_user"
  details: string; // Human readable details
  entityId?: string; // ID of the object affected
  entityType?: "course" | "user" | "enrollment" | "system" | "batch";
  performedBy: string; // User ID
  performedByName: string; // User Name
  performedByRole: UserRole;
  createdAt: any; // Timestamp
  metadata?: any; // JSON object for extra data
}

export interface SystemSettings {
  id: string; // usually 'global'
  siteName: string;
  maintenanceMode: boolean;
  announcement?: string;
  supportEmail?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branch: string;
  };
  developerEmails?: string[]; // List of emails authorized as developers
  features?: {
    enableDebugMode?: boolean;
    enableBetaFeatures?: boolean;
    enableNewDashboard?: boolean;
    [key: string]: boolean | undefined;
  };
  updatedAt: any;
  updatedBy?: string;
}
