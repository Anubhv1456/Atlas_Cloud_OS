import React, { useMemo, useCallback } from 'react';
import { AreaClosed, LinePath, Bar, Line } from '@visx/shape';
import { curveMonotoneX } from '@visx/curve';
import { GridRows } from '@visx/grid';
import { scalePoint, scaleLinear } from '@visx/scale';
import { withTooltip, TooltipWithBounds } from '@visx/tooltip';
import { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip';
import { localPoint } from '@visx/event';
import { LinearGradient } from '@visx/gradient';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ParentSize } from '@visx/responsive';
import { Group } from '@visx/group';

export interface ChartDataPoint {
  id?: string | number;
  date: string;
  fullDate?: string;
  percentage: number;
  title?: string;
  type?: string;
  isProjected?: boolean;
  isRealPoint?: boolean;
  scoreStr?: string;
  subjectName?: string;
}

export type VisxTrendChartProps = {
  data: ChartDataPoint[];
};

const getX = (d: ChartDataPoint) => d.date;
const getY = (d: ChartDataPoint) => d.percentage;

const defaultStyles = {
  position: 'absolute' as const,
  backgroundColor: 'white',
  color: '#222222',
  padding: '.3rem .5rem',
  borderRadius: '3px',
  fontSize: '14px',
  boxShadow: '0 1px 2px rgba(33,33,33,0.2)',
  lineHeight: '1em',
  pointerEvents: 'none' as const,
};

const tooltipStyles = {
  ...defaultStyles,
  backgroundColor: 'transparent',
  boxShadow: 'none',
  padding: 0,
};

const BaseChart = withTooltip<
  { width: number; height: number; data: ChartDataPoint[] },
  ChartDataPoint
>(({
  width,
  height,
  data,
  showTooltip,
  hideTooltip,
  tooltipData,
  tooltipLeft = 0,
  tooltipTop = 0,
}) => {
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = useMemo(() => scalePoint<string>({
    range: [0, innerWidth],
    domain: data.map(getX),
    padding: 0.5,
  }), [innerWidth, data]);

  const yScale = useMemo(() => scaleLinear<number>({
    range: [innerHeight, 0],
    domain: [0, 100],
    nice: true,
  }), [innerHeight]);

  const handlePointerMove = useCallback((event: React.PointerEvent<SVGRectElement> | React.TouchEvent<SVGRectElement>) => {
    const coords = localPoint(event.currentTarget.ownerSVGElement!, event);
    if (!coords) return;
    
    const x = coords.x - margin.left;
    
    // Find closest data point
    let closest: ChartDataPoint | null = null;
    let minDistance = Infinity;
    
    for (const d of data) {
      const pointX = xScale(getX(d));
      if (pointX !== undefined) {
        const distance = Math.abs(pointX - x);
        if (distance < minDistance) {
          minDistance = distance;
          closest = d;
        }
      }
    }
    
    if (closest) {
      const tooltipX = xScale(getX(closest)) ?? 0;
      showTooltip({
        tooltipData: closest,
        tooltipLeft: tooltipX + margin.left,
        tooltipTop: yScale(getY(closest)) + margin.top,
      });
    }
  }, [xScale, yScale, data, margin.left, margin.top, showTooltip]);

  if (width < 10) return null;

  return (
    <div style={{ position: 'relative' }}>
      <svg width={width} height={height}>
        <LinearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
          <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.0} />
        </LinearGradient>

        <Group left={margin.left} top={margin.top}>
          <GridRows
            scale={yScale}
            width={innerWidth}
            strokeDasharray="3,3"
            stroke="hsl(var(--border))"
            strokeOpacity={0.3}
            pointerEvents="none"
          />

          <AxisBottom
            top={innerHeight}
            scale={xScale}
            stroke="transparent"
            tickStroke="transparent"
            tickLabelProps={() => ({
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 10,
              textAnchor: 'middle',
              fontWeight: 500,
              opacity: 0.7,
            })}
          />
          
          <AxisLeft
            scale={yScale}
            stroke="transparent"
            tickStroke="transparent"
            tickValues={[25, 50, 75, 100]}
            tickLabelProps={() => ({
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 9,
              textAnchor: 'end',
              dy: '0.33em',
              dx: '-0.5em',
              opacity: 0.4,
              fontFamily: 'monospace'
            })}
          />

          {/* Reference Line */}
          <Line
            from={{ x: 0, y: yScale(75) }}
            to={{ x: innerWidth, y: yScale(75) }}
            stroke="rgba(16, 185, 129, 0.4)"
            strokeDasharray="4 4"
            pointerEvents="none"
          />
          <text
            x={innerWidth}
            y={yScale(75) - 5}
            fill="rgba(16, 185, 129, 0.7)"
            fontSize={9}
            fontWeight={600}
            textAnchor="end"
          >
            75% Target
          </text>

          <AreaClosed<ChartDataPoint>
            data={data}
            x={d => xScale(getX(d)) ?? 0}
            y={d => yScale(getY(d))}
            yScale={yScale}
            strokeWidth={0}
            fill="url(#scoreAreaGrad)"
            curve={curveMonotoneX}
          />
          <LinePath<ChartDataPoint>
            data={data}
            x={d => xScale(getX(d)) ?? 0}
            y={d => yScale(getY(d))}
            stroke="hsl(var(--primary))"
            strokeWidth={2.5}
            curve={curveMonotoneX}
          />

          {/* Data Points */}
          {data.map((d, i) => {
            const cx = xScale(getX(d));
            const cy = yScale(getY(d));
            if (cx === undefined || cy === undefined) return null;
            
            if (d.isRealPoint) {
              return (
                <circle
                  key={`dot-${d.id || i}`}
                  cx={cx}
                  cy={cy}
                  r={4.5}
                  fill="hsl(var(--primary))"
                  stroke="var(--background)"
                  strokeWidth={2}
                  className="shadow-sm"
                  pointerEvents="none"
                />
              );
            }
            if (d.isProjected) {
              return (
                <circle
                  key={`dot-${d.id || i}`}
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  pointerEvents="none"
                />
              );
            }
            return null;
          })}

          {/* Tooltip Interaction Overlay */}
          <Bar
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            rx={14}
            onTouchStart={handlePointerMove}
            onTouchMove={handlePointerMove}
            onMouseMove={handlePointerMove}
            onMouseLeave={hideTooltip}
          />

          {tooltipData && (
            <g>
              <Line
                from={{ x: tooltipLeft - margin.left, y: 0 }}
                to={{ x: tooltipLeft - margin.left, y: innerHeight }}
                stroke="currentColor"
                strokeWidth={1}
                strokeOpacity={0.15}
                strokeDasharray="3 3"
                pointerEvents="none"
              />
              <circle
                cx={tooltipLeft - margin.left}
                cy={tooltipTop - margin.top}
                r={6}
                fill="hsl(var(--primary))"
                stroke="var(--background)"
                strokeWidth={3}
                pointerEvents="none"
              />
            </g>
          )}
        </Group>
      </svg>

      {tooltipData && (
        <TooltipWithBounds
          key={Math.random()}
          top={tooltipTop - 12}
          left={tooltipLeft}
          style={{ ...tooltipStyles, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-background/95 backdrop-blur-xl border border-border/60 p-3.5 rounded-2xl shadow-xl text-xs space-y-2 min-w-[200px] max-w-[260px]">
            <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2">
              <span className="font-bold text-foreground truncate">{tooltipData.title}</span>
              {tooltipData.isProjected ? (
                <Badge className="text-[9px] px-1.5 py-0 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30">
                  Forecast
                </Badge>
              ) : tooltipData.isRealPoint ? (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-mono">
                  {tooltipData.type}
                </Badge>
              ) : null}
            </div>

            <div className="flex items-baseline justify-between pt-0.5">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold block">
                  {tooltipData.isProjected ? 'Forecasted Retention' : 'Memory Retention'}
                </span>
                <span className={cn(
                  "font-mono font-bold text-2xl tracking-tighter leading-none",
                  tooltipData.percentage >= 75 ? "text-emerald-500" : tooltipData.percentage >= 60 ? "text-amber-500" : "text-rose-500"
                )}>
                  {tooltipData.percentage}%
                </span>
              </div>
              {tooltipData.scoreStr && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  Raw: {tooltipData.scoreStr}
                </span>
              )}
            </div>

            <div className="text-[10px] text-muted-foreground pt-1 flex items-center justify-between border-t border-border/30">
              <span>{tooltipData.fullDate}</span>
              {tooltipData.subjectName && <span className="font-medium text-foreground/80 truncate max-w-[120px]">{tooltipData.subjectName}</span>}
            </div>
          </div>
        </TooltipWithBounds>
      )}
    </div>
  );
});

export const VisxTrendChart: React.FC<VisxTrendChartProps> = ({ data }) => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ParentSize>
        {({ width, height }) => (
          <BaseChart width={width} height={height} data={data} />
        )}
      </ParentSize>
    </div>
  );
};
