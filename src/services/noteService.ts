import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp, 
  collection 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Note } from "@/lib/types";

export const noteService = {
  async saveNote(userId: string, courseId: string, lessonId: string, content: string) {
    const noteRef = doc(db, "users", userId, "notes", lessonId);
    
    // Check if note exists to preserve createdAt
    const noteSnap = await getDoc(noteRef);
    const exists = noteSnap.exists();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      userId,
      courseId,
      lessonId,
      content,
      updatedAt: serverTimestamp()
    };

    if (!exists) {
      data.createdAt = serverTimestamp();
    }

    await setDoc(noteRef, data, { merge: true });
  },

  async getNote(userId: string, lessonId: string): Promise<Note | null> {
    const noteRef = doc(db, "users", userId, "notes", lessonId);
    const noteSnap = await getDoc(noteRef);
    
    if (noteSnap.exists()) {
      return { id: noteSnap.id, ...noteSnap.data() } as Note;
    }
    
    return null;
  }
};
