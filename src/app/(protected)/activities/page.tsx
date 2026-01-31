"use client";

import React, { useEffect, useState } from 'react';
import { activityService, Activity } from '@/services/activityService';
import { Calendar, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      const data = await activityService.getActivities();
      setActivities(data);
    } catch (error) {
      console.error("Failed to load activities", error);
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
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <h1 className="text-xl md:text-3xl font-bold text-gray-900">Activities</h1>
      
      {activities.length === 0 ? (
        <div className="text-center py-12 md:py-20 bg-gray-50 rounded-2xl md:rounded-3xl border border-dashed border-gray-200">
          <Calendar className="w-10 h-10 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base md:text-lg font-medium text-gray-900">No activities scheduled</h3>
          <p className="text-xs md:text-base text-gray-500">Check back later for upcoming events.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <div key={activity.id} className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2 md:mb-4">
                <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium capitalize
                  ${activity.type === 'hackathon' ? 'bg-purple-100 text-purple-700' : 
                    activity.type === 'workshop' ? 'bg-blue-100 text-blue-700' : 
                    'bg-gray-100 text-gray-700'}`}>
                  {activity.type}
                </span>
                {activity.date && (
                  <span className="text-xs md:text-sm text-gray-500">
                    {format(activity.date.toDate(), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
              
              <h2 className="text-base md:text-xl font-bold text-gray-900 mb-1 md:mb-2">{activity.title}</h2>
              <p className="text-xs md:text-base text-gray-500 mb-4 md:mb-6 line-clamp-3">{activity.description}</p>
              
              <div className="flex items-center justify-between mt-auto">
                <span className={`text-[10px] md:text-sm font-medium
                  ${activity.status === 'upcoming' ? 'text-green-600' :
                    activity.status === 'ongoing' ? 'text-blue-600' :
                    'text-gray-400'}`}>
                  {activity.status === 'upcoming' ? 'Coming Soon' : 
                   activity.status === 'ongoing' ? 'Happening Now' : 'Completed'}
                </span>
                
                {activity.registrationUrl && activity.status !== 'completed' && (
                  <a 
                    href={activity.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="px-3 py-1.5 md:px-4 md:py-2 bg-brand-blue text-white rounded-lg text-xs md:text-sm font-medium hover:bg-brand-blue/90 transition-colors"
                  >
                    Register
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
