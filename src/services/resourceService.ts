import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy
} from "firebase/firestore";
import { Resource } from "@/lib/types";

export const resourceService = {
  async getResourcesByCourse(courseId: string): Promise<Resource[]> {
    const q = query(
      collection(db, "resources"),
      where("courseId", "==", courseId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
  }
};
