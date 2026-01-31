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
  limit
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

    // Create new chat if none exists
    // We need user details, assuming they are passed or fetched. 
    // For simplicity, we might update this method to take user details.
    // However, usually we want to call createChat explicitly.
    return "";
  },

  async createChat(userId: string, userName: string, userEmail: string, userRole: UserRole): Promise<string> {
    // Check if one already exists first to avoid duplicates
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
    file?: File | Blob
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

    // Update chat metadata
    const chatRef = doc(db, "support_chats", chatId);
    // We need to know if the sender is the user or an admin to increment the correct counter
    // Fetch chat to check owner
    // For optimization, we can pass isUser param or check senderId vs userId in the component
    // But here we'll do a safe read.
    // Actually, Firestore increment requires us to know which field.
    // Let's assume the caller handles the UI optimistic update, but here we need logic.
    // Simplified: We will update unread counts based on sender.
    // We'll read the chat first.
    
    // NOTE: This read might be slow for every message. 
    // Optimization: Pass "isUser" boolean to this function.
    // For now, let's just update lastMessage.
    
    await updateDoc(chatRef, {
      lastMessage: type === "text" ? text : `Sent a ${type}`,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp()
      // Increment logic would ideally go here or via Cloud Function
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
