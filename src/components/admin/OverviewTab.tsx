import { Users, BookOpen, Layers, Activity } from "lucide-react";
import { UserData, Course } from "@/lib/types";

interface OverviewTabProps {
  users: UserData[];
  courses: Course[];
  loading: boolean;
}

export function OverviewTab({ users, courses, loading }: OverviewTabProps) {
  const stats = [
    {
      title: "Total Users",
      value: users.length,
      icon: Users,
      color: "bg-blue-500",
      description: "Registered students & staff"
    },
    {
      title: "Total Courses",
      value: courses.length,
      icon: BookOpen,
      color: "bg-emerald-500",
      description: "Active learning paths"
    },
    {
      title: "Published Courses",
      value: courses.filter(c => c.published).length,
      icon: Layers,
      color: "bg-purple-500",
      description: "Visible to students"
    },
    {
      title: "System Status",
      value: "Online",
      icon: Activity,
      color: "bg-green-500",
      description: "All services operational"
    }
  ];

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.title} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10 text-${stat.color.replace("bg-", "")} text-white`}>
                <stat.icon size={24} className="text-gray-900" /> 
                {/* Note: Tailwind dynamic classes might be tricky, let's fix color logic */}
              </div>
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
            </div>
            <h3 className="text-gray-600 font-medium">{stat.title}</h3>
            <p className="text-sm text-gray-400 mt-1">{stat.description}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users Widget */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Newest Members</h3>
          <div className="space-y-4">
            {users.slice(0, 5).map(user => (
              <div key={user.uid} className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500 overflow-hidden">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user.name?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Courses Widget */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Latest Courses</h3>
          <div className="space-y-4">
            {courses.slice(0, 5).map(course => (
              <div key={course.id} className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 overflow-hidden">
                   {course.image ? (
                     <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                   ) : (
                     <BookOpen size={20} />
                   )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 line-clamp-1">{course.title}</p>
                  <p className="text-xs text-gray-500">{course.lessonsCount} Lessons • {course.published ? "Published" : "Draft"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
