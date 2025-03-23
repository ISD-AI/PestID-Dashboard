'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { StandardLineTooltip, chartCommonProps, chartTheme } from '@/components/ui/chart-components';

interface DetectionDistributionProps {
  detections: { month: string; observations: number }[];
  selectedYear: string;
  onYearChange: (year: string) => void;
}

export function DetectionDistribution({ detections, selectedYear, onYearChange }: DetectionDistributionProps) {
  const currentYear = new Date().getFullYear().toString();
  const years = Array.from({ length: 2 }, (_, i) => Number(currentYear) - i);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Detection Over Time</CardTitle>
        <Select value={selectedYear} onValueChange={onYearChange}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={detections}>
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
                tick={chartCommonProps.yAxis.tick}
                tickLine={chartCommonProps.yAxis.tickLine}
                axisLine={chartCommonProps.yAxis.axisLine}
              />
              <Tooltip content={<StandardLineTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="observations"
                name="User Observation Count"
                stroke={chartTheme.tertiary}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 1, fill: 'white', stroke: chartTheme.tertiary }}
                activeDot={{ r: 5, strokeWidth: 0, fill: chartTheme.tertiary }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}