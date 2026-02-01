import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDocs,
  limit,
  increment,
  getDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { SupportChat, ChatMessage, UserRole } from "@/lib/types";

export const chatService = {
  // --- Chat Management ---

  // Get or Create a chat for a specific user
  async getUserChat(userId: string): Promise<string> {
    // Check for existing active/pending chat
    const q = query(
      collection(db, "support_chats"),
      where("userId", "==", userId),
      where("status", "in", ["active", "pending"]),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    return "";
  },

  async createChat(userId: string, userName: string, userEmail: string, userRole: UserRole): Promise<string> {
    const existingId = await this.getUserChat(userId);
    if (existingId) return existingId;

    const chatRef = await addDoc(collection(db, "support_chats"), {
      userId,
      userName,
      userEmail,
      userRole,
      status: "pending",
      lastMessage: "Chat started",
      lastMessageAt: serverTimestamp(),
      unreadByUser: 0,
      unreadByAdmin: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return chatRef.id;
  },

  // --- Messaging ---

  async sendMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    text: string,
    type: "text" | "voice" | "image" | "link" = "text",
    file?: File | Blob,
    isStaff: boolean = false
  ) {
    let mediaUrl = "";

    if (file) {
      const storageRef = ref(storage, `chat-media/${chatId}/${Date.now()}_${type}`);
      await uploadBytes(storageRef, file);
      mediaUrl = await getDownloadURL(storageRef);
    }

    // Add message
    await addDoc(collection(db, "support_messages"), {
      chatId,
      senderId,
      senderName,
      text,
      type,
      mediaUrl,
      createdAt: serverTimestamp(),
      readBy: [senderId]
    });

    // Update chat metadata and unread counts
    const chatRef = doc(db, "support_chats", chatId);

    await updateDoc(chatRef, {
      lastMessage: type === "text" ? text : `Sent a ${type}`,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      // If staff sends it, increment user count. If user sends it, increment admin count.
      unreadByAdmin: isStaff ? 0 : increment(1),
      unreadByUser: isStaff ? increment(1) : 0,
      status: "active" // Ensure it's active once messages flow
    });
  },

  async updateUnreadCount(chatId: string, recipientType: "user" | "admin") {
    // This needs proper transaction or atomic increment
    // For this MVP, we will skip complex atomic counters and rely on client-side calculation or "mark as read"
  },

  async markAsRead(chatId: string, userId: string, userRole: UserRole) {
    // In a real app, we would update the "readBy" array of messages
    // Or just reset the counter on the chat object
    const chatRef = doc(db, "support_chats", chatId);
    const isStaff = ["admin", "superadmin", "developer", "service"].includes(userRole);

    if (isStaff) {
      await updateDoc(chatRef, { unreadByAdmin: 0 });
    } else {
      await updateDoc(chatRef, { unreadByUser: 0 });
    }
  },

  async closeChat(chatId: string) {
    await updateDoc(doc(db, "support_chats", chatId), {
      status: "closed",
      updatedAt: serverTimestamp()
    });
  },

  // --- Subscriptions ---

  subscribeToChat(chatId: string, callback: (chat: SupportChat) => void) {
    return onSnapshot(doc(db, "support_chats", chatId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as SupportChat);
      }
    });
  },

  subscribeToMessages(chatId: string, callback: (messages: ChatMessage[]) => void) {
    const q = query(
      collection(db, "support_messages"),
      where("chatId", "==", chatId),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage));
      callback(messages);
    });
  },

  subscribeToAllChats(callback: (chats: SupportChat[]) => void) {
    const q = query(
      collection(db, "support_chats"),
      orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SupportChat));
      callback(chats);
    });
  },

  // For regular users to see their own chats
  subscribeToUserChats(userId: string, callback: (chats: SupportChat[]) => void) {
    const q = query(
      collection(db, "support_chats"),
      where("userId", "==", userId),
      orderBy("updatedAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SupportChat));
      callback(chats);
    });
  }
};
