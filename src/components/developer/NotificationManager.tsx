"use client";

import { useState, useEffect } from "react";
import { notificationService, Notification, NotificationType } from "@/services/notificationService";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Trash2, Bell, AlertTriangle, FileText, Info, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/Toast";

export function NotificationManager() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("system");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationService.getAllNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setSubmitting(true);
    try {
      await notificationService.createNotification({
        title,
        message,
        type,
        createdBy: userData?.uid,
        targetRoles: ['student', 'lecturer', 'admin'] // Default to all for now
      });
      
      toast("Notification sent successfully", "success");
      setTitle("");
      setMessage("");
      setType("system");
      fetchNotifications();
    } catch (error) {
      console.error("Error creating notification:", error);
      toast("Failed to send notification", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    
    try {
      await notificationService.deleteNotification(id);
      toast("Notification deleted", "success");
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast("Failed to delete notification", "error");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'course_material': return <FileText size={16} className="text-blue-500" />;
      case 'system': return <Info size={16} className="text-gray-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="text-brand-blue" />
          Send New Notification
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                placeholder="e.g. System Maintenance"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              >
                <option value="system">System Update</option>
                <option value="maintenance">Maintenance</option>
                <option value="course_material">Course Material</option>
                <option value="general">General Announcement</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 h-24"
              placeholder="Enter notification details..."
              required
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting} className="flex items-center gap-2">
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <Bell size={16} />}
              Send Notification
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Recent Notifications</h3>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No notifications sent yet.</p>
        ) : (
          <div className="grid gap-3">
            {notifications.map((notification) => (
              <div key={notification.id} className="bg-white p-4 rounded-xl border border-gray-100 flex flex-col sm:flex-row items-start justify-between group hover:shadow-md transition-all gap-4">
                <div className="flex gap-3">
                  <div className="mt-1 p-2 bg-gray-50 rounded-lg flex-shrink-0">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{notification.createdAt?.seconds ? format(new Date(notification.createdAt.seconds * 1000), "MMM d, yyyy h:mm a") : 'Just now'}</span>
                      <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600 capitalize">{notification.type.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end w-full sm:w-auto">
                  <button 
                    onClick={() => handleDelete(notification.id)}
                    className="text-red-400 hover:text-red-500 p-2 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                    title="Delete Notification"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
