"use client";

import { useState, useEffect } from "react";
import { notificationService, Notification, NotificationType, NotificationPriority } from "@/services/notificationService";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Trash2, Bell, AlertTriangle, FileText, Info, Megaphone, Pin, PinOff, Link2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/components/ui/Toast";
import { clsx } from "clsx";

const ROLE_OPTIONS = [
  { value: "student", label: "Students" },
  { value: "lecturer", label: "Lecturers" },
  { value: "admin", label: "Admins" },
];

const PRIORITY_OPTIONS: { value: NotificationPriority; label: string; dot: string }[] = [
  { value: "info", label: "Info", dot: "bg-blue-500" },
  { value: "success", label: "Success", dot: "bg-emerald-500" },
  { value: "warning", label: "Warning", dot: "bg-amber-500" },
  { value: "critical", label: "Critical", dot: "bg-red-500" },
];

export function NotificationManager() {
  const { userData } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("general");
  const [priority, setPriority] = useState<NotificationPriority>("info");
  const [link, setLink] = useState("");
  const [pinned, setPinned] = useState(true);
  const [targetRoles, setTargetRoles] = useState<string[]>(["student", "lecturer", "admin"]);

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

  const toggleRole = (role: string) => {
    setTargetRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setType("general");
    setPriority("info");
    setLink("");
    setPinned(true);
    setTargetRoles(["student", "lecturer", "admin"]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;
    if (targetRoles.length === 0) {
      toast("Select at least one audience", "error");
      return;
    }

    setSubmitting(true);
    try {
      await notificationService.createNotification({
        title,
        message,
        type,
        priority,
        link: link.trim() || undefined,
        pinned,
        active: true,
        createdBy: userData?.uid,
        targetRoles,
      });

      toast("Announcement published", "success");
      resetForm();
      fetchNotifications();
    } catch (error) {
      console.error("Error creating notification:", error);
      toast("Failed to publish announcement", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      await notificationService.deleteNotification(id);
      toast("Announcement deleted", "success");
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
      toast("Failed to delete", "error");
    }
  };

  const toggleActive = async (note: Notification) => {
    const next = note.active === false;
    try {
      await notificationService.updateNotification(note.id, { active: next });
      setNotifications((prev) => prev.map((n) => (n.id === note.id ? { ...n, active: next } : n)));
    } catch {
      toast("Failed to update", "error");
    }
  };

  const togglePinned = async (note: Notification) => {
    const next = !note.pinned;
    try {
      await notificationService.updateNotification(note.id, { pinned: next });
      setNotifications((prev) => prev.map((n) => (n.id === note.id ? { ...n, pinned: next } : n)));
    } catch {
      toast("Failed to update", "error");
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case "maintenance":
        return <AlertTriangle size={16} className="text-amber-500" />;
      case "course_material":
        return <FileText size={16} className="text-blue-500" />;
      case "general":
        return <Megaphone size={16} className="text-brand-blue" />;
      default:
        return <Info size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
          <Megaphone className="text-brand-blue" />
          Publish an Announcement
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          Reaches the Notice Board for everyone. Pinned announcements also appear as a dismissible banner at the top of the app.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                placeholder="e.g. Holiday schedule update"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NotificationType)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
              >
                <option value="general">General Announcement</option>
                <option value="system">System Update</option>
                <option value="maintenance">Maintenance</option>
                <option value="course_material">Course Material</option>
                <option value="assignment">Assignment</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 h-24"
              placeholder="Enter the details students will read..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority / Colour</label>
              <div className="flex flex-wrap gap-2">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setPriority(p.value)}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                      priority === p.value
                        ? "border-brand-blue bg-blue-50 dark:bg-blue-900/30 text-brand-blue"
                        : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-brand-blue/50"
                    )}
                  >
                    <span className={clsx("w-2.5 h-2.5 rounded-full", p.dot)} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <Link2 size={14} /> Optional link (e.g. /lms/timetable)
              </label>
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/20"
                placeholder="/lms/recordings"
              />
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audience</label>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => toggleRole(r.value)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
                    targetRoles.includes(r.value)
                      ? "border-brand-blue bg-blue-50 dark:bg-blue-900/30 text-brand-blue"
                      : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-brand-blue/50"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 rounded accent-brand-blue"
              />
              Pin as a dismissible banner at the top of the app
            </label>
            <Button type="submit" disabled={submitting} className="flex items-center gap-2">
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <Megaphone size={16} />}
              Publish
            </Button>
          </div>
        </form>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Published Announcements</h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-gray-400" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No announcements yet.</p>
        ) : (
          <div className="grid gap-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={clsx(
                  "bg-white dark:bg-gray-800 p-4 rounded-xl border flex flex-col sm:flex-row items-start justify-between group hover:shadow-md transition-all gap-4",
                  n.active === false ? "border-gray-100 dark:border-gray-700 opacity-60" : "border-gray-100 dark:border-gray-700"
                )}
              >
                <div className="flex gap-3 min-w-0">
                  <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg flex-shrink-0">{getTypeIcon(n.type)}</div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">{n.title}</h4>
                      {n.pinned && (
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Pin size={10} /> Banner
                        </span>
                      )}
                      {n.active === false && (
                        <span className="text-[10px] font-bold bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words">{n.message}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>{n.createdAt?.seconds ? format(new Date(n.createdAt.seconds * 1000), "MMM d, yyyy h:mm a") : "Just now"}</span>
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 capitalize">
                        {n.type.replace("_", " ")}
                      </span>
                      {n.targetRoles && n.targetRoles.length > 0 && (
                        <span className="text-gray-400">→ {n.targetRoles.join(", ")}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 self-end sm:self-start">
                  <button
                    onClick={() => togglePinned(n)}
                    className="text-gray-400 hover:text-brand-blue p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    title={n.pinned ? "Unpin banner" : "Pin as banner"}
                  >
                    {n.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                  </button>
                  <button
                    onClick={() => toggleActive(n)}
                    className="text-gray-400 hover:text-amber-500 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    title={n.active === false ? "Show to users" : "Hide from users"}
                  >
                    {n.active === false ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="text-red-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={16} />
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
