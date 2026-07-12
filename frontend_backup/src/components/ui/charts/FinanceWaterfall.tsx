"use client";

import React, { useMemo, useState } from 'react';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { motion } from 'framer-motion';

export interface FinanceData {
  category: string;
  value: number;
  type: 'revenue' | 'cost';
}

const data: FinanceData[] = [
  { category: 'Jan', value: 45000, type: 'revenue' },
  { category: 'Feb', value: 52000, type: 'revenue' },
  { category: 'Mar', value: 48000, type: 'revenue' },
  { category: 'Apr', value: 61000, type: 'revenue' },
  { category: 'May', value: 59000, type: 'revenue' },
  { category: 'Jun', value: 72000, type: 'revenue' },
];

const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: 'rgba(5, 10, 20, 0.85)',
  color: 'white',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid rgba(255,255,255,0.1)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
};

interface Props {
  width: number;
  height: number;
}

export function FinanceWaterfall({ width, height }: Props) {
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } = useTooltip<FinanceData>();
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  });

  const [activeHover, setActiveHover] = useState<string | null>(null);

  const margin = { top: 40, right: 0, bottom: 40, left: 0 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = useMemo(() => scaleBand<string>({
    range: [0, innerWidth],
    domain: data.map(d => d.category),
    padding: 0.4,
  }), [innerWidth]);

  const yScale = useMemo(() => scaleLinear<number>({
    range: [innerHeight, 0],
    domain: [0, Math.max(...data.map(d => d.value)) * 1.2],
    nice: true,
  }), [innerHeight]);

  if (width < 10) return null;

  return (
    <div className="relative">
      <svg ref={containerRef} width={width} height={height} className="overflow-visible">
        {/* Glow Filters */}
        <defs>
          <filter id="emerald-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <Group top={margin.top} left={margin.left}>
          {data.map((d, index) => {
            const barWidth = xScale.bandwidth();
            const barHeight = innerHeight - (yScale(d.value) ?? 0);
            const barX = xScale(d.category);
            const barY = innerHeight - barHeight;
            const isHovered = activeHover === d.category;

            return (
              <Group key={`bar-${index}`}>
                {/* Motion wrapper for height animation */}
                <motion.rect
                  initial={{ height: 0, y: innerHeight }}
                  animate={{ height: barHeight, y: barY }}
                  transition={{ delay: index * 0.1, type: 'spring', stiffness: 100, damping: 20 }}
                  x={barX}
                  width={barWidth}
                  fill={d.type === 'revenue' ? '#10b981' : '#f43f5e'}
                  rx={8}
                  ry={8}
                  fillOpacity={isHovered ? 1 : 0.7}
                  filter={isHovered ? 'url(#emerald-glow)' : ''}
                  className="cursor-pointer transition-all duration-300"
                  onMouseEnter={(e) => {
                    setActiveHover(d.category);
                    const eventSvgCoords = localPoint(e);
                    showTooltip({
                      tooltipData: d,
                      tooltipLeft: eventSvgCoords?.x,
                      tooltipTop: eventSvgCoords?.y,
                    });
                  }}
                  onMouseLeave={() => {
                    setActiveHover(null);
                    hideTooltip();
                  }}
                />
              </Group>
            );
          })}
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke="rgba(255,255,255,0.1)"
            tickStroke="rgba(255,255,255,0.1)"
            tickLabelProps={() => ({
              fill: 'rgba(255,255,255,0.4)',
              fontSize: 11,
              textAnchor: 'middle',
              fontWeight: 600,
              fontFamily: 'inherit'
            })}
          />
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <TooltipInPortal top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{tooltipData.category}</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${tooltipData.type === 'revenue' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span className="text-xl font-black">${tooltipData.value.toLocaleString()}</span>
            </div>
          </div>
        </TooltipInPortal>
      )}
    </div>
  );
}
