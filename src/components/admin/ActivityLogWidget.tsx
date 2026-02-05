"use client";

import { useEffect, useState } from "react";
import { ActivityLog } from "@/lib/types";
import { activityLogService } from "@/services/activityLogService";
import { formatDistanceToNow } from "date-fns";
import { 
  Activity, 
  User, 
  BookOpen, 
  CreditCard, 
  Settings, 
  ShieldAlert,
  Clock
} from "lucide-react";

export function ActivityLogWidget() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await activityLogService.getRecentActivities(10);
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case "user": return <User className="w-4 h-4 text-blue-500" />;
      case "course": return <BookOpen className="w-4 h-4 text-purple-500" />;
      case "enrollment": return <CreditCard className="w-4 h-4 text-green-500" />;
      case "system": return <Settings className="w-4 h-4 text-gray-500" />;
      default: return <Activity className="w-4 h-4 text-orange-500" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-500" />
          Recent Activity
        </h3>
        <button 
          onClick={fetchLogs} 
          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No recent activity recorded.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-3 items-start group">
              <div className="mt-1 p-2 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                {getIcon(log.entityType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {log.action.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                  <span className="font-medium text-gray-700">{log.performedByName}</span> {log.details}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] text-gray-400">
                    {log.createdAt?.seconds ? formatDistanceToNow(new Date(log.createdAt.seconds * 1000), { addSuffix: true }) : 'Just now'}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full capitalize ${
                    log.performedByRole === 'admin' ? 'bg-purple-100 text-purple-700' :
                    log.performedByRole === 'developer' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {log.performedByRole}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
