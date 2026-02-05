import React, { useState } from 'react';
import { CommunityMessage, UserRole } from '@/lib/types';
import { format } from 'date-fns';
import { Play, Pause, FileText, ExternalLink, Trash2, Edit2, X, Check, Reply, User as UserIcon, MoreVertical } from 'lucide-react';

interface MessageBubbleProps {
  message: CommunityMessage;
  isCurrentUser: boolean;
  currentUserRole?: UserRole;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, newContent: string) => void;
  onReply?: (message: CommunityMessage) => void;
  onProfileClick?: (userId: string) => void;
}

const roleColors: Record<UserRole, string> = {
  student: 'bg-blue-500/10 border-blue-500/20 text-blue-900 dark:text-blue-100',
  lecturer: 'bg-red-500/10 border-red-500/20 text-red-900 dark:text-red-100',
  admin: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-900 dark:text-yellow-100',
  superadmin: 'bg-purple-500/10 border-purple-500/20 text-purple-900 dark:text-purple-100',
  developer: 'bg-green-500/10 border-green-500/20 text-green-900 dark:text-green-100',
  instructor: 'bg-orange-500/10 border-orange-500/20 text-orange-900 dark:text-orange-100',
  service: 'bg-gray-500/10 border-gray-500/20 text-gray-900 dark:text-gray-100',
};

const roleBadges: Record<UserRole, string> = {
  student: 'bg-blue-500 text-white',
  lecturer: 'bg-red-500 text-white',
  admin: 'bg-yellow-500 text-black',
  superadmin: 'bg-purple-600 text-white',
  developer: 'bg-green-600 text-white',
  instructor: 'bg-orange-500 text-white',
  service: 'bg-gray-500 text-white',
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isCurrentUser, 
  currentUserRole,
  onDelete,
  onEdit,
  onReply,
  onProfileClick
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [imgError, setImgError] = useState(false);

  const isLink = message.type === 'link';
  const isVoice = message.type === 'voice';
  
  // Format time
  let time = '';
  if (message.createdAt) {
      // Handle Firestore Timestamp or Date
      const date = message.createdAt.toDate ? message.createdAt.toDate() : new Date(message.createdAt);
      time = format(date, 'h:mm a');
  }

  // Moderation Logic
  const canDelete = isCurrentUser || (
    currentUserRole && 
    ['admin', 'superadmin', 'developer'].includes(currentUserRole) && 
    ['student', 'lecturer'].includes(message.senderRole)
  );

  const canEdit = isCurrentUser && message.type === 'text'; // Only allow editing own text messages

  const handleSaveEdit = () => {
    if (editContent.trim() !== message.content) {
      onEdit?.(message.id, editContent);
    }
    setIsEditing(false);
  };

  // Helper to format content with mentions
  const formatContent = (text: string) => {
    // Split by mention pattern (starts with / or @ followed by word characters)
    // We use a capture group so the delimiter is included in the result array
    const parts = text.split(/((?:\/|@)(?:\w+))/g);
    
    return parts.map((part, index) => {
      if ((part.startsWith('/') || part.startsWith('@')) && part.length > 1) {
        return (
          <span key={index} className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className={`flex flex-col mb-4 group ${isCurrentUser ? 'items-end' : 'items-start'}`}>
      <div className={`flex items-baseline gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <button 
          onClick={() => onProfileClick?.(message.senderId)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none"
        >
          {message.senderPhotoURL && !imgError ? (
            <img 
              src={message.senderPhotoURL} 
              alt={message.senderName} 
              className="w-5 h-5 rounded-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
             <div className="w-5 h-5 rounded-full bg-gray-300 dark:bg-zinc-700 flex items-center justify-center overflow-hidden">
               <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(message.senderName)}&background=random&size=64`}
                  alt={message.senderName}
                  className="w-full h-full object-cover"
               />
             </div>
          )}
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:underline">
            {message.senderName}
          </span>
        </button>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider ${roleBadges[message.senderRole] || 'bg-gray-500'}`}>
          {message.senderRole}
        </span>
        <span className="text-[10px] text-gray-400">
          {time} {message.isEdited && '(edited)'}
        </span>
      </div>

      <div className={`relative flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div 
      className={`
        relative max-w-[80%] md:max-w-[70%] rounded-2xl border
        ${isEditing ? 'p-1.5 md:p-2 bg-white dark:bg-zinc-900 border-blue-500/30 shadow-lg z-10 w-full md:w-auto md:min-w-[320px]' : `px-3 py-2 md:px-4 md:py-3 ${roleColors[message.senderRole] || 'bg-gray-100 border-gray-200'}`}
        ${isCurrentUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}
        transition-all duration-200
      `}
    >
      {/* Reply Context */}
      {!isEditing && message.replyToId && (
            <div className={`text-xs mb-2 p-2 rounded bg-black/5 dark:bg-white/10 border-l-2 ${isCurrentUser ? 'border-blue-400' : 'border-gray-400'}`}>
              <div className="font-semibold opacity-75">{message.replyToName}</div>
              <div className="truncate opacity-60 line-clamp-1">{message.replyToContent || 'Message'}</div>
            </div>
          )}

          {isEditing ? (
            <div className="flex flex-col gap-2 w-full">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-gray-50 dark:bg-black/40 p-3 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none min-h-[100px]"
                rows={3}
                autoFocus
                placeholder="Edit your message..."
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} />
                  Save
                </button>
              </div>
            </div>
          ) : (
            <>
              {isVoice && message.mediaUrl && (
                <div className="w-[200px] sm:w-[250px] md:w-[300px] max-w-full flex items-center">
                  <audio controls className="w-full h-10 rounded-md shadow-sm">
                    <source src={message.mediaUrl} type="audio/webm" />
                    <source src={message.mediaUrl} type="audio/mp4" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {isLink ? (
                <div>
                  <a 
                    href={message.content} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline break-all flex items-center gap-1"
                  >
                    {message.content} <ExternalLink size={14} />
                  </a>
                  {/* Simple embed for youtube if detected */}
                  {(message.content.includes('youtube.com') || message.content.includes('youtu.be')) && (
                    <div className="mt-2 rounded-lg overflow-hidden relative pt-[56.25%] w-full max-w-[400px]">
                      <iframe 
                        src={`https://www.youtube.com/embed/${getYouTubeID(message.content)}`}
                        className="absolute top-0 left-0 w-full h-full"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
              ) : !isVoice && (
                <p className="whitespace-pre-wrap break-words text-sm md:text-base">
                  {formatContent(message.content)}
                </p>
              )}
            </>
          )}
        </div>

        {/* Action Buttons (Menu) */}
        {!isEditing && (
          <div className={`relative ${showMenu ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'} transition-opacity`}>
             <button 
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
             >
               <MoreVertical size={16} />
             </button>

             {showMenu && (
               <>
                 <div className="fixed inset-0 z-20" onClick={() => setShowMenu(false)} />
                 <div className={`absolute bottom-full mb-2 ${isCurrentUser ? 'left-0' : 'right-0'} bg-white dark:bg-zinc-900 rounded-lg shadow-xl border border-gray-100 dark:border-zinc-800 z-30 min-w-[140px] overflow-hidden py-1`}>
                    <button 
                      onClick={() => {
                        onReply?.(message);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                    >
                      <Reply size={14} /> Reply
                    </button>

                    {canEdit && (
                      <button 
                        onClick={() => {
                          setIsEditing(true);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center gap-2 text-gray-700 dark:text-gray-200"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                    )}

                    {canDelete && (
                      <button 
                        onClick={() => {
                          onDelete?.(message.id);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 dark:text-red-400"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    )}
                 </div>
               </>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper to extract YT ID
function getYouTubeID(url: string) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
