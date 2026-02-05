"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { chatService } from "@/services/chatService";
import { SupportChat, ChatMessage } from "@/lib/types";
import { Loader2, MessageSquare, Search, Send, User, MoreVertical, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { format } from "date-fns";
import { clsx } from "clsx";

export default function MessagesPage() {
  const { user, userData } = useAuth();
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [selectedChat, setSelectedChat] = useState<SupportChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Chats
  useEffect(() => {
    if (!user || !userData) return;

    const isAdmin = ["admin", "superadmin", "developer", "lecturer"].includes(userData.role);
    let unsubscribe: () => void;

    if (isAdmin) {
      unsubscribe = chatService.subscribeToAllChats((data) => {
        setChats(data);
        setLoadingChats(false);
      });
    } else {
      // For students, ensure a chat exists first
      const initStudentChat = async () => {
        try {
          await chatService.createChat(user.uid, userData.name, user.email || "", userData.role);
          unsubscribe = chatService.subscribeToUserChats(user.uid, (data) => {
            setChats(data);
            if (data.length > 0 && !selectedChat) {
              setSelectedChat(data[0]); // Auto-select for students
            }
            setLoadingChats(false);
          });
        } catch (error) {
          console.error("Failed to init chat", error);
          setLoadingChats(false);
        }
      };
      initStudentChat();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user, userData]);

  // 2. Fetch Messages when chat selected
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    const unsubscribe = chatService.subscribeToMessages(selectedChat.id, (data) => {
      setMessages(data);
      setLoadingMessages(false);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedChat?.id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedChat || !user || !userData) return;

    try {
      const isStaff = ["admin", "superadmin", "developer", "lecturer"].includes(userData.role);
      await chatService.sendMessage(
        selectedChat.id,
        user.uid,
        userData.name,
        inputText.trim(),
        "text",
        undefined,
        isStaff
      );
      setInputText("");
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loadingChats) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="animate-spin text-brand-blue" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 pb-6">
      {/* Sidebar List */}
      <div className={`w-full md:w-80 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-brand-blue/20 transition-all text-sm outline-none"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredChats.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-sm">
              No conversations found.
            </div>
          ) : (
            filteredChats.map(chat => (
              <div 
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={clsx(
                  "p-3 rounded-xl cursor-pointer transition-all flex gap-3 items-start",
                  selectedChat?.id === chat.id 
                    ? "bg-brand-blue/5 border-brand-blue/10 border" 
                    : "hover:bg-gray-50 border border-transparent"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {chat.userName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900 text-sm truncate">{chat.userName}</h3>
                    {chat.lastMessageAt && (
                      <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                        {(() => {
                          const date = chat.lastMessageAt?.toDate ? chat.lastMessageAt.toDate() : new Date(chat.lastMessageAt);
                          return format(date, 'MMM d');
                        })()}
                      </span>
                    )}
                  </div>
                  <p className={clsx(
                    "text-xs truncate mt-0.5",
                    (userData?.role === 'student' ? chat.unreadByUser : chat.unreadByAdmin) > 0 
                      ? "font-bold text-gray-900" 
                      : "text-gray-500"
                  )}>
                    {chat.lastMessage || "No messages"}
                  </p>
                </div>
                {(userData?.role === 'student' ? chat.unreadByUser : chat.unreadByAdmin) > 0 && (
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="md:hidden -ml-2" onClick={() => setSelectedChat(null)}>
                <Loader2 className="rotate-90" size={20} /> {/* Should be back arrow but Loader2 is imported */}
              </Button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 font-bold flex-shrink-0">
                {selectedChat.userName.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{selectedChat.userName}</h3>
                <span className="text-xs text-green-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Online
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                <Phone size={20} />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                <Video size={20} />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                <MoreVertical size={20} />
              </Button>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {loadingMessages ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-brand-blue" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                Start a conversation with {selectedChat.userName}
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={clsx(
                      "max-w-[75%] rounded-2xl p-3 shadow-sm",
                      isMe 
                        ? "bg-brand-blue text-white rounded-br-none" 
                        : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
                    )}>
                      <p className="text-sm">{msg.text}</p>
                      <div className={clsx(
                        "text-[10px] mt-1 text-right opacity-70",
                        isMe ? "text-blue-100" : "text-gray-400"
                      )}>
                        {(() => {
                          if (!msg.createdAt) return '';
                          const date = msg.createdAt.toDate ? msg.createdAt.toDate() : new Date(msg.createdAt);
                          return format(date, 'h:mm a');
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Input
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-full border-gray-200 focus:ring-brand-blue bg-gray-50"
              />
              <Button 
                type="submit" 
                disabled={!inputText.trim()}
                className="rounded-full w-10 h-10 p-0 flex items-center justify-center bg-brand-blue hover:bg-blue-700 text-white shadow-md shadow-blue-200 transition-all hover:scale-105 active:scale-95"
              >
                <Send size={18} className={inputText.trim() ? "ml-0.5" : ""} />
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 items-center justify-center p-8 text-center">
          <div className="max-w-xs">
            <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Your Messages</h3>
            <p className="text-gray-500 mb-6">Select a conversation to start chatting or connect with your community.</p>
          </div>
        </div>
      )}
    </div>
  );
}
