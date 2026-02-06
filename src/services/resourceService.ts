import { db, storage } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Resource, ResourceFolder } from "@/lib/types";

export const resourceService = {
  // Storage
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },

  // Resources
  async getResourcesByCourse(courseId: string): Promise<Resource[]> {
    const q = query(
      collection(db, "resources"),
      where("courseId", "==", courseId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
  },

  async createResource(resource: Omit<Resource, "id" | "createdAt">): Promise<string> {
    // Sanitize data to remove undefined values
    const data = {
        courseId: resource.courseId,
        title: resource.title,
        url: resource.url,
        type: resource.type,
        folderId: resource.folderId ?? null,
        description: resource.description ?? null,
        createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "resources"), data);
    return docRef.id;
  },

  async deleteResource(resourceId: string): Promise<void> {
    await deleteDoc(doc(db, "resources", resourceId));
  },

  // Folders
  async getFoldersByCourse(courseId: string): Promise<ResourceFolder[]> {
    const q = query(
      collection(db, "folders"),
      where("courseId", "==", courseId),
      orderBy("createdAt", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ResourceFolder));
  },

  async createFolder(folder: Omit<ResourceFolder, "id" | "createdAt">): Promise<string> {
    // Sanitize data to remove undefined values
    const data = {
        courseId: folder.courseId,
        name: folder.name,
        parentId: folder.parentId ?? null,
        createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, "folders"), data);
    return docRef.id;
  },

  async deleteFolder(folderId: string): Promise<void> {
    // Note: Ideally we should check if folder is empty or delete contents recursively
    // For now, we'll just delete the folder document
    await deleteDoc(doc(db, "folders", folderId));
  },
  
  async updateFolder(folderId: string, data: Partial<ResourceFolder>): Promise<void> {
    await updateDoc(doc(db, "folders", folderId), data);
  }
};
