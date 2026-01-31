"use client";

import React, { useEffect, useState } from 'react';
import { badgeService, Badge } from '@/services/badgeService';
import { Award, Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function BadgesPage() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadBadges();
    }
  }, [user]);

  const loadBadges = async () => {
    try {
      const data = await badgeService.getUserBadges(user!.uid);
      setBadges(data);
    } catch (error) {
      console.error("Failed to load badges", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Badges</h1>
          <p className="text-gray-500">Earn badges by completing courses and challenges.</p>
        </div>
      </div>
      
      {badges.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Badges Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Complete courses and participate in activities to start earning your collection!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {badges.map((badge) => (
            <div key={badge.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center hover:shadow-lg transition-all">
              <div className="w-24 h-24 mb-4 relative">
                {badge.imageUrl ? (
                  <img src={badge.imageUrl} alt={badge.name} className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center text-gray-300">
                    <Award className="w-12 h-12" />
                  </div>
                )}
                {!badge.earnedAt && (
                  <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] rounded-full flex items-center justify-center">
                    <Lock className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              
              <h3 className="font-bold text-gray-900 mb-1">{badge.name}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">{badge.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
