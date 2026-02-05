
import { Activity, Server, Database, Cloud, Wifi, CheckCircle, AlertTriangle, XCircle, Cpu } from "lucide-react";
import { clsx } from "clsx";

export function SystemStatus() {
  const services = [
    { name: "Authentication", status: "operational", icon: Activity },
    { name: "Database (Firestore)", status: "operational", icon: Database },
    { name: "Storage (Bunny.net)", status: "operational", icon: Cloud },
    { name: "Hosting (Vercel)", status: "operational", icon: Server },
  ];

  const metrics = [
    { label: "Server Load", value: "24%", change: "-2%", trend: "down" },
    { label: "Memory Usage", value: "1.2GB", change: "+5%", trend: "up" },
    { label: "Active Connections", value: "843", change: "+12%", trend: "up" },
    { label: "Avg. Response Time", value: "142ms", change: "-8ms", trend: "down" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Service Health */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Wifi className="w-5 h-5 text-brand-blue" />
          System Health
        </h3>
        <div className="space-y-4">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-gray-600 rounded-lg text-gray-500 dark:text-gray-300 shadow-sm">
                  <service.icon size={18} />
                </div>
                <span className="font-medium text-gray-700 dark:text-gray-200">{service.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Operational
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-500" />
          Performance Metrics
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {metrics.map((metric) => (
            <div key={metric.label} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mb-1">{metric.label}</p>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</span>
                <span className={clsx(
                  "text-xs font-medium mb-1",
                  metric.trend === 'down' ? 'text-green-600' : 'text-amber-600'
                )}>
                  {metric.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Simulated Load Graph */}
        <div className="h-40 flex items-end justify-between gap-1 px-2">
          {[...Array(30)].map((_, i) => {
            const height = 20 + Math.random() * 60; // 20-80%
            return (
              <div 
                key={i} 
                className="w-full bg-brand-blue/20 dark:bg-brand-blue/10 rounded-t-sm transition-all duration-500 hover:bg-brand-blue/40"
                style={{ height: `${height}%` }}
              ></div>
            )
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2 px-2">
          <span>30 mins ago</span>
          <span>Live</span>
        </div>
      </div>
    </div>
  );
}
