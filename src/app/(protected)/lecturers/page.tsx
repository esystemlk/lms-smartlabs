"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/userService";
import { UserData } from "@/lib/types";
import { Mail, Phone, MapPin, Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";
import Image from "next/image";

export default function LecturersPage() {
  const { userData } = useAuth();
  const [lecturers, setLecturers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLecturers();
  }, []);

  const fetchLecturers = async () => {
    try {
      setLoading(true);
      const data = await userService.getLecturers();
      setLecturers(data);
    } catch (error) {
      console.error("Error fetching lecturers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLecturers = lecturers.filter(lecturer => 
    lecturer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lecturer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Lecturers</h1>
          <p className="text-xs md:text-base text-gray-500">Meet our expert instructors.</p>
        </div>
        
        <div className="w-full md:w-72">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
            <input
              type="text"
              placeholder="Search lecturers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all text-xs md:text-sm"
            />
          </div>
        </div>
      </div>

      {filteredLecturers.length === 0 ? (
        <div className="text-center py-8 md:py-12 bg-white rounded-xl md:rounded-2xl border border-gray-100">
          <p className="text-gray-500 text-sm md:text-base">No lecturers found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {filteredLecturers.map((lecturer) => (
            <div key={lecturer.uid} className="bg-white p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:border-brand-blue/30 transition-colors group">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gray-100 mb-2 md:mb-4 overflow-hidden relative border-2 border-white shadow-sm">
                {lecturer.photoURL ? (
                  <Image 
                    src={lecturer.photoURL} 
                    alt={lecturer.name} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl md:text-2xl font-bold text-gray-400 bg-gray-50">
                    {lecturer.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-0.5 md:mb-1">{lecturer.name}</h3>
              <p className="text-xs md:text-sm text-brand-blue font-medium mb-3 md:mb-4 capitalize">{lecturer.role}</p>
              
              <div className="w-full space-y-2 md:space-y-3 text-xs md:text-sm text-gray-500">
                <div className="flex items-center justify-center gap-1.5 md:gap-2">
                  <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  <span className="truncate max-w-[200px]">{lecturer.email}</span>
                </div>
                {lecturer.contact && (
                  <div className="flex items-center justify-center gap-1.5 md:gap-2">
                    <Phone className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>{lecturer.contact}</span>
                  </div>
                )}
                {lecturer.country && (
                  <div className="flex items-center justify-center gap-1.5 md:gap-2">
                    <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>{lecturer.country}</span>
                  </div>
                )}
              </div>

              {lecturer.bio && (
                <p className="mt-3 md:mt-4 text-xs md:text-sm text-gray-600 line-clamp-2">
                  {lecturer.bio}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
