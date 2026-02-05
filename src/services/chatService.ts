import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  where,
  getDocs,
  increment
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { CommunityMessage, ChatMessage, SupportChat } from "@/lib/types";

const COMMUNITY_COLLECTION = "community_messages";
const SUPPORT_CHATS_COLLECTION = "chats";

export const chatService = {
  // ==========================================
  // COMMUNITY CHAT (Global)
  // ==========================================

  // Subscribe to community messages
  subscribeToCommunityMessages: (callback: (messages: CommunityMessage[]) => void, messageLimit = 50) => {
    const q = query(
      collection(db, COMMUNITY_COLLECTION),
      orderBy("createdAt", "desc"),
      limit(messageLimit)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommunityMessage[];
      callback(messages.reverse()); // Show oldest first in chat UI
    });
  },

  // Send a community message
  sendCommunityMessage: async (message: Omit<CommunityMessage, "id" | "createdAt">) => {
    try {
      await addDoc(collection(db, COMMUNITY_COLLECTION), {
        ...message,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error sending community message:", error);
      throw error;
    }
  },

  // Update a community message
  updateCommunityMessage: async (messageId: string, content: string) => {
    try {
      const msgRef = doc(db, COMMUNITY_COLLECTION, messageId);
      await updateDoc(msgRef, {
        content,
        isEdited: true
      });
    } catch (error) {
      console.error("Error updating community message:", error);
      throw error;
    }
  },

  // Delete a community message
  deleteCommunityMessage: async (messageId: string) => {
    try {
      await deleteDoc(doc(db, COMMUNITY_COLLECTION, messageId));
    } catch (error) {
      console.error("Error deleting community message:", error);
      throw error;
    }
  },

  // Upload voice/media (Shared)
  uploadMedia: async (file: Blob, path: string) => {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error("Error uploading media:", error);
      throw error;
    }
  },

  // ==========================================
  // SUPPORT CHAT (Private 1-on-1)
  // ==========================================

  // Get existing chat for a user
  getUserChat: async (userId: string): Promise<string | null> => {
    const q = query(
      collection(db, SUPPORT_CHATS_COLLECTION),
      where("userId", "==", userId),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].id;
  },

  // Create a new support chat
  createChat: async (userId: string, userName: string, userEmail: string, userRole: string): Promise<string> => {
    // Check if exists first
    const existingId = await chatService.getUserChat(userId);
    if (existingId) return existingId;

    const chatData: Omit<SupportChat, "id"> = {
      userId,
      userName,
      userEmail,
      userRole,
      status: "active",
      unreadByAdmin: 0,
      unreadByUser: 0,
      lastMessage: "Chat started",
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, SUPPORT_CHATS_COLLECTION), chatData);
    return docRef.id;
  },

  // Subscribe to ALL chats (Admin view)
  subscribeToAllChats: (callback: (chats: SupportChat[]) => void) => {
    const q = query(
      collection(db, SUPPORT_CHATS_COLLECTION),
      orderBy("lastMessageAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportChat[];
      callback(chats);
    });
  },

  // Subscribe to USER'S chats (Student view)
  subscribeToUserChats: (userId: string, callback: (chats: SupportChat[]) => void) => {
    const q = query(
      collection(db, SUPPORT_CHATS_COLLECTION),
      where("userId", "==", userId),
      orderBy("lastMessageAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SupportChat[];
      callback(chats);
    });
  },

  // Subscribe to messages in a specific chat
  subscribeToMessages: (chatId: string, callback: (messages: ChatMessage[]) => void) => {
    const q = query(
      collection(db, SUPPORT_CHATS_COLLECTION, chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      callback(messages);
    });
  },

  // Send a message in a specific chat
  sendMessage: async (
    chatId: string, 
    senderId: string, 
    senderName: string, 
    text: string, 
    type: "text" | "voice" | "image" | "file" | "link" = "text",
    mediaUrl?: string,
    isStaff: boolean = false
  ) => {
    try {
      // 1. Add message to subcollection
      const messageData: Omit<ChatMessage, "id"> = {
        chatId,
        senderId,
        senderName,
        text,
        type,
        mediaUrl,
        createdAt: serverTimestamp(),
        readBy: [senderId]
      };

      await addDoc(collection(db, SUPPORT_CHATS_COLLECTION, chatId, "messages"), messageData);

      // 2. Update chat metadata (last message, unread counts)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        lastMessage: type === 'text' ? text : `Sent a ${type}`,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (isStaff) {
        updateData.unreadByUser = increment(1);
      } else {
        updateData.unreadByAdmin = increment(1);
      }

      await updateDoc(doc(db, SUPPORT_CHATS_COLLECTION, chatId), updateData);

    } catch (error) {
      console.error("Error sending support message:", error);
      throw error;
    }
  },

  // Mark chat as read
  markAsRead: async (chatId: string, userId: string, role: string) => {
    const isAdmin = ["admin", "superadmin", "developer", "service"].includes(role);
    const updateData = isAdmin ? { unreadByAdmin: 0 } : { unreadByUser: 0 };
    await updateDoc(doc(db, SUPPORT_CHATS_COLLECTION, chatId), updateData);
  },

  // Close chat
  closeChat: async (chatId: string) => {
    await updateDoc(doc(db, SUPPORT_CHATS_COLLECTION, chatId), {
      status: "closed",
      updatedAt: serverTimestamp()
    });
  }
};
