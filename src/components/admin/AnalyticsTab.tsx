import { UserData, Course, Enrollment } from "@/lib/types";
import { DollarSign, Users, TrendingUp, BookOpen, Activity } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, isSameMonth } from "date-fns";
import { SystemStatus } from "./SystemStatus";

interface AnalyticsTabProps {
  users: UserData[];
  courses: Course[];
  enrollments: Enrollment[];
}

export function AnalyticsTab({ users, courses, enrollments }: AnalyticsTabProps) {
  // 1. Calculate Total Revenue
  const totalRevenue = enrollments.reduce((sum, e) => sum + (e.amount || 0), 0);

  // 2. Calculate Active Students
  const activeStudents = users.filter(u => u.role === 'student').length;

  // 3. Calculate Monthly Revenue (Last 6 Months)
  const today = new Date();
  const last6Months = eachMonthOfInterval({
    start: subMonths(today, 5),
    end: today
  });

  const revenueData = last6Months.map(month => {
    const monthlyEnrollments = enrollments.filter(e => {
      if (!e.enrolledAt) return false;
      // Handle Firestore Timestamp or Date
      const date = e.enrolledAt.toDate ? e.enrolledAt.toDate() : new Date(e.enrolledAt);
      return isSameMonth(date, month);
    });

    return {
      month: format(month, "MMM"),
      revenue: monthlyEnrollments.reduce((sum, e) => sum + (e.amount || 0), 0),
      count: monthlyEnrollments.length
    };
  });

  const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1000); // Avoid division by zero

  // 4. Calculate Top Courses by Enrollment
  const courseEnrollmentCounts: Record<string, number> = {};
  enrollments.forEach(e => {
    courseEnrollmentCounts[e.courseId] = (courseEnrollmentCounts[e.courseId] || 0) + 1;
  });

  const popularCourses = [...courses]
    .map(c => ({
      ...c,
      enrollmentCount: courseEnrollmentCounts[c.id] || 0
    }))
    .sort((a, b) => b.enrollmentCount - a.enrollmentCount)
    .slice(0, 5);

  // 5. Role Distribution
  const roles = ["student", "lecturer", "admin", "developer"];
  const roleCounts = roles.map(role => ({
    role,
    count: users.filter(u => u.role === role).length,
    percentage: users.length > 0 ? (users.filter(u => u.role === role).length / users.length) * 100 : 0
  }));

  return (
    <div className="space-y-8">
      {/* System Status Section (New) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">System Status & Performance</h2>
          <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded">v1.2.0-stable</span>
        </div>
        <SystemStatus />
      </section>

      <div className="h-px bg-gray-200" />

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                LKR {totalRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-green-600">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="flex items-center text-sm text-green-600">
            <TrendingUp size={16} className="mr-1" />
            <span className="font-medium">Lifetime Earnings</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Enrollments</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {enrollments.length}
              </h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <BookOpen size={20} />
            </div>
          </div>
           <div className="flex items-center text-sm text-blue-600">
            <Activity size={16} className="mr-1" />
            <span className="font-medium">Course Sales</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Students</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {activeStudents}
              </h3>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <Users size={20} />
            </div>
          </div>
           <div className="flex items-center text-sm text-purple-600">
            <Users size={16} className="mr-1" />
            <span className="font-medium">Registered Learners</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Completion Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                0%
              </h3>
            </div>
            <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
              <Activity size={20} />
            </div>
          </div>
          <div className="flex items-center text-sm text-gray-400">
            <span>Tracking coming soon</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Revenue Trend (Last 6 Months)</h3>
          <div className="flex items-end justify-between h-64 gap-4">
            {revenueData.map((data, index) => (
              <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                <div className="relative w-full flex items-end justify-center h-full">
                   <div 
                    className="w-full bg-brand-blue/10 group-hover:bg-brand-blue/20 rounded-t-lg transition-all duration-300 relative"
                    style={{ height: `${(data.revenue / maxRevenue) * 100}%` }}
                  >
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        LKR {data.revenue.toLocaleString()}
                     </div>
                  </div>
                   <div 
                    className="absolute bottom-0 w-full bg-brand-blue rounded-t-lg transition-all duration-500"
                    style={{ height: `${(data.revenue / maxRevenue) * 100}%`, opacity: 0.6 }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-500">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Courses */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Most Popular Courses</h3>
          <div className="space-y-5">
            {popularCourses.map((course) => {
              const maxEnrollments = Math.max(...popularCourses.map(c => c.enrollmentCount), 1);
              const percentage = (course.enrollmentCount / maxEnrollments) * 100;
              
              return (
                <div key={course.id}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700 truncate max-w-[200px]">{course.title}</span>
                    <span className="text-gray-500 font-medium">{course.enrollmentCount} Enrollments</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
             {popularCourses.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                    No enrollment data available yet.
                </div>
            )}
          </div>
        </div>
      </div>

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

        {/* System Health (Mock for now but structured for future real data) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">System Health Status</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-medium text-green-700">Database (Firestore)</span>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-white px-2 py-1 rounded-md shadow-sm">OPERATIONAL</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-medium text-green-700">Authentication</span>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-white px-2 py-1 rounded-md shadow-sm">OPERATIONAL</span>
                </div>
                 <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-medium text-green-700">Storage (Bucket)</span>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-white px-2 py-1 rounded-md shadow-sm">OPERATIONAL</span>
                </div>
                 <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="font-medium text-green-700">Video CDN (Bunny.net)</span>
                    </div>
                    <span className="text-xs font-bold text-green-600 bg-white px-2 py-1 rounded-md shadow-sm">OPERATIONAL</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}