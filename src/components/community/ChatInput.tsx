import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Square, Paperclip, Link as LinkIcon, X, Reply } from 'lucide-react';
import { clsx } from 'clsx';
import { CommunityMessage, UserData } from '@/lib/types';
import { userService } from '@/services/userService';

interface ChatInputProps {
  onSendMessage: (content: string, type: 'text' | 'voice' | 'link', file?: Blob) => Promise<void>;
  disabled?: boolean;
  replyingTo?: CommunityMessage | null;
  onCancelReply?: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled, replyingTo, onCancelReply }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSending, setIsSending] = useState(false);
  
  // Mention states
  const [users, setUsers] = useState<UserData[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Fetch users for mentions
    const fetchUsers = async () => {
      try {
        const allUsers = await userService.getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error("Error fetching users for mentions:", error);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (showMentions) {
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(mentionQuery.toLowerCase())
      ).slice(0, 5);
      setFilteredUsers(filtered);
      setMentionIndex(0);
    }
  }, [mentionQuery, users, showMentions]);

  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue);
    
    // Check for mention trigger
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbolIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtSymbolIndex + 1);
      // Check if there are no spaces after @ (except if we are just starting to type)
      // and ensure the @ is either at start or preceded by space
      const isPrecededBySpace = lastAtSymbolIndex === 0 || textBeforeCursor[lastAtSymbolIndex - 1] === ' ';
      const hasSpaceAfterAt = textAfterAt.includes(' ');
      
      if (isPrecededBySpace && !hasSpaceAfterAt) {
        setShowMentions(true);
        setMentionQuery(textAfterAt);
        return;
      }
    }
    
    setShowMentions(false);
  };

  const insertMention = (user: UserData) => {
    if (!textareaRef.current) return;
    
    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = message.slice(0, cursorPosition);
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');
    
    const prefix = message.slice(0, lastAtSymbolIndex);
    const suffix = message.slice(cursorPosition);
    
    // Remove spaces from name for easier parsing/highlighting
    const nameToInsert = user.name.replace(/\s+/g, '');
    const newMessage = `${prefix}@${nameToInsert} ${suffix}`;
    
    setMessage(newMessage);
    setShowMentions(false);
    
    // Reset focus and cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = lastAtSymbolIndex + nameToInsert.length + 2; // +2 for @ and space
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleSend = async () => {
    if (!message.trim() && !isRecording) return;
    
    setIsSending(true);
    try {
      // Check for links
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const isLink = urlRegex.test(message);
      
      await onSendMessage(message, isLink ? 'link' : 'text');
      setMessage('');
    } catch (error) {
      console.error("Failed to send:", error);
    } finally {
      setIsSending(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsSending(true);
        try {
            await onSendMessage('Voice Message', 'voice', audioBlob);
        } finally {
            setIsSending(false);
            setRecordingTime(0);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const cancelRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          // Just stop without sending (we'd need logic in onstop to know if cancelled, 
          // but for now let's just not handle the data in a complex way or just ignore the next event)
          // Actually, easiest is to let it stop but set a flag? 
          // For simplicity in this iteration: Stop = Send. 
          // If we want cancel, we'd need to refactor slightly.
          // Let's stick to Stop=Send for now, maybe add a cancel button that clears the ref before stopping.
          
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
          audioChunksRef.current = []; // Clear chunks so it sends empty/invalid? 
          // Better: The onstop handler will fire. We should probably have a 'cancelled' ref.
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && filteredUsers.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev > 0 ? prev - 1 : filteredUsers.length - 1));
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev < filteredUsers.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        insertMention(filteredUsers[mentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentions(false);
        return;
      }
    }

      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border-t dark:border-zinc-800 p-2 md:p-4 pb-safe-area-bottom">
      {replyingTo && (
        <div className="max-w-4xl mx-auto mb-2 flex items-center justify-between bg-gray-100 dark:bg-zinc-800 p-2 rounded-lg border-l-4 border-blue-500">
          <div className="flex flex-col text-sm overflow-hidden">
            <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <Reply size={12} />
              Replying to {replyingTo.senderName}
            </span>
            <span className="text-gray-500 dark:text-gray-400 truncate max-w-[200px] md:max-w-md">
              {replyingTo.content || (replyingTo.type === 'voice' ? 'Voice Message' : 'Media')}
            </span>
          </div>
          <button 
            onClick={onCancelReply}
            className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2 max-w-4xl mx-auto relative">
        {/* Mentions Popup */}
        {showMentions && filteredUsers.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border dark:border-zinc-700 overflow-hidden z-50">
            {filteredUsers.map((user, index) => (
              <button
                key={user.uid}
                className={clsx(
                  "w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors",
                  index === mentionIndex ? "bg-blue-50 dark:bg-blue-900/20" : ""
                )}
                onClick={() => insertMention(user)}
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs shrink-0 overflow-hidden">
                  {user.photoURL ? (
                     <img 
                       src={user.photoURL} 
                       alt={user.name} 
                       className="w-full h-full rounded-full object-cover" 
                       referrerPolicy="no-referrer"
                       onError={(e) => {
                         e.currentTarget.onerror = null;
                         e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=64`;
                       }}
                     />
                  ) : (
                     <img 
                       src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random&size=64`}
                       alt={user.name} 
                       className="w-full h-full rounded-full object-cover" 
                     />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate dark:text-gray-200">{user.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate capitalize">{user.role}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {isRecording ? (
          <div className="flex-1 flex items-center justify-between bg-red-50 dark:bg-red-900/20 p-2 md:p-3 rounded-xl border border-red-100 dark:border-red-900/30 animate-pulse">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm md:text-base">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              Recording... {formatTime(recordingTime)}
            </div>
            <button 
              onClick={stopRecording}
              className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            >
              <Square size={16} fill="currentColor" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 relative">
                <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={replyingTo ? "Type your reply..." : "Message... (Type @ to mention)"}
                    className="w-full bg-gray-100 dark:bg-zinc-800 border-0 rounded-2xl px-3 py-2 md:px-4 md:py-3 pr-10 focus:ring-2 focus:ring-blue-500 resize-none max-h-32 min-h-[44px] text-sm md:text-base"
                    rows={1}
                    disabled={disabled || isSending}
                />
            </div>

            <button
                onClick={startRecording}
                disabled={disabled || isSending || message.length > 0}
                className={clsx(
                    "p-2 md:p-3 rounded-full transition-all shrink-0",
                    message.length > 0 
                        ? "w-0 p-0 opacity-0 overflow-hidden" 
                        : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                )}
            >
                <Mic size={20} />
            </button>

            <button
                onClick={handleSend}
                disabled={disabled || isSending || (!message.trim() && !isRecording)}
                className="p-2 md:p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
                <Send size={20} className={isSending ? "animate-spin" : ""} />
            </button>
          </>
        )}
      </div>
      <div className="text-[10px] text-center text-gray-400 mt-1 md:mt-2">
         Community Guidelines apply.
      </div>
    </div>
  );
};
