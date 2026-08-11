"use client";

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useProjects } from '../../hooks/useProjects';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_IN_MONTH = 30;
const DAY_WIDTH = 12;

export const ProjectGanttChart = () => {
  const { data: projects, isLoading } = useProjects();
  const containerRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center text-mute text-body-sm animate-pulse">Loading Timeline...</div>;
  }

  if (!projects || projects.length === 0) {
    return <div className="h-64 flex items-center justify-center text-mute text-body-sm">No active projects to display on timeline.</div>;
  }

  const currentYear = new Date().getFullYear();
  const timelineStart = new Date(currentYear, 0, 1);

  const getPositionAndWidth = (startStr: string, endStr: string) => {
    const start = startStr ? new Date(startStr) : new Date();
    const end = endStr ? new Date(endStr) : new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);

    const daysFromStart = Math.max(0, (start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24));
    const durationDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return {
      left: daysFromStart * DAY_WIDTH,
      width: durationDays * DAY_WIDTH
    };
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'PRODUCTION': return 'bg-canvas border-hairline text-accent-purple shadow-level-1';
      case 'ENGINEERING': return 'bg-canvas border-hairline text-accent-blue-info shadow-level-1';
      case 'DISPATCH_READY': return 'bg-canvas border-hairline text-accent-green shadow-level-1';
      default: return 'bg-canvas border-hairline text-body shadow-level-1';
    }
  };

  return (
    <div className="bg-canvas border border-hairline rounded-md overflow-hidden flex flex-col h-[400px] shadow-level-1">
      <div className="p-4 border-b border-hairline bg-canvas flex justify-between items-center shrink-0">
        <h2 className="text-display-xs font-medium text-ink flex items-center">
          <span className="w-2 h-2 rounded-full bg-accent-green mr-2"></span>
          Master Production Timeline
        </h2>
      </div>

      <div className="flex-1 overflow-auto relative hide-scrollbar" ref={containerRef}>
        {/* Timeline Header */}
        <div className="sticky top-0 z-10 flex bg-canvas border-b border-hairline" style={{ width: `${MONTHS.length * DAYS_IN_MONTH * DAY_WIDTH}px` }}>
          <div className="w-48 shrink-0 sticky left-0 z-20 bg-canvas border-r border-hairline p-2.5 font-medium text-eyebrow-uppercase-sm text-mute uppercase flex items-center">
            Project
          </div>
          {MONTHS.map((month, idx) => (
            <div key={idx} className="flex-shrink-0 text-center text-eyebrow-uppercase-sm font-medium text-mute uppercase py-2.5 border-r border-hairline/40" style={{ width: `${DAYS_IN_MONTH * DAY_WIDTH}px` }}>
              {month}
            </div>
          ))}
        </div>

        {/* Timeline Body */}
        <div className="relative" style={{ width: `${MONTHS.length * DAYS_IN_MONTH * DAY_WIDTH}px` }}>
          <div className="absolute inset-0 flex pointer-events-none z-0 ml-48">
             {Array.from({ length: MONTHS.length }).map((_, i) => (
               <div key={i} className="border-r border-hairline/20 h-full" style={{ width: `${DAYS_IN_MONTH * DAY_WIDTH}px` }}></div>
             ))}
          </div>

          <div className="relative z-10">
            {projects.map((project: any, index: number) => {
              const { left, width } = getPositionAndWidth(project.createdAt, project.targetDeliveryDate);
              
              return (
                <div key={project.id} className="flex group border-b border-hairline/40 hover:bg-hairline/15 transition-colors relative">
                  
                  {/* Pinned Left Column */}
                  <div className="w-48 shrink-0 sticky left-0 z-20 bg-canvas border-r border-hairline p-3 flex flex-col justify-center">
                    <span className="text-body-sm-strong text-ink truncate group-hover:text-accent-blue-info transition-colors">{project.projectNumber}</span>
                    <span className="text-caption text-mute truncate">{project.partName}</span>
                  </div>

                  {/* Gantt Bar Area */}
                  <div className="relative flex-1 h-16 py-3">
                    <motion.div 
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width, opacity: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
                      className={`absolute h-8 rounded-sm border flex items-center px-3 overflow-hidden cursor-pointer ${getStatusColor(project.currentStage)}`}
                      style={{ left: `${left}px` }}
                    >
                      <span className="text-caption font-medium truncate z-10 whitespace-nowrap">
                        {project.currentStage}
                      </span>
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
