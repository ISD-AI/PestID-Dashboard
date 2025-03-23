"use client"

import { TooltipProps } from "recharts"
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"

// Color Theme for all charts
export const chartTheme = {
  // Primary colors for data series
  primary: "#6366f1",
  secondary: "#f43f5e",
  tertiary: "#10b981",
  quaternary: "#fb923c",
  
  // Background and grid colors
  background: "rgba(255, 255, 255, 0.9)",
  grid: "rgba(229, 231, 235, 0.8)",
  
  // Hover and active states
  hover: {
    background: "rgba(255, 255, 255, 1)",
    border: "rgba(99, 102, 241, 0.2)",
    shadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
  }
}

/**
 * Standard tooltip component for bar charts
 */
export const StandardBarTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].value as number
    const dataName = payload[0].name
    
    return (
      <div className="bg-background border border-border shadow-md rounded-md p-3 backdrop-blur-sm">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-sm" 
            style={{ backgroundColor: payload[0].color }}
          />
          <span className="text-xs text-muted-foreground">{dataName}: </span>
          <span className="text-xs font-medium text-foreground">{dataPoint.toLocaleString()}</span>
        </div>
      </div>
    )
  }
  
  return null
}

/**
 * Standard tooltip component for line charts
 */
export const StandardLineTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border shadow-md rounded-md p-3 backdrop-blur-sm">
        <p className="text-sm font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={`tooltip-${index}`} className="flex items-center space-x-2 mt-1">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-xs text-muted-foreground">{entry.name}: </span>
            <span className="text-xs font-medium text-foreground">
              {(entry.value as number).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    )
  }
  
  return null
}

/**
 * Common chart options for consistent styling
 */
export const chartCommonProps = {
  cartesianGrid: {
    strokeDasharray: "3 3",
    stroke: chartTheme.grid,
    vertical: false
  },
  xAxis: {
    tick: { fontSize: 12 },
    tickLine: false,
    axisLine: { stroke: chartTheme.grid }
  },
  yAxis: {
    tick: { fontSize: 12 },
    tickLine: false,
    axisLine: { stroke: chartTheme.grid }
  }
}
