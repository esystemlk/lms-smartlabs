"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { chatService } from '@/services/chatService';
import { CommunityMessage } from '@/lib/types';
import { MessageBubble } from '@/components/community/MessageBubble';
import { ChatInput } from '@/components/community/ChatInput';
import { ProfileCardModal } from '@/components/community/ProfileCardModal';
import { Users, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/Toast";

export default function CommunityPage() {
  const { user, userData, originalRole } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<CommunityMessage | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Determine the "real" role for moderation and sending
  // If originalRole exists, it means we might be impersonating, but we want the real role for permissions?
  // Actually, for SENDING, we usually want the role we are acting as (impersonated or real).
  // But the user asked to "fetch our real role".
  // And for DELETING (moderation), we definitely want the REAL role (e.g. a dev impersonating a student should still be able to delete as a dev? Or should they be limited to student?)
  // "fetch our real role and show it" -> Sounds like they want the identity to be the real one.
  // "give acces to admin... to delete" -> Needs real permissions.
  // So I will use `originalRole` (if exists) or `userData.role` as the "Real Role".
  
  const realRole = originalRole || userData?.role || 'student';
  const displayRole = originalRole || userData?.role || 'student'; // Use real role for display too as requested

  useEffect(() => {
    const unsubscribe = chatService.subscribeToCommunityMessages((msgs) => {
      setMessages(msgs);
      setLoading(false);
      scrollToBottom();
    });
    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (content: string, type: 'text' | 'voice' | 'link', file?: Blob) => {
    if (!user || !userData) return;

    try {
      let mediaUrl = undefined;
      
      if (type === 'voice' && file) {
        // Generate a unique path
        const filename = `voice_${user.uid}_${Date.now()}.webm`;
        const path = `community/voice/${filename}`;
        mediaUrl = await chatService.uploadMedia(file, path);
      }

      const messageData: any = {
        content,
        senderId: user.uid,
        senderName: userData.name || user.displayName || 'Anonymous',
        senderRole: displayRole,
        type,
      };

      if (replyingTo) {
        messageData.replyToId = replyingTo.id;
        messageData.replyToName = replyingTo.senderName;
        messageData.replyToContent = replyingTo.content;
      }

      if (user.photoURL) messageData.senderPhotoURL = user.photoURL;
      if (mediaUrl) messageData.mediaUrl = mediaUrl;

      await chatService.sendCommunityMessage(messageData);
      
      setReplyingTo(null); // Clear reply state
      scrollToBottom();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast("Failed to send message", "error");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
        await chatService.deleteCommunityMessage(messageId);
        toast("Message deleted", "success");
    } catch (error) {
        console.error(error);
        toast("Failed to delete message", "error");
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
        await chatService.updateCommunityMessage(messageId, newContent);
        toast("Message updated", "success");
    } catch (error) {
        console.error(error);
        toast("Failed to update message", "error");
    }
  };

  const handleReply = (message: CommunityMessage) => {
    setReplyingTo(message);
    // Focus input? Ideally yes, but ChatInput is a separate component.
  };

  const handleProfileClick = (userId: string) => {
    setSelectedUserId(userId);
    setIsProfileOpen(true);
  };

  if (!user) return null;

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] md:h-[calc(100vh-5rem)] max-w-6xl mx-auto w-full relative bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="p-3 md:p-4 border-b dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Users size={20} className="md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Community</h1>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Connect with everyone</p>
          </div>
        </div>
        <div className="flex -space-x-2">
           {/* Placeholder for online users or similar - just visual for now */}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-2 md:p-4 bg-gray-50/50 dark:bg-zinc-950 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-zinc-700">
        {loading ? (
           <div className="flex items-center justify-center h-full">
             <Loader2 className="animate-spin text-blue-500" size={32} />
           </div>
        ) : (
          <div className="flex flex-col gap-2 pb-4">
             {messages.length === 0 && (
                <div className="text-center text-gray-400 py-10">
                   No messages yet. Be the first to say hello!
                </div>
             )}
             {messages.map((msg) => (
               <MessageBubble 
                 key={msg.id} 
                 message={msg} 
                 isCurrentUser={msg.senderId === user.uid}
                 currentUserRole={realRole}
                 onDelete={handleDeleteMessage}
                 onEdit={handleEditMessage}
                 onReply={handleReply}
                 onProfileClick={handleProfileClick}
               />
             ))}
             <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 w-full z-10">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
        />
      </div>

      {/* Profile Modal */}
      {selectedUserId && (
        <ProfileCardModal 
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          userId={selectedUserId}
          currentUserRole={realRole}
        />
      )}
    </div>
  );
}
