"use client";

import React, { useMemo } from 'react';
import { AreaClosed, LinePath, Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleTime, scaleLinear } from '@visx/scale';
import { LinearGradient } from '@visx/gradient';
import { AxisBottom } from '@visx/axis';
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { bisector } from 'd3-array';
import { motion } from 'framer-motion';
import { useGlobalDailyReports } from '../../../hooks/useDailyReports';
import { colors, shadows, radius } from '@/lib/tokens';

export interface VelocityData {
  date: Date;
  completed: number;
}

const getDate = (d: VelocityData) => d.date;
const getCompleted = (d: VelocityData) => d.completed;
const bisectDate = bisector<VelocityData, Date>(d => d.date).left;

const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: colors.canvas,
  color: colors.ink,
  padding: '12px',
  borderRadius: radius.sm,
  border: `1px solid ${colors.hairline}`,
  boxShadow: shadows['level-2'],
};

interface Props {
  data?: VelocityData[];
  width: number;
  height: number;
}

export function ProductionVelocityChart({ data: passedData, width, height }: Props) {
  const { data: globalReportsRes = [] } = useGlobalDailyReports({});
  
  const computedData: VelocityData[] = useMemo(() => {
    if (passedData && passedData.length > 0) return passedData;
    
    const reports = Array.isArray(globalReportsRes) ? globalReportsRes : (globalReportsRes as any)?.data || [];
    if (reports.length === 0) return [];

    const dateMap = new Map<string, number>();
    reports.forEach((r: any) => {
      const dateStr = r.reportDate || r.workDate || r.createdAt;
      if (!dateStr) return;
      const key = new Date(dateStr).toISOString().split('T')[0];
      const count = Number(r.producedQty || 1);
      dateMap.set(key, (dateMap.get(key) || 0) + count);
    });

    const sortedKeys = Array.from(dateMap.keys()).sort();
    return sortedKeys.map(k => ({ date: new Date(k), completed: dateMap.get(k)! }));
  }, [passedData, globalReportsRes]);

  const data = computedData;

  const { tooltipData, tooltipLeft, tooltipTop, tooltipOpen, showTooltip, hideTooltip } = useTooltip<VelocityData>();
  const { containerRef, TooltipInPortal } = useTooltipInPortal({
    detectBounds: true,
    scroll: true,
  });

  const margin = { top: 20, right: 0, bottom: 40, left: 0 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const minTime = data.length > 0 ? Math.min(...data.map(d => d.date.getTime())) : new Date().getTime() - 7*86400000;
  const maxTime = data.length > 0 ? Math.max(...data.map(d => d.date.getTime())) : new Date().getTime();

  const xScale = useMemo(() => scaleTime<number>({
    range: [0, innerWidth],
    domain: [minTime, maxTime],
  }), [innerWidth, minTime, maxTime]);

  const yScale = useMemo(() => scaleLinear<number>({
    range: [innerHeight, 0],
    domain: [0, data.length > 0 ? Math.max(...data.map(getCompleted)) * 1.2 : 10],
    nice: true,
  }), [innerHeight, data]);

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
        <LinearGradient id="area-gradient" from={colors['accent-purple']} to={colors['accent-purple']} fromOpacity={0.25} toOpacity={0} />
        
        <Group top={margin.top} left={margin.left}>
          <motion.g
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AreaClosed<VelocityData>
              data={data}
              x={d => xScale(getDate(d)) ?? 0}
              y={d => yScale(getCompleted(d)) ?? 0}
              yScale={yScale}
              strokeWidth={0}
              fill="url(#area-gradient)"
            />
            
            <LinePath<VelocityData>
              data={data}
              x={d => xScale(getDate(d)) ?? 0}
              y={d => yScale(getCompleted(d)) ?? 0}
              stroke={colors['accent-purple']}
              strokeWidth={2}
            />
          </motion.g>

          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke={colors.hairline}
            tickStroke={colors.hairline}
            numTicks={5}
            tickFormat={(v) => new Date(v as Date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            tickLabelProps={() => ({
              fill: colors.body,
              fontSize: 12,
              textAnchor: 'middle',
              fontWeight: 500,
              fontFamily: 'inherit'
            })}
          />

          <Bar
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
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
                stroke={colors.hairline}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              <circle
                cx={tooltipLeft}
                cy={tooltipTop}
                r={5}
                fill={colors['accent-purple']}
                stroke={colors.canvas}
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
            <span className="text-eyebrow-uppercase-sm font-medium text-mute uppercase">
              {new Date(tooltipData.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-display-xs font-semibold text-accent-purple">{tooltipData.completed}</span>
              <span className="text-body-sm font-normal text-mute">Operations</span>
            </div>
          </div>
        </TooltipInPortal>
      )}
    </div>
  );
}
