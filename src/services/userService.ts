
import { 
  doc, 
  updateDoc,
  setDoc, 
  serverTimestamp,
  collection,
  query,
  orderBy,
  getDocs
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "firebase/storage";
import { updateProfile, User } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, storage, auth, app } from "@/lib/firebase";
import { UserData } from "@/lib/types";

export const userService = {
  async createUser(userData: Partial<UserData>, password: string) {
    // Use a secondary app instance to create user without logging out the admin
    const secondaryApp = initializeApp(app.options, "Secondary");
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, userData.email!, password);
      const uid = userCredential.user.uid;

      // Create Firestore User Document using the main app's db instance
      await setDoc(doc(db, "users", uid), {
        uid,
        email: userData.email,
        name: userData.name,
        role: userData.role || "student",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        contact: userData.contact || "",
        country: userData.country || "",
        photoURL: ""
      });

      // Sign out from secondary auth to be clean
      await signOut(secondaryAuth);
      
      return uid;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    } finally {
      // Clean up the secondary app
      await deleteApp(secondaryApp);
    }
  },

  async uploadProfileImage(userId: string, file: File) {
    // 1. Upload to Storage
    const storageRef = ref(storage, `users/${userId}/profile_${Date.now()}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    // 2. Update Firestore User Document
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      photoURL: downloadURL,
      updatedAt: serverTimestamp()
    });

    // 3. Update Auth Profile (if current user)
    if (auth.currentUser && auth.currentUser.uid === userId) {
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL
      });
    }

    return downloadURL;
  },

  async updateProfile(userId: string, data: Partial<UserData>) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async getAllUsers() {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData));
  },

  async getLecturers() {
    // Fetch users with role 'lecturer' or 'instructor'
    const q = query(collection(db, "users"), orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    const users = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData));
    return users.filter(u => u.role === "lecturer" || u.role === "instructor");
  },

  async updateUserRole(userId: string, role: UserData["role"]) {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      role,
      updatedAt: serverTimestamp()
    });
  }
};
