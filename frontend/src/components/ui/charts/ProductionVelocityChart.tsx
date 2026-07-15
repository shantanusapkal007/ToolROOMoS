"use client";

import React, { useMemo, useState } from 'react';
import { AreaClosed, LinePath, Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleTime, scaleLinear } from '@visx/scale';
import { LinearGradient } from '@visx/gradient';
import { AxisBottom } from '@visx/axis';
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';
import { motion } from 'framer-motion';

export interface VelocityData {
  date: Date;
  completed: number;
}

const data: VelocityData[] = [
  { date: new Date('2026-07-01'), completed: 12 },
  { date: new Date('2026-07-02'), completed: 15 },
  { date: new Date('2026-07-03'), completed: 14 },
  { date: new Date('2026-07-04'), completed: 22 },
  { date: new Date('2026-07-05'), completed: 18 },
  { date: new Date('2026-07-06'), completed: 25 },
  { date: new Date('2026-07-07'), completed: 30 },
];

const getDate = (d: VelocityData) => d.date;
const getCompleted = (d: VelocityData) => d.completed;
const bisectDate = bisector<VelocityData, Date>(d => d.date).left;

const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  color: '#0A0A0C',
  padding: '12px',
  borderRadius: '12px',
  border: '1px solid rgba(15,15,20,0.1)',
  backdropFilter: 'blur(12px)',
  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
};

interface Props {
  width: number;
  height: number;
}

export function ProductionVelocityChart({ width, height }: Props) {
  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } = useTooltip<VelocityData>();
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  });

  const margin = { top: 20, right: 0, bottom: 40, left: 0 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = useMemo(() => scaleTime<number>({
    range: [0, innerWidth],
    domain: [Math.min(...data.map(d => d.date.getTime())), Math.max(...data.map(d => d.date.getTime()))],
  }), [innerWidth]);

  const yScale = useMemo(() => scaleLinear<number>({
    range: [innerHeight, 0],
    domain: [0, Math.max(...data.map(getCompleted)) * 1.2],
    nice: true,
  }), [innerHeight]);

  const handleTooltip = (event: React.MouseEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>) => {
    const { x } = localPoint(event) || { x: 0 };
    const x0 = xScale.invert(x);
    const index = bisectDate(data, x0, 1);
    const d0 = data[index - 1];
    const d1 = data[index];
    let d = d0;
    if (d1 && getDate(d1)) {
      d = x0.valueOf() - getDate(d0).valueOf() > getDate(d1).valueOf() - x0.valueOf() ? d1 : d0;
    }
    showTooltip({
      tooltipData: d,
      tooltipLeft: x,
      tooltipTop: yScale(getCompleted(d)),
    });
  };

  if (width < 10) return null;

  return (
    <div className="relative">
      <svg ref={containerRef} width={width} height={height} className="overflow-visible">
        <LinearGradient id="area-gradient" from="#7C3AED" to="#7C3AED" fromOpacity={0.4} toOpacity={0} />
        
        <Group top={margin.top} left={margin.left}>
          {/* Animated Area */}
          <motion.g
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <AreaClosed<VelocityData>
              data={data}
              x={d => xScale(getDate(d)) ?? 0}
              y={d => yScale(getCompleted(d)) ?? 0}
              yScale={yScale}
              strokeWidth={0}
              fill="url(#area-gradient)"
            />
            
            {/* Animated Line */}
            <LinePath<VelocityData>
              data={data}
              x={d => xScale(getDate(d)) ?? 0}
              y={d => yScale(getCompleted(d)) ?? 0}
              stroke="#7C3AED"
              strokeWidth={3}
              style={{ filter: 'drop-shadow(0px 10px 10px rgba(124, 58, 237, 0.2))' }}
            />
          </motion.g>

          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke="rgba(15,15,20,0.1)"
            tickStroke="rgba(15,15,20,0.1)"
            numTicks={5}
            tickFormat={(v) => new Date(v as Date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            tickLabelProps={() => ({
              fill: 'rgba(15,15,20,0.5)',
              fontSize: 11,
              textAnchor: 'middle',
              fontWeight: 600,
              fontFamily: 'inherit'
            })}
          />

          <Bar
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            rx={14}
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={() => hideTooltip()}
          />

          {tooltipOpen && tooltipData && (
            <Group>
              <line
                x1={tooltipLeft}
                y1={0}
                x2={tooltipLeft}
                y2={innerHeight}
                stroke="rgba(15,15,20,0.2)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop}
                r={6}
                fill="#7C3AED"
                stroke="#FBFBFC"
                strokeWidth={2}
                pointerEvents="none"
              />
            </Group>
          )}
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <TooltipInPortal top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              {new Date(tooltipData.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-purple-600">{tooltipData.completed}</span>
              <span className="text-sm font-semibold text-zinc-600">Operations</span>
            </div>
          </div>
        </TooltipInPortal>
      )}
    </div>
  );
}
