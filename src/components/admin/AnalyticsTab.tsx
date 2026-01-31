import { UserData, Course } from "@/lib/types";

interface AnalyticsTabProps {
  users: UserData[];
  courses: Course[];
}

export function AnalyticsTab({ users, courses }: AnalyticsTabProps) {
  // Compute Role Distribution
  const roles = ["student", "lecturer", "admin", "developer"];
  const roleCounts = roles.map(role => ({
    role,
    count: users.filter(u => u.role === role).length,
    percentage: (users.filter(u => u.role === role).length / users.length) * 100
  }));

  // Compute Top Courses (by lessons count for now as we don't have enrollment data in course object)
  const sortedCourses = [...courses].sort((a, b) => b.lessonsCount - a.lessonsCount).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role Distribution */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">User Roles Distribution</h3>
          <div className="space-y-4">
            {roleCounts.map((item) => (
              <div key={item.role}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium capitalize text-gray-700">{item.role}</span>
                  <span className="text-gray-500">{item.count} ({Math.round(item.percentage)}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-blue rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Course Content Stats */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Top Courses by Content</h3>
          <div className="space-y-4">
            {sortedCourses.map((course) => {
              const maxLessons = Math.max(...courses.map(c => c.lessonsCount));
              const percentage = (course.lessonsCount / maxLessons) * 100;
              
              return (
                <div key={course.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700 truncate max-w-[200px]">{course.title}</span>
                    <span className="text-gray-500">{course.lessonsCount} Lessons</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
