import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts"
import { StandardBarTooltip, StandardLineTooltip, chartCommonProps, chartTheme } from '@/components/ui/chart-components'

interface OccurrenceStats {
  year: number
  count: number
}

interface MonthlyStats {
  month: string
  count: number
}

interface CountryStats {
  country: string
  count: number
  trend: number
}

interface OccurrenceTabProps {
  occurrenceStats?: OccurrenceStats[]
  monthlyStats?: MonthlyStats[]
  countryStats?: CountryStats[]
}

export function OccurrenceTab({
  occurrenceStats = [],
  monthlyStats = [],
  countryStats = []
}: OccurrenceTabProps) {
  const hasData = occurrenceStats.length > 0 || monthlyStats.length > 0 || countryStats.length > 0

  if (!hasData) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No occurrence data available for this species. This could mean either:
            <br />
            1. The species has not been observed and recorded in GBIF yet
            <br />
            2. The species might be known by a different scientific name
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Monthly Trend */}
      {monthlyStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Occurrences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats}>
                  <CartesianGrid 
                    strokeDasharray={chartCommonProps.cartesianGrid.strokeDasharray} 
                    stroke={chartCommonProps.cartesianGrid.stroke}
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="month" 
                    tick={chartCommonProps.xAxis.tick}
                    tickLine={chartCommonProps.xAxis.tickLine}
                    axisLine={chartCommonProps.xAxis.axisLine}
                  />
                  <YAxis 
                    tick={chartCommonProps.yAxis.tick}
                    tickLine={chartCommonProps.yAxis.tickLine}
                    axisLine={chartCommonProps.yAxis.axisLine}
                  />
                  <Tooltip content={<StandardBarTooltip />} />
                  <Legend 
                    iconType="circle"
                    wrapperStyle={{ paddingTop: 8 }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill={chartTheme.tertiary} 
                    name="Occurrences" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Yearly Trend */}
      {occurrenceStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Yearly Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={occurrenceStats}>
                  <CartesianGrid 
                    strokeDasharray={chartCommonProps.cartesianGrid.strokeDasharray} 
                    stroke={chartCommonProps.cartesianGrid.stroke} 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="year" 
                    tick={chartCommonProps.xAxis.tick}
                    tickLine={chartCommonProps.xAxis.tickLine}
                    axisLine={chartCommonProps.xAxis.axisLine}
                  />
                  <YAxis 
                    tick={chartCommonProps.yAxis.tick}
                    tickLine={chartCommonProps.yAxis.tickLine}
                    axisLine={chartCommonProps.yAxis.axisLine}
                  />
                  <Tooltip content={<StandardLineTooltip />} />
                  <Legend 
                    iconType="circle"
                    wrapperStyle={{ paddingTop: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Occurrences"
                    stroke={chartTheme.primary}
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1, fill: 'white', stroke: chartTheme.primary }}
                    activeDot={{ r: 5, strokeWidth: 0, fill: chartTheme.primary }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Country Distribution */}
      {countryStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Country Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={countryStats}
                  layout="vertical"
                  margin={{ left: 100 }}
                >
                  <CartesianGrid 
                    strokeDasharray={chartCommonProps.cartesianGrid.strokeDasharray} 
                    stroke={chartCommonProps.cartesianGrid.stroke}
                    vertical={false}
                  />
                  <XAxis 
                    type="number" 
                    tick={chartCommonProps.xAxis.tick}
                    tickLine={chartCommonProps.xAxis.tickLine}
                    axisLine={chartCommonProps.xAxis.axisLine}
                  />
                  <YAxis 
                    dataKey="country" 
                    type="category" 
                    tick={chartCommonProps.yAxis.tick}
                    tickLine={chartCommonProps.yAxis.tickLine}
                    axisLine={chartCommonProps.yAxis.axisLine}
                  />
                  <Tooltip content={<StandardBarTooltip />} />
                  <Legend 
                    iconType="circle"
                    wrapperStyle={{ paddingTop: 8 }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill={chartTheme.tertiary} 
                    name="Occurrences" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
