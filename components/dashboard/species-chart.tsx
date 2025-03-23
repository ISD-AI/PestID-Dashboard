"use client"

import { useState, useEffect } from "react"
import { Bar, Line, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, TooltipProps } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ChartData } from "@/types/detection"
import { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent"
import { chartCommonProps, chartTheme } from "@/components/ui/chart-components"

interface SpeciesChartProps {
  className?: string
}

// Custom tooltip component for the chart
const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    const detections = payload.find(p => p.name === 'Detections')?.value as number || 0
    const trend = payload.find(p => p.name === 'Trend (3-month avg)')?.value as number || 0
    
    return (
      <div className="bg-background p-3 rounded-lg shadow-md border border-border backdrop-blur-sm">
        <p className="font-medium text-sm mb-1 text-foreground">{label}</p>
        <div className="flex items-center mb-1">
          <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: chartTheme.primary }}></span>
          <span className="text-sm text-muted-foreground">Species Detections: </span>
          <span className="text-sm font-semibold ml-1 text-foreground">{detections.toLocaleString()}</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: chartTheme.secondary }}></span>
          <span className="text-sm text-muted-foreground">Trend Average: </span>
          <span className="text-sm font-semibold ml-1 text-foreground">{trend.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
};

export function SpeciesChart({ className }: SpeciesChartProps) {
  const [timeRange, setTimeRange] = useState("90d")
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/fbdetection/chart')
        
        // Check if response is OK before trying to parse JSON
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`)
        }
        
        const text = await response.text()
        let data
        
        try {
          data = JSON.parse(text)
        } catch (e) {
          console.error('Failed to parse JSON response:', e, text.substring(0, 200))
          throw new Error('Invalid JSON response from API')
        }
        
        if (data && data.success === true && Array.isArray(data.data)) {
          // Sort data by timestamp
          const sortedData = [...data.data].sort((a, b) => 
            a.timestamp.localeCompare(b.timestamp)
          )
          
          // Filter data based on selected time range
          const filteredData = filterDataByTimeRange(sortedData, timeRange)
          setChartData(filteredData)
        } else {
          console.error('Unexpected API response structure:', data)
          setChartData([])
        }
      } catch (error) {
        console.error("Error fetching chart data:", error)
        setChartData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchChartData()
  }, [timeRange])

  // Function to filter data based on time range
  const filterDataByTimeRange = (data: ChartData[], range: string): ChartData[] => {
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (range) {
      case "7d":
        cutoffDate.setDate(now.getDate() - 7)
        break
      case "30d":
        cutoffDate.setDate(now.getDate() - 30)
        break
      case "90d":
        cutoffDate.setDate(now.getDate() - 90)
        break
      default:
        cutoffDate.setDate(now.getDate() - 90)
    }
    
    // Format cutoff date to YYYY-MM format for comparison
    const cutoffString = `${cutoffDate.getFullYear()}-${String(cutoffDate.getMonth() + 1).padStart(2, '0')}`
    
    return data.filter(item => item.timestamp >= cutoffString)
  }

  // Calculate total detections and monthly average
  const totalDetections = chartData.reduce((sum, item) => sum + item.value, 0)
  const monthlyAverage = chartData.length > 0 ? Math.round(totalDetections / chartData.length) : 0

  // Format data for the chart with additional derived metrics
  const formattedChartData = chartData.map((item, index, array) => {
    // Calculate trend (3-month moving average if possible)
    let trend = item.value
    if (index >= 2) {
      trend = Math.round((array[index].value + array[index-1].value + array[index-2].value) / 3)
    }
    
    // Extract month name from timestamp (YYYY-MM)
    const [year, month] = item.timestamp.split('-')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthName = monthNames[parseInt(month) - 1]
    
    return {
      month: `${monthName} ${year.slice(2)}`,
      detections: item.value,
      trend: trend
    }
  })

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">Species Detections</h3>
            <div className="text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-48" />
              ) : (
                `${totalDetections} total detections, ${monthlyAverage} monthly average`
              )}
            </div>
          </div>
          <Select defaultValue={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {isLoading ? (
          <div className="w-full h-[400px] flex items-center justify-center">
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="w-full h-[400px] flex items-center justify-center text-muted-foreground">
            No data available for the selected time range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart 
              data={formattedChartData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
            >
              <CartesianGrid 
                strokeDasharray={chartCommonProps.cartesianGrid.strokeDasharray} 
                stroke={chartCommonProps.cartesianGrid.stroke} 
                vertical={chartCommonProps.cartesianGrid.vertical}
              />
              <XAxis 
                dataKey="month" 
                tick={chartCommonProps.xAxis.tick}
                tickLine={chartCommonProps.xAxis.tickLine}
                axisLine={chartCommonProps.xAxis.axisLine}
              />
              <YAxis 
                yAxisId="left"
                tick={chartCommonProps.yAxis.tick}
                tickLine={chartCommonProps.yAxis.tickLine}
                axisLine={chartCommonProps.yAxis.axisLine}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip 
                content={<CustomTooltip />}
              />
              <Legend 
                iconType="circle"
                wrapperStyle={{ paddingTop: 8 }}
              />
              <Bar 
                yAxisId="left"
                dataKey="detections" 
                fill={chartTheme.primary}
                radius={[4, 4, 0, 0]} 
                name="Detections"
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="trend" 
                stroke={chartTheme.secondary}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 1, fill: 'white', stroke: chartTheme.secondary }}
                activeDot={{ r: 5, strokeWidth: 0, fill: chartTheme.secondary }}
                name="Trend (3-month avg)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
