"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { chatService } from "@/services/chatService";
import { SupportChat, ChatMessage } from "@/lib/types";
import { 
  Search, 
  MessageSquare, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Mic, 
  CheckCircle,
  ArrowLeft,
  StopCircle,
  Play
} from "lucide-react";
import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";

export function SupportTab() {
  const { userData } = useAuth();
  
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "pending" | "closed">("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Messaging state
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load chats
  useEffect(() => {
    const unsubscribe = chatService.subscribeToAllChats((updatedChats) => {
      setChats(updatedChats);
    });
    return () => unsubscribe();
  }, []);

  // Load messages for selected chat
  useEffect(() => {
    if (!selectedChatId) return;

    const unsubscribe = chatService.subscribeToMessages(selectedChatId, (msgs) => {
      setMessages(msgs);
      scrollToBottom();
      
      // Mark as read when opening
      if (userData) {
        chatService.markAsRead(selectedChatId, userData.uid, userData.role);
      }
    });

    return () => unsubscribe();
  }, [selectedChatId, userData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredChats = chats
    .filter(chat => {
      if (filter !== "all" && chat.status !== filter) return false;
      if (searchQuery && !chat.userName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
        // Sort by unread first, then date
        if (a.unreadByAdmin > b.unreadByAdmin) return -1;
        if (a.unreadByAdmin < b.unreadByAdmin) return 1;
        return (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0);
    });

  const selectedChat = chats.find(c => c.id === selectedChatId);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !isRecording) || !selectedChatId || !userData) return;

    try {
      await chatService.sendMessage(
        selectedChatId,
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
        if (selectedChatId && userData) {
          await chatService.sendMessage(
            selectedChatId,
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
      
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Microphone access denied.");
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

  return (
    <div className="relative h-[calc(100vh-16rem)] min-h-[400px] flex bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Sidebar - Chat List */}
      <div className={clsx(
        "w-full md:w-80 flex flex-col border-r border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800",
        selectedChatId ? "hidden md:flex" : "flex"
      )}>
        {/* Header */}
        <div className="p-3 md:p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Messages</h1>
            <div className="flex gap-2">
               {/* Role Badge */}
               <span className="px-2 py-1 bg-brand-blue/10 text-brand-blue text-[10px] md:text-xs rounded-lg font-medium uppercase">
                 {userData?.role}
               </span>
            </div>
          </div>
          
          <div className="relative mb-3">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-blue/20"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {["all", "active", "pending", "closed"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                  filter === f 
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                )}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChatId(chat.id)}
              className={clsx(
                "w-full p-3 md:p-4 flex items-start gap-3 border-b border-gray-50 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left relative",
                selectedChatId === chat.id ? "bg-blue-50 dark:bg-blue-900/10" : ""
              )}
            >
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-brand-blue to-cyan-500 flex items-center justify-center text-white font-bold text-base md:text-lg">
                  {chat.userName.charAt(0).toUpperCase()}
                </div>
                {chat.unreadByAdmin > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-red-500 text-white text-[10px] md:text-xs flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800">
                    {chat.unreadByAdmin}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-sm md:text-base text-gray-900 dark:text-white truncate pr-2">
                    {chat.userName}
                  </h3>
                  <span className="text-[10px] md:text-xs text-gray-400 whitespace-nowrap">
                    {chat.lastMessageAt?.seconds 
                      ? formatDistanceToNow(new Date(chat.lastMessageAt.seconds * 1000), { addSuffix: false }) 
                      : ''}
                  </span>
                </div>
                <p className={clsx(
                  "text-xs md:text-sm truncate",
                  chat.unreadByAdmin > 0 ? "text-gray-900 dark:text-white font-medium" : "text-gray-500"
                )}>
                  {chat.lastMessage}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                   <span className={clsx(
                     "text-[10px] px-1.5 py-0.5 rounded border uppercase tracking-wider",
                     chat.status === 'active' ? "bg-green-50 text-green-600 border-green-100" :
                     chat.status === 'pending' ? "bg-yellow-50 text-yellow-600 border-yellow-100" :
                     "bg-gray-50 text-gray-500 border-gray-100"
                   )}>
                     {chat.status}
                   </span>
                   <span className="text-[10px] text-gray-400">{chat.userRole}</span>
                </div>
              </div>
            </button>
          ))}
          {filteredChats.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              <MessageSquare size={48} className="mx-auto mb-4 opacity-20" />
              <p>No conversations found</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={clsx(
        "flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50",
        !selectedChatId ? "hidden md:flex" : "flex w-full absolute inset-0 md:static z-20"
      )}>
        {!selectedChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
              <MessageSquare size={48} className="text-gray-300 dark:text-gray-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Select a conversation</h2>
            <p className="max-w-xs text-center">Choose a chat from the list to view history and reply to messages.</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="h-14 md:h-16 px-4 md:px-6 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3 md:gap-4">
                <button 
                  onClick={() => setSelectedChatId(null)}
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"
                >
                  <ArrowLeft size={20} />
                </button>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-brand-blue to-cyan-500 flex items-center justify-center text-white font-bold text-sm md:text-base">
                  {selectedChat?.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-sm md:text-base text-gray-900 dark:text-white">{selectedChat?.userName}</h3>
                  <div className="flex items-center gap-2 text-[10px] md:text-xs text-gray-500">
                    <span className="truncate max-w-[120px] md:max-w-none">{selectedChat?.userEmail}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="capitalize">{selectedChat?.userRole}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                  title="Mark Resolved"
                  onClick={() => chatService.closeChat(selectedChatId)}
                >
                  <CheckCircle size={20} />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg) => {
                const isMe = msg.senderId === userData?.uid;
                return (
                  <div key={msg.id} className={clsx("flex gap-4", isMe ? "flex-row-reverse" : "flex-row")}>
                    <div className={clsx(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                      isMe ? "bg-brand-blue text-white" : "bg-gray-200 text-gray-600"
                    )}>
                      {isMe ? userData?.name.charAt(0) : msg.senderName.charAt(0)}
                    </div>
                    <div className={clsx(
                      "max-w-[70%] space-y-1",
                      isMe ? "items-end" : "items-start"
                    )}>
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-xs font-medium text-gray-900 dark:text-white">{msg.senderName}</span>
                        <span className="text-[10px] text-gray-400">
                          {msg.createdAt?.seconds ? formatDistanceToNow(new Date(msg.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                        </span>
                      </div>
                      <div className={clsx(
                        "p-4 rounded-2xl text-sm leading-relaxed shadow-sm",
                        isMe 
                          ? "bg-brand-blue text-white rounded-tr-none" 
                          : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none"
                      )}>
                        {msg.type === "text" && <p>{msg.text}</p>}
                        {msg.type === "voice" && (
                           <div className="flex items-center gap-3 min-w-[200px]">
                             <div className="p-2 bg-white/20 rounded-full">
                               <Play size={16} className="fill-current" />
                             </div>
                             <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                               <div className="w-1/3 h-full bg-white"></div>
                             </div>
                             <span className="text-xs opacity-80">Voice</span>
                             <audio src={msg.mediaUrl} className="hidden" />
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
              <div className="max-w-4xl mx-auto flex items-end gap-3">
                {isRecording ? (
                  <div className="flex-1 flex items-center justify-between bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl border border-red-100 dark:border-red-900/30 text-red-600">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></span>
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      </div>
                      <span className="font-medium font-mono">{formatTime(recordingTime)}</span>
                      <span className="text-sm opacity-70">Recording voice message...</span>
                    </div>
                    <button 
                      onClick={stopRecording}
                      className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <StopCircle size={16} />
                      Stop & Send
                    </button>
                  </div>
                ) : (
                  <>
                    <button className="p-3 text-gray-400 hover:text-brand-blue hover:bg-gray-50 rounded-xl transition-colors">
                      <Paperclip size={20} />
                    </button>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 focus-within:ring-2 focus-within:ring-brand-blue/20 transition-all">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder="Type your message..."
                        className="w-full bg-transparent border-none px-4 py-3 focus:ring-0 text-sm resize-none max-h-32 min-h-[48px]"
                        rows={1}
                      />
                    </div>
                    {newMessage.trim() ? (
                      <button 
                        onClick={handleSendMessage}
                        className="p-3 bg-brand-blue text-white rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all hover:scale-105 active:scale-95"
                      >
                        <Send size={20} />
                      </button>
                    ) : (
                      <button 
                        onClick={startRecording}
                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      >
                        <Mic size={22} />
                      </button>
                    )}
                  </>
                )}
              </div>
              <div className="max-w-4xl mx-auto mt-2 text-center">
                 <p className="text-[10px] text-gray-400">
                   Press Enter to send, Shift + Enter for new line
                 </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}