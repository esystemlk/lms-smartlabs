import { db, storage } from "@/lib/firebase";
import { 
  collection, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, 
  deleteDoc, query, where, orderBy, serverTimestamp, increment 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Types
export interface RecordedPackage {
  id?: string;
  name: string;
  durationMonths: number;
  price: number; // In LKR
  description: string;
  active: boolean;
  features: string[];
  category?: string;
}

export interface RecordedResource {
  name: string;
  url: string;
  type: string;
}

export interface RecordedClass {
  id?: string;
  bunnyVideoId: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  order: number;
  active: boolean;
  views: number;
  instructorName?: string;
  instructorImage?: string;
  resources?: RecordedResource[];
}

export interface RecordedEnrollment {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  packageId: string;
  packageName: string;
  startDate: any; // Timestamp
  expiryDate: any; // Timestamp
  status: 'active' | 'expired';
  paymentMethod: 'payhere' | 'bank_transfer';
  paymentId?: string; // Order ID or Bank Transfer ID
  totalWatchTimeSeconds: number;
  lastActive: any; // Timestamp
}

export interface BankTransferRequest {
  id?: string;
  userId: string;
  userEmail: string;
  userName: string;
  packageId: string;
  amount: number;
  receiptUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  processedAt?: any;
  adminNote?: string;
}

export const recordedClassService = {
  // --- PACKAGES ---
  async getPackages() {
    const q = query(collection(db, "recorded_packages"), orderBy("durationMonths", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as RecordedPackage));
  },

  async updatePackage(id: string, data: Partial<RecordedPackage>) {
    await updateDoc(doc(db, "recorded_packages", id), data);
  },

  async createPackage(data: RecordedPackage) {
    await addDoc(collection(db, "recorded_packages"), data);
  },

  // --- CLASSES ---
  async getClasses() {
    const q = query(collection(db, "recorded_classes"), orderBy("order", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as RecordedClass));
  },

  async syncClass(data: RecordedClass) {
    // Check if exists by bunnyVideoId
    const q = query(collection(db, "recorded_classes"), where("bunnyVideoId", "==", data.bunnyVideoId));
    const snap = await getDocs(q);
    
    if (!snap.empty) {
      // Update existing
      const docId = snap.docs[0].id;
      await updateDoc(doc(db, "recorded_classes", docId), data as any);
      return docId;
    } else {
      // Create new
      const ref = await addDoc(collection(db, "recorded_classes"), {
        ...data,
        views: 0,
        active: true,
        order: Date.now()
      });
      return ref.id;
    }
  },

  async toggleClassStatus(id: string, active: boolean) {
    await updateDoc(doc(db, "recorded_classes", id), { active });
  },

  async deleteClass(id: string) {
    await deleteDoc(doc(db, "recorded_classes", id));
  },

  // --- ENROLLMENTS ---
  async getUserEnrollment(userId: string) {
    const q = query(
      collection(db, "recorded_enrollments"), 
      where("userId", "==", userId),
      where("status", "==", "active")
    );
    const snap = await getDocs(q);
    // Return the one with the furthest expiry date if multiple
    if (snap.empty) return null;
    
    const enrollments = snap.docs.map(d => ({ id: d.id, ...d.data() } as RecordedEnrollment));
    return enrollments.sort((a, b) => b.expiryDate?.seconds - a.expiryDate?.seconds)[0];
  },

  async createEnrollment(data: Omit<RecordedEnrollment, 'id'>) {
    return await addDoc(collection(db, "recorded_enrollments"), data);
  },

  async updateWatchTime(enrollmentId: string, seconds: number) {
    await updateDoc(doc(db, "recorded_enrollments", enrollmentId), {
      totalWatchTimeSeconds: increment(seconds),
      lastActive: serverTimestamp()
    });
  },

  async incrementVideoView(classId: string) {
    await updateDoc(doc(db, "recorded_classes", classId), {
      views: increment(1)
    });
  },

  async uploadResource(file: File) {
    const storageRef = ref(storage, `recorded_resources/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  },

  async updateClass(id: string, data: Partial<RecordedClass>) {
    // Sanitize undefined values
    const sanitizedData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );
    await updateDoc(doc(db, "recorded_classes", id), sanitizedData);
  },

  // --- BANK TRANSFERS ---
  async submitBankTransfer(userId: string, file: File, packageId: string, amount: number, userData: any) {
    // 1. Upload receipt
    const storageRef = ref(storage, `receipts/${userId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // 2. Create request
    await addDoc(collection(db, "bank_transfers"), {
      userId,
      userEmail: userData.email,
      userName: userData.name || 'Unknown',
      packageId,
      amount,
      receiptUrl: downloadURL,
      status: 'pending',
      submittedAt: serverTimestamp()
    });
  },

  async getPendingBankTransfers() {
    const q = query(collection(db, "bank_transfers"), where("status", "==", "pending"), orderBy("submittedAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as BankTransferRequest));
  },

  async processBankTransfer(requestId: string, action: 'approved' | 'rejected', adminNote?: string) {
    const requestRef = doc(db, "bank_transfers", requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) throw new Error("Request not found");
    const requestData = requestSnap.data() as BankTransferRequest;

    if (action === 'approved') {
      // Create Enrollment
      const packageRef = doc(db, "recorded_packages", requestData.packageId);
      const packageSnap = await getDoc(packageRef);
      const pkg = packageSnap.data() as RecordedPackage;

      const startDate = new Date();
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + pkg.durationMonths);

      await addDoc(collection(db, "recorded_enrollments"), {
        userId: requestData.userId,
        userEmail: requestData.userEmail,
        userName: requestData.userName,
        packageId: requestData.packageId,
        packageName: pkg.name,
        startDate: serverTimestamp(),
        expiryDate: expiryDate, // Firestore will convert Date
        status: 'active',
        paymentMethod: 'bank_transfer',
        paymentId: requestId,
        totalWatchTimeSeconds: 0,
        lastActive: serverTimestamp()
      });
    }

    await updateDoc(requestRef, {
      status: action,
      processedAt: serverTimestamp(),
      adminNote: adminNote || null
    });
  },
  
  // --- ANALYTICS ---
  async getAllEnrollments() {
     const q = query(collection(db, "recorded_enrollments"), orderBy("lastActive", "desc"));
     const snap = await getDocs(q);
     return snap.docs.map(d => ({ id: d.id, ...d.data() } as RecordedEnrollment));
  }
};
