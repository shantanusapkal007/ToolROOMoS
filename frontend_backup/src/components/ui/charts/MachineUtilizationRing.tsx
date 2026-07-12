"use client";

import React, { useState } from 'react';
import { Pie } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleOrdinal } from '@visx/scale';
import { motion, AnimatePresence } from 'framer-motion';

interface MachineData {
  status: string;
  count: number;
  color: string;
  glowHex: string;
}

const data: MachineData[] = [
  { status: 'Running', count: 12, color: 'text-emerald-400', glowHex: '#34d399' },
  { status: 'Idle', count: 4, color: 'text-zinc-400', glowHex: '#a1a1aa' },
  { status: 'Maintenance', count: 2, color: 'text-amber-400', glowHex: '#fbbf24' },
  { status: 'Breakdown', count: 1, color: 'text-red-400', glowHex: '#f87171' },
];

const total = data.reduce((acc, curr) => acc + curr.count, 0);

interface Props {
  width: number;
  height: number;
}

export function MachineUtilizationRing({ width, height }: Props) {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  
  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const radius = Math.min(innerWidth, innerHeight) / 2;
  const centerY = innerHeight / 2;
  const centerX = innerWidth / 2;

  const colorScale = scaleOrdinal<string, string>({
    domain: data.map(d => d.status),
    range: data.map(d => d.glowHex),
  });

  return (
    <div className="relative flex items-center justify-center">
      {/* Dynamic Background Glow based on active segment */}
      <AnimatePresence>
        {activeSegment && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.15, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 blur-[60px] rounded-full pointer-events-none"
            style={{ 
              backgroundColor: data.find(d => d.status === activeSegment)?.glowHex || 'transparent',
              width: width,
              height: height
            }}
          />
        )}
      </AnimatePresence>

      <svg width={width} height={height} className="relative z-10 overflow-visible">
        <Group top={centerY + margin.top} left={centerX + margin.left}>
          <Pie
            data={data}
            pieValue={d => d.count}
            outerRadius={radius}
            innerRadius={radius - 20}
            padAngle={0.05}
          >
            {pie => {
              return pie.arcs.map((arc, index) => {
                const { status, glowHex } = arc.data;
                const isHovered = activeSegment === status;
                const arcPath = pie.path(arc) || '';
                
                // SVG Filter for glow effect
                const filterId = `glow-${status.replace(/\s+/g, '-')}`;

                return (
                  <g 
                    key={`arc-${status}-${index}`}
                    onMouseEnter={() => setActiveSegment(status)}
                    onMouseLeave={() => setActiveSegment(null)}
                    className="cursor-pointer transition-all duration-300"
                    style={{ transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
                  >
                    <defs>
                      <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <path
                      d={arcPath}
                      fill={colorScale(status)}
                      fillOpacity={isHovered ? 1 : 0.8}
                      stroke="rgba(0,0,0,0.5)"
                      strokeWidth={2}
                      filter={isHovered ? `url(#${filterId})` : undefined}
                      className="transition-all duration-300"
                    />
                  </g>
                );
              });
            }}
          </Pie>
        </Group>
      </svg>

      {/* Center KPI Display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
        <span className="text-4xl font-bold tracking-tight text-white drop-shadow-md">
          {activeSegment ? data.find(d => d.status === activeSegment)?.count : total}
        </span>
        <span className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${activeSegment ? data.find(d => d.status === activeSegment)?.color : 'text-zinc-500'}`}>
          {activeSegment || 'Total Machines'}
        </span>
      </div>
    </div>
  );
}
