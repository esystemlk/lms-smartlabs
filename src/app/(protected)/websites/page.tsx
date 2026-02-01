"use client";

import React, { useEffect, useState } from 'react';
import { ExternalLink, Globe, Loader2, ArrowRight, ShieldCheck, Monitor, Layout, Sparkles } from 'lucide-react';
import { websiteService, Website } from '@/services/websiteService';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

export default function WebsitesPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);

  const STATIC_WEBSITES: Website[] = [
    {
      id: 'main-site',
      name: 'Smart Labs Main',
      url: 'https://www.smartlabs.lk',
      description: 'The central hub for Smart Labs. Access news, updates, and general information about our educational ecosystem.',
      category: 'Official',
      createdAt: new Date()
    },
    {
      id: 'register-site',
      name: 'Class Registration',
      url: 'https://register.smartlabs.lk',
      description: 'Your gateway to learning. Register for individual classes, manage sessions, and track your educational journey.',
      category: 'Portal',
      createdAt: new Date()
    }
  ];

  useEffect(() => {
    loadWebsites();
  }, []);

  const loadWebsites = async () => {
    try {
      const data = await websiteService.getWebsites();
      setWebsites([...STATIC_WEBSITES, ...data]);
    } catch (error) {
      console.error("Failed to load websites", error);
      setWebsites(STATIC_WEBSITES);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-blue" />
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue to-cyan-600 p-8 md:p-12 text-white shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs font-bold uppercase tracking-wider mb-4">
            <Globe size={12} />
            Smart Labs Ecosystem
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight">
            Our Digital Network
          </h1>
          <p className="text-blue-100 text-sm md:text-lg leading-relaxed max-w-xl">
            Explore our interconnected platforms designed to enhance your learning experience. 
            From class registration to main updates, everything is just a click away.
          </p>
        </div>
      </div>

      {/* Websites Grid */}
      {websites.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900">No websites listed</h3>
          <p className="text-gray-500">Check back soon for our network updates.</p>
        </div>
      ) : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        >
          {websites.map((site) => (
            <motion.a 
              key={site.id} 
              href={site.url} 
              target="_blank" 
              rel="noopener noreferrer"
              variants={item}
              className="block group h-full"
            >
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 h-full flex flex-col relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-800 rounded-bl-[100px] -z-0 group-hover:scale-110 transition-transform duration-500"></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className={`p-3 rounded-2xl ${
                      site.id === 'main-site' ? 'bg-blue-50 text-brand-blue dark:bg-blue-900/20 dark:text-blue-300' :
                      site.id === 'register-site' ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300' :
                      'bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {site.id === 'main-site' ? <Layout size={24} /> :
                       site.id === 'register-site' ? <ShieldCheck size={24} /> :
                       <Monitor size={24} />}
                    </div>
                    <div className="p-2 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-400 group-hover:bg-brand-blue group-hover:text-white transition-colors">
                      <ExternalLink size={16} />
                    </div>
                  </div>

                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-brand-blue transition-colors">
                      {site.name}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">
                      {site.description}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50 dark:border-gray-700/50">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      site.category === 'Official' ? 'bg-blue-50 text-brand-blue border border-blue-100' :
                      site.category === 'Portal' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                      'bg-gray-50 text-gray-600 border border-gray-200'
                    }`}>
                      <Sparkles size={10} />
                      {site.category || 'Website'}
                    </span>
                    
                    <span className="text-xs font-semibold text-brand-blue flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                      Visit Site <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </motion.div>
      )}
    </div>
  );
}
