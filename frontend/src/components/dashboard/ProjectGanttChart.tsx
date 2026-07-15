"use client";

import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useProjects } from '../../hooks/useProjects';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_IN_MONTH = 30; // Approximation for visualization
const DAY_WIDTH = 12; // Pixels per day

export const ProjectGanttChart = () => {
  const { data: projects, isLoading } = useProjects();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll logic for sticky headers or parallax if desired
  // Removed useScroll as it was unused and caused hydration errors when container is not rendered


  if (isLoading) {
    return <div className="h-64 flex items-center justify-center text-slate-500 animate-pulse">Loading Timeline...</div>;
  }

  if (!projects || projects.length === 0) {
    return <div className="h-64 flex items-center justify-center text-slate-500">No active projects to display on timeline.</div>;
  }

  // Base date for start of timeline (Let's say start of current year)
  const currentYear = new Date().getFullYear();
  const timelineStart = new Date(currentYear, 0, 1);

  const getPositionAndWidth = (startStr: string, endStr: string) => {
    const start = startStr ? new Date(startStr) : new Date();
    const end = endStr ? new Date(endStr) : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000); // Default 14 days if no end

    const daysFromStart = Math.max(0, (start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const durationDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return {
      left: daysFromStart * DAY_WIDTH,
      width: durationDays * DAY_WIDTH
    };
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PRODUCTION': return 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm';
      case 'ENGINEERING': return 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm';
      case 'DISPATCH_READY': return 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm';
      default: return 'bg-zinc-50 border-zinc-200 text-zinc-700 shadow-sm';
    }
  };

  return (
    <div className="bg-[#F4F4F6]/50 backdrop-blur-xl border border-black/10 rounded-2xl overflow-hidden flex flex-col h-[400px]">
      <div className="p-4 border-b border-black/10 bg-black/5 flex justify-between items-center shrink-0">
        <h2 className="text-sm font-bold text-zinc-900 tracking-widest uppercase flex items-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
          Master Production Timeline
        </h2>
      </div>

      <div className="flex-1 overflow-auto relative hide-scrollbar" ref={containerRef}>
        {/* Timeline Header (Months) */}
        <div className="sticky top-0 z-10 flex bg-[#FBFBFC] border-b border-black/10" style={{ width: `${MONTHS.length * DAYS_IN_MONTH * DAY_WIDTH}px` }}>
          <div className="w-48 shrink-0 sticky left-0 z-20 bg-[#FBFBFC] border-r border-black/10 p-2 font-bold text-xs text-slate-500 flex items-center">
            Project
          </div>
          {MONTHS.map((month, idx) => (
            <div key={idx} className="flex-shrink-0 text-center text-xs font-bold text-slate-500 uppercase tracking-widest py-2 border-r border-black/5" style={{ width: `${DAYS_IN_MONTH * DAY_WIDTH}px` }}>
              {month}
            </div>
          ))}
        </div>

        {/* Timeline Body (Projects) */}
        <div className="relative" style={{ width: `${MONTHS.length * DAYS_IN_MONTH * DAY_WIDTH}px` }}>
          {/* Grid lines */}
          <div className="absolute inset-0 flex pointer-events-none z-0 ml-48">
             {Array.from({ length: MONTHS.length }).map((_, i) => (
               <div key={i} className="border-r border-black/10/[0.03] h-full" style={{ width: `${DAYS_IN_MONTH * DAY_WIDTH}px` }}></div>
             ))}
          </div>

          <div className="relative z-10">
            {projects.map((project: any, index: number) => {
              // We'll use createdAt as start and targetDeliveryDate as end for visualization
              const { left, width } = getPositionAndWidth(project.createdAt, project.targetDeliveryDate);
              
              return (
                <div key={project.id} className="flex group border-b border-black/10/[0.02] hover:bg-black/[0.02] transition-colors relative">
                  
                  {/* Pinned Left Column (Project Name) */}
                  <div className="w-48 shrink-0 sticky left-0 z-20 bg-[#F4F4F6]/90 backdrop-blur-sm border-r border-black/10 p-3 flex flex-col justify-center">
                    <span className="text-xs font-bold text-zinc-900 truncate group-hover:text-blue-600 transition-colors">{project.projectNumber}</span>
                    <span className="text-[10px] text-slate-500 truncate">{project.partName}</span>
                  </div>

                  {/* Gantt Bar Area */}
                  <div className="relative flex-1 h-16 py-3">
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width, opacity: 1 }}
                      transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                      className={`absolute h-8 rounded-lg border flex items-center px-3 overflow-hidden cursor-pointer ${getStatusColor(project.currentStage)}`}
                      style={{ left: `${left}px` }}
                    >
                      <span className="text-[10px] font-black truncate z-10 whitespace-nowrap">
                        {project.currentStage}
                      </span>
                      {/* Glass glare effect inside bar */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent"></div>
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
