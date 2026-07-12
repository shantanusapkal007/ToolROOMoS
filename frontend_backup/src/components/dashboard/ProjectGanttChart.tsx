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
    return <div className="h-64 flex items-center justify-center text-[var(--text-tertiary)] animate-pulse">Loading Timeline...</div>;
  }

  if (!projects || projects.length === 0) {
    return <div className="h-64 flex items-center justify-center text-[var(--text-tertiary)]">No active projects to display on timeline.</div>;
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
      case 'PRODUCTION': return 'bg-[var(--color-brand)] border-[var(--color-brand)]/50 text-white shadow-[var(--shadow-glow)]';
      case 'ENGINEERING': return 'bg-[var(--color-info)] border-[var(--color-info)]/50 text-white shadow-[var(--shadow-glow)]';
      case 'DISPATCH_READY': return 'bg-[var(--color-success)] border-[var(--color-success)]/50 text-white shadow-[var(--shadow-glow)]';
      default: return 'bg-[var(--hover-600)] border-[var(--border-500)] text-[var(--text-secondary)]';
    }
  };

  return (
    <div className="bg-[var(--bg-panel)]/50 backdrop-blur-xl border border-[var(--border-500)] rounded-[var(--radius-2xl)] overflow-hidden flex flex-col h-[400px]">
      <div className="p-[var(--space-4)] border-b border-[var(--border-500)] bg-[var(--hover-600)] flex justify-between items-center shrink-0">
        <h2 className="text-body font-bold text-[var(--text-primary)] tracking-widest uppercase flex items-center">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)] animate-pulse mr-[var(--space-2)]"></span>
          Master Production Timeline
        </h2>
      </div>

      <div className="flex-1 overflow-auto relative hide-scrollbar" ref={containerRef}>
        {/* Timeline Header (Months) */}
        <div className="sticky top-0 z-10 flex bg-[var(--bg-canvas)] border-b border-[var(--border-500)]" style={{ width: `${MONTHS.length * DAYS_IN_MONTH * DAY_WIDTH}px` }}>
          <div className="w-48 shrink-0 sticky left-0 z-20 bg-[var(--bg-canvas)] border-r border-[var(--border-500)] p-[var(--space-2)] font-bold text-caption text-[var(--text-tertiary)] flex items-center">
            Project
          </div>
          {MONTHS.map((month, idx) => (
            <div key={idx} className="flex-shrink-0 text-center text-caption font-bold text-[var(--text-tertiary)] uppercase tracking-widest py-[var(--space-2)] border-r border-[var(--border-500)]" style={{ width: `${DAYS_IN_MONTH * DAY_WIDTH}px` }}>
              {month}
            </div>
          ))}
        </div>

        {/* Timeline Body (Projects) */}
        <div className="relative" style={{ width: `${MONTHS.length * DAYS_IN_MONTH * DAY_WIDTH}px` }}>
          {/* Grid lines */}
          <div className="absolute inset-0 flex pointer-events-none z-0 ml-48">
             {Array.from({ length: MONTHS.length }).map((_, i) => (
               <div key={i} className="border-r border-[var(--border-500)] h-full" style={{ width: `${DAYS_IN_MONTH * DAY_WIDTH}px` }}></div>
             ))}
          </div>

          <div className="relative z-10">
            {projects.map((project: any, index: number) => {
              // We'll use createdAt as start and targetDeliveryDate as end for visualization
              const { left, width } = getPositionAndWidth(project.createdAt, project.targetDeliveryDate);
              
              return (
                <div key={project.id} className="flex group border-b border-[var(--border-500)] hover:bg-[var(--hover-600)] transition-colors relative">
                  
                  {/* Pinned Left Column (Project Name) */}
                  <div className="w-48 shrink-0 sticky left-0 z-20 bg-[var(--bg-panel)]/90 backdrop-blur-sm border-r border-[var(--border-500)] p-[var(--space-3)] flex flex-col justify-center">
                    <span className="text-caption font-bold text-[var(--text-primary)] truncate group-hover:text-[var(--color-info)] transition-colors">{project.projectNumber}</span>
                    <span className="text-micro text-[var(--text-tertiary)] truncate">{project.partName}</span>
                  </div>

                  {/* Gantt Bar Area */}
                  <div className="relative flex-1 h-16 py-[var(--space-3)]">
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width, opacity: 1 }}
                      transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
                      className={`absolute h-8 rounded-[var(--radius-lg)] border flex items-center px-[var(--space-3)] overflow-hidden cursor-pointer ${getStatusColor(project.currentStage)}`}
                      style={{ left: `${left}px` }}
                    >
                      <span className="text-micro font-bold truncate z-10 whitespace-nowrap mix-blend-plus-lighter">
                        {project.currentStage}
                      </span>
                      {/* Glass glare effect inside bar */}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none"></div>
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
