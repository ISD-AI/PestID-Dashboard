'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CategoryChartData } from '@/types/verification';
import {chartCommonProps, chartTheme } from '@/components/ui/chart-components';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface CategoryDistributionProps {
  categoryData: CategoryChartData[];
  selectedYear: string;
  onYearChange: (year: string) => void;
}

export function CategoryDistribution({ 
  categoryData, 
  selectedYear, 
  onYearChange 
}: CategoryDistributionProps) {
  const currentYear = new Date().getFullYear().toString();
  const years = Array.from({ length: 2 }, (_, i) => Number(currentYear) - i);
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border border-border rounded-md shadow-md backdrop-blur-sm">
          <p className="font-medium text-sm text-foreground mb-2">{label}</p>
          <div className="space-y-2">
            {payload.map((entry, index) => (
              <div key={`item-${index}`} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-muted-foreground capitalize">
                  {(entry.name as string).replace(/-/g, ' ')}:
                </span>
                <span className="text-xs font-medium text-foreground">
                  {(entry.value as number).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Category Distribution</CardTitle>
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
            <BarChart
              data={categoryData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
                tick={chartCommonProps.yAxis.tick}
                tickLine={chartCommonProps.yAxis.tickLine}
                axisLine={chartCommonProps.yAxis.axisLine}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                formatter={(value) => value.replace(/-/g, ' ')}
                iconType="circle"
                wrapperStyle={{ paddingTop: 8 }}
              />
              <Bar 
                dataKey="real-pest" 
                fill={chartTheme.tertiary} 
                name="Real Observation" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="google-sourced" 
                fill={chartTheme.primary} 
                name="Google Sourced" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="unknown-species" 
                fill={chartTheme.secondary} 
                name="Unknown Species" 
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="unrelated" 
                fill={chartTheme.quaternary} 
                name="Unrelated" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}