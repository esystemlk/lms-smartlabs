import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc,
  addDoc,
  serverTimestamp
} from "firebase/firestore";
import { Quiz, QuizAttempt } from "@/lib/types";

export const quizService = {
  async getQuizzesByCourse(courseId: string): Promise<Quiz[]> {
    const q = query(
      collection(db, "quizzes"),
      where("courseId", "==", courseId),
      where("published", "==", true)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
  },

  async getQuiz(quizId: string): Promise<Quiz | null> {
    const ref = doc(db, "quizzes", quizId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Quiz;
    }
    return null;
  },

  async submitAttempt(attempt: Omit<QuizAttempt, "id" | "completedAt">) {
    const collectionRef = collection(db, "quiz_attempts");
    
    return addDoc(collectionRef, {
      ...attempt,
      completedAt: serverTimestamp()
    });
  },

  async createQuiz(quizData: Partial<Quiz>) {
    const collectionRef = collection(db, "quizzes");
    return addDoc(collectionRef, {
      ...quizData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  },

  async updateQuiz(quizId: string, quizData: Partial<Quiz>) {
    const docRef = doc(db, "quizzes", quizId);
    await import("firebase/firestore").then(({ updateDoc }) => 
      updateDoc(docRef, {
        ...quizData,
        updatedAt: serverTimestamp()
      })
    );
  }
};
