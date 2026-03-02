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
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";
import { getDoc } from "firebase/firestore";
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
    const ownQ = query(
      collection(db, "folders"),
      where("courseId", "==", courseId),
      orderBy("createdAt", "asc")
    );
    const linkedQ = query(
      collection(db, "folders"),
      where("linkedCourseIds", "array-contains", courseId)
    );
    const [ownSnap, linkedSnap] = await Promise.all([getDocs(ownQ), getDocs(linkedQ)]);
    const seen = new Set<string>();
    const rows: ResourceFolder[] = [];
    ownSnap.docs.forEach(d => { if (!seen.has(d.id)) { seen.add(d.id); rows.push({ id: d.id, ...d.data() } as ResourceFolder); } });
    linkedSnap.docs.forEach(d => { if (!seen.has(d.id)) { seen.add(d.id); rows.push({ id: d.id, ...d.data() } as ResourceFolder); } });
    // Sort by createdAt if available
    rows.sort((a, b) => {
      const av = (a.createdAt as any)?.seconds || 0;
      const bv = (b.createdAt as any)?.seconds || 0;
      return av - bv;
    });
    return rows;
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
  },

  async attachFolderToCourse(folderId: string, courseId: string): Promise<void> {
    await updateDoc(doc(db, "folders", folderId), {
      linkedCourseIds: arrayUnion(courseId),
      updatedAt: serverTimestamp()
    } as any);
  },

  async detachFolderFromCourse(folderId: string, courseId: string): Promise<void> {
    await updateDoc(doc(db, "folders", folderId), {
      linkedCourseIds: arrayRemove(courseId),
      updatedAt: serverTimestamp()
    } as any);
  },

  async getFolder(folderId: string): Promise<ResourceFolder | null> {
    const snap = await getDoc(doc(db, "folders", folderId));
    if (snap.exists()) {
      return { id: snap.id, ...(snap.data() as any) } as ResourceFolder;
    }
    return null;
  },

  async getSubfolders(parentId: string): Promise<ResourceFolder[]> {
    const q = query(collection(db, "folders"), where("parentId", "==", parentId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as ResourceFolder));
  },

  async getResourcesByFolder(folderId: string): Promise<Resource[]> {
    const q = query(collection(db, "resources"), where("folderId", "==", folderId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) } as Resource));
  },

  async cloneFolderToCourse(folderId: string, targetCourseId: string, targetParentId?: string): Promise<string | null> {
    const src = await resourceService.getFolder(folderId);
    if (!src) return null;
    const newFolderId = await resourceService.createFolder({
      courseId: targetCourseId,
      name: src.name,
      parentId: targetParentId
    });
    const resources = await resourceService.getResourcesByFolder(folderId);
    for (const r of resources) {
      await resourceService.createResource({
        courseId: targetCourseId,
        folderId: newFolderId,
        title: r.title,
        type: r.type,
        url: r.url,
        description: r.description || undefined
      });
    }
    const subs = await resourceService.getSubfolders(folderId);
    for (const sf of subs) {
      await resourceService.cloneFolderToCourse(sf.id, targetCourseId, newFolderId);
    }
    return newFolderId;
  }
};
