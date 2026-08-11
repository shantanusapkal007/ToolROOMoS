"use client";

import React, { useMemo, useState } from 'react';
import { Bar } from '@visx/shape';
import { Group } from '@visx/group';
import { scaleBand, scaleLinear } from '@visx/scale';
import { AxisBottom } from '@visx/axis';
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip';
import { localPoint } from '@visx/event';
import { motion } from 'framer-motion';
import { colors, shadows, radius } from '@/lib/tokens';

export interface FinanceData {
  category: string;
  value: number;
  type: 'revenue' | 'cost';
}

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
  data?: FinanceData[];
  width?: number;
  height?: number;
}

export function FinanceWaterfall({ data = [], width = 600, height = 300 }: Props) {
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
  }), [innerWidth, data]);

  const yScale = useMemo(() => scaleLinear<number>({
    range: [innerHeight, 0],
    domain: [0, data.length > 0 ? Math.max(...data.map(d => d.value)) * 1.2 : 100],
    nice: true,
  }), [innerHeight, data]);

  if (width < 10) return null;
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center bg-canvas border border-border-gray rounded-[12px]">
        <p className="text-body-sm-strong text-mute">No cost events recorded for this project yet.</p>
        <p className="text-caption text-mute-soft mt-1">Financial variance will populate dynamically as daily report costs & invoices are logged.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <svg ref={containerRef} width={width} height={height} className="overflow-visible">
        <Group top={margin.top} left={margin.left}>
          {data.map((d, index) => {
            const barWidth = xScale.bandwidth();
            const barHeight = innerHeight - (yScale(d.value) ?? 0);
            const barX = xScale(d.category);
            const barY = innerHeight - barHeight;
            const isHovered = activeHover === d.category;

            return (
              <Group key={`bar-${index}`}>
                <motion.rect
                  initial={{ height: 0, y: innerHeight }}
                  animate={{ height: barHeight, y: barY }}
                  transition={{ delay: index * 0.1, duration: 0.2 }}
                  x={barX}
                  width={barWidth}
                  fill={d.type === 'revenue' ? colors['accent-green'] : colors['accent-red']}
                  rx={4}
                  ry={4}
                  fillOpacity={isHovered ? 1 : 0.85}
                  className="cursor-pointer transition-opacity duration-200"
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
            stroke={colors.hairline}
            tickStroke={colors.hairline}
            tickLabelProps={() => ({
              fill: colors.body,
              fontSize: 12,
              textAnchor: 'middle',
              fontWeight: 500,
              fontFamily: 'inherit'
            })}
          />
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <TooltipInPortal top={tooltipTop} left={tooltipLeft} style={tooltipStyles}>
          <div className="flex flex-col gap-1">
            <span className="text-eyebrow-uppercase-sm font-medium text-mute uppercase">{tooltipData.category}</span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${tooltipData.type === 'revenue' ? 'bg-accent-green' : 'bg-accent-red'}`} />
              <span className="text-display-xs font-semibold text-ink">${tooltipData.value.toLocaleString()}</span>
            </div>
          </div>
        </TooltipInPortal>
      )}
    </div>
  );
}
