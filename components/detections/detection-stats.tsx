'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, AlertTriangle} from "lucide-react";
import { VeriStats } from "@/types/detection";

interface DetectionStatsProps {
  stats: VeriStats
}

export function DetectionStats({ stats }: DetectionStatsProps) {
  // Calculate the number of columns based on whether notPest exists
  const gridCols = stats.notPest && stats.notPest > 0 ? "md:grid-cols-4" : "md:grid-cols-3";
  
  // Helper function to calculate percentage
  const calculatePercentage = (value: number) => {
    if (stats.total === 0) return null;
    return `${((value / stats.total) * 100).toFixed(1)}% of total`;
  };
  
  return (
    <div className={`grid gap-4 ${gridCols}`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Review
          </CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending}</div>
          {calculatePercentage(stats.pending) && (
            <p className="text-xs text-muted-foreground">
              {calculatePercentage(stats.pending)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Verified 
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.verified}</div>
          {calculatePercentage(stats.verified) && (
            <p className="text-xs text-muted-foreground">
              {calculatePercentage(stats.verified)}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Rejected
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.rejected}</div>
          {calculatePercentage(stats.rejected) && (
            <p className="text-xs text-muted-foreground">
              {calculatePercentage(stats.rejected)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}