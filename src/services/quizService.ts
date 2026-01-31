import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Quiz, QuizAttempt } from "@/lib/types";

const QUIZZES_COLLECTION = "quizzes";
const ATTEMPTS_COLLECTION = "quiz_attempts";

export const quizService = {
  // Quiz Operations
  async getQuizzesByCourse(courseId: string) {
    const q = query(
      collection(db, QUIZZES_COLLECTION), 
      where("courseId", "==", courseId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
  },

  async getQuiz(quizId: string) {
    const docRef = doc(db, QUIZZES_COLLECTION, quizId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Quiz;
    }
    return null;
  },

  async createQuiz(quizData: Partial<Quiz>) {
    const docRef = await addDoc(collection(db, QUIZZES_COLLECTION), {
      ...quizData,
      questions: quizData.questions || [],
      published: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateQuiz(quizId: string, quizData: Partial<Quiz>) {
    const docRef = doc(db, QUIZZES_COLLECTION, quizId);
    await updateDoc(docRef, {
      ...quizData,
      updatedAt: serverTimestamp()
    });
  },

  async deleteQuiz(quizId: string) {
    const docRef = doc(db, QUIZZES_COLLECTION, quizId);
    await deleteDoc(docRef);
  },

  // Attempt Operations
  async submitAttempt(attemptData: Partial<QuizAttempt>) {
    const docRef = await addDoc(collection(db, ATTEMPTS_COLLECTION), {
      ...attemptData,
      completedAt: serverTimestamp()
    });
    return docRef.id;
  },

  async getUserAttempts(userId: string, quizId: string) {
    const q = query(
      collection(db, ATTEMPTS_COLLECTION),
      where("userId", "==", userId),
      where("quizId", "==", quizId),
      orderBy("completedAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuizAttempt));
  }
};
