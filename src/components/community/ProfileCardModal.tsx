import React, { useEffect, useState } from 'react';
import { UserData, UserRole } from '@/lib/types';
import { X, Mail, Globe, Calendar, Shield, MapPin, Briefcase } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';

interface ProfileCardModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole?: UserRole;
}

const roleColors: Record<UserRole, string> = {
  student: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  lecturer: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  admin: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  superadmin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  developer: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  instructor: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  service: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  student: <Briefcase size={16} />,
  lecturer: <Briefcase size={16} />,
  admin: <Shield size={16} />,
  superadmin: <Shield size={16} />,
  developer: <Shield size={16} />,
  instructor: <Briefcase size={16} />,
  service: <Briefcase size={16} />,
};

export const ProfileCardModal: React.FC<ProfileCardModalProps> = ({ 
  userId, 
  isOpen, 
  onClose,
  currentUserRole 
}) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      const fetchUser = async () => {
        setLoading(true);
        try {
          const docRef = doc(db, 'users', userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [userId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm md:max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header / Cover */}
        <div className="h-28 md:h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Profile Content */}
        <div className="px-5 md:px-6 pb-6 relative overflow-y-auto">
          {/* Avatar */}
          <div className="absolute -top-12 md:-top-16 left-5 md:left-6">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-zinc-900 overflow-hidden bg-gray-200 shadow-lg">
              {loading ? (
                <div className="w-full h-full animate-pulse bg-gray-300 dark:bg-gray-700" />
              ) : (
                <img 
                  src={userData?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=random&size=256`} 
                  alt={userData?.name || 'User'}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.name || 'User')}&background=random&size=256`;
                  }}
                />
              )}
            </div>
          </div>

          {/* Role Badge */}
          <div className="flex justify-end pt-3 md:pt-4 mb-6 md:mb-8 min-h-[2rem]">
             {/* Placeholder for actions like "Message" or "Follow" if needed later */}
          </div>

          {loading ? (
             <div className="space-y-4 animate-pulse mt-4 md:mt-8">
               <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
               <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
               <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
             </div>
          ) : userData ? (
            <div className="mt-2 md:mt-4">
              <div className="flex flex-col gap-1 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white break-words">
                    {userData.name}
                    </h2>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase flex items-center gap-1 shrink-0 ${roleColors[userData.role]}`}>
                    {roleIcons[userData.role]}
                    {userData.role}
                    </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm break-all">
                    {userData.email}
                </p>
              </div>

              {/* Bio */}
              {userData.bio && (
                <div className="mb-4 md:mb-6 p-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl text-sm text-gray-700 dark:text-gray-300">
                  {userData.bio}
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Calendar size={16} className="shrink-0" />
                  <span>Joined {userData.createdAt ? format(userData.createdAt.toDate(), 'MMMM yyyy') : 'N/A'}</span>
                </div>
                {userData.country && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <MapPin size={16} className="shrink-0" />
                    <span>{userData.country}</span>
                  </div>
                )}
                {/* Add more fields as needed */}
              </div>

            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              User not found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
