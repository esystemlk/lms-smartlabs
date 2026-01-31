"use client";

import React, { useEffect, useState } from 'react';
import { ExternalLink, Globe, Loader2 } from 'lucide-react';
import { websiteService, Website } from '@/services/websiteService';

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWebsites();
  }, []);

  const loadWebsites = async () => {
    try {
      const data = await websiteService.getWebsites();
      setWebsites(data);
    } catch (error) {
      console.error("Failed to load websites", error);
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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Our Websites</h1>
      
      {websites.length === 0 ? (
        <div className="text-center py-12 md:py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <Globe className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-base md:text-lg font-medium text-gray-900">No websites listed</h3>
          <p className="text-sm md:text-base text-gray-500">Check back soon for our network updates.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {websites.map((site) => (
            <a 
              key={site.id} 
              href={site.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all h-full flex flex-col">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-brand-blue rounded-lg group-hover:bg-brand-blue group-hover:text-white transition-colors">
                      <Globe className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-brand-blue transition-colors">
                      {site.name}
                    </h2>
                  </div>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-brand-blue transition-colors" />
                </div>
                <p className="text-gray-500 line-clamp-2 mb-4 flex-1">{site.description}</p>
                {site.category && (
                  <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium w-fit">
                    {site.category}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
