"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { chatService } from "@/services/chatService";
import { ChatMessage, SupportChat } from "@/lib/types";
import { 
  MessageCircle, 
  X, 
  Send, 
  Mic, 
  Paperclip, 
  Minimize2,
  Image as ImageIcon,
  StopCircle,
  Play,
  Pause
} from "lucide-react";
import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";

export function FloatingChatWidget() {
  const { userData, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize or fetch chat
  useEffect(() => {
    if (!userData || !isOpen) return;

    const initChat = async () => {
      try {
        const chatId = await chatService.getUserChat(userData.uid);
        if (chatId) {
          setActiveChatId(chatId);
        }
      } catch (error) {
        console.error("Failed to init chat:", error);
      }
    };

    initChat();
  }, [userData, isOpen]);

  // Subscribe to messages
  useEffect(() => {
    if (!activeChatId) return;

    const unsubscribe = chatService.subscribeToMessages(activeChatId, (msgs) => {
      setMessages(msgs);
      // Mark as read logic would go here
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [activeChatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleStartChat = async () => {
    if (!userData) return;
    try {
      const chatId = await chatService.createChat(
        userData.uid,
        userData.name,
        userData.email,
        userData.role
      );
      setActiveChatId(chatId);
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !isRecording) || !activeChatId || !userData) return;

    try {
      await chatService.sendMessage(
        activeChatId,
        userData.uid,
        userData.name,
        newMessage,
        "text"
      );
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        // Send voice message
        if (activeChatId && userData) {
          await chatService.sendMessage(
            activeChatId,
            userData.uid,
            userData.name,
            "Voice Message",
            "voice",
            blob
          );
        }
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      // Timer
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!user) return null; // Don't show for guests? Or maybe show a "Login to chat"

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "fixed bottom-16 md:bottom-6 right-4 md:right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105",
          isOpen ? "bg-red-500 text-white rotate-90" : "bg-brand-blue text-white"
        )}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
      </button>

      {/* Chat Window */}
      <div className={clsx(
        "fixed bottom-32 md:bottom-24 right-4 md:right-6 w-[calc(100vw-2rem)] md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-40 flex flex-col transition-all duration-300 origin-bottom-right overflow-hidden border border-gray-100 dark:border-gray-700",
        isOpen ? "scale-100 opacity-100 h-[calc(100vh-12rem)] md:h-[600px] max-h-[80vh]" : "scale-0 opacity-0 h-0"
      )}>
        {/* Header */}
        <div className="p-4 bg-brand-blue text-white flex justify-between items-center">
          <div>
            <h3 className="font-bold text-lg">Support Chat</h3>
            <p className="text-xs text-blue-100">We typically reply in a few minutes</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
            <Minimize2 size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-300">
          {!activeChatId ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-blue-100 text-brand-blue rounded-full flex items-center justify-center mb-4">
                <MessageCircle size={32} />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">How can we help?</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Our support team is here to assist you with any questions or issues.
              </p>
              <button
                onClick={handleStartChat}
                className="w-full py-3 px-4 bg-brand-blue text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Start Conversation
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isMe = msg.senderId === user.uid;
                return (
                  <div key={msg.id} className={clsx("flex", isMe ? "justify-end" : "justify-start")}>
                    <div className={clsx(
                      "max-w-[80%] p-3 rounded-2xl text-sm",
                      isMe 
                        ? "bg-brand-blue text-white rounded-tr-none" 
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-none"
                    )}>
                      {msg.type === "text" && <p>{msg.text}</p>}
                      {msg.type === "voice" && (
                        <div className="flex items-center gap-2">
                           <audio controls src={msg.mediaUrl} className="h-8 w-48" />
                        </div>
                      )}
                      <div className={clsx("text-[10px] mt-1 opacity-70", isMe ? "text-blue-100" : "text-gray-400")}>
                        {msg.createdAt?.seconds ? formatDistanceToNow(new Date(msg.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        {activeChatId && (
          <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
            {isRecording ? (
              <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/20 p-2 rounded-xl text-red-600">
                <div className="flex items-center gap-2 animate-pulse">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium">{formatTime(recordingTime)}</span>
                </div>
                <button 
                  onClick={stopRecording}
                  className="p-2 bg-red-100 dark:bg-red-900/40 rounded-full hover:bg-red-200 transition-colors"
                >
                  <StopCircle size={20} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-brand-blue hover:bg-gray-50 rounded-full transition-colors">
                  <Paperclip size={20} />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-100 dark:bg-gray-900 border-none rounded-xl px-4 py-2 focus:ring-2 focus:ring-brand-blue/20 outline-none text-sm"
                />
                {newMessage.trim() ? (
                  <button 
                    onClick={handleSendMessage}
                    className="p-2 bg-brand-blue text-white rounded-full hover:bg-blue-700 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={startRecording}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Mic size={20} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
