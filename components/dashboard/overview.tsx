// components/dashboard/overview.tsx

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  Map, 
  Leaf, 
  BarChart4,
  Activity
} from "lucide-react"
import { GeographicCoverage, VeriStats } from "@/types/detection"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"

export function Overview() {
  const [veriStats, setVeriStats] = useState<VeriStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [trendPercentage, setTrendPercentage] = useState(0)
  const [geographicCoverage, setGeographicCoverage] = useState<GeographicCoverage[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch verification statistics
        const statsResponse = await fetch('/api/fbdetection/veriStats')
        
        if (statsResponse.ok) {
          const statsText = await statsResponse.text()
          let statsData;
          try {
            statsData = JSON.parse(statsText)
          } catch (e) {
            console.error('Failed to parse veriStats JSON:', e, statsText.substring(0, 200))
            throw new Error('Invalid JSON response from API')
          }
          
          if (statsData && statsData.success === true && statsData.data) {
            setVeriStats(statsData.data.veriStats)
          } else {
            console.error('Unexpected API response structure:', statsData)
            setVeriStats({
              total: 0,
              verified: 0,
              pending: 0,
              rejected: 0
            })
          }
        } else {
          console.error(`API error: ${statsResponse.status} ${statsResponse.statusText}`)
        }

        // Fetch chart data for trend analysis
        const chartResponse = await fetch('/api/fbdetection/chart')
        
        if (chartResponse.ok) {
          const chartText = await chartResponse.text()
          let chartData;
          try {
            chartData = JSON.parse(chartText)
          } catch (e) {
            console.error('Failed to parse chart JSON:', e, chartText.substring(0, 200))
            throw new Error('Invalid JSON response from API')
          }
          
          if (chartData && chartData.success === true && chartData.data) {
            
            // Calculate trend percentage (comparing last two months)
            if (chartData.data.length >= 2) {
              const lastMonth = chartData.data[chartData.data.length - 1].value
              const previousMonth = chartData.data[chartData.data.length - 2].value
              
              if (previousMonth > 0) {
                const percentage = ((lastMonth - previousMonth) / previousMonth) * 100
                setTrendPercentage(Math.round(percentage))
              }
            }
          } else {
            console.error('Unexpected API response structure:', chartData)
            setTrendPercentage(0)
          }
        }
        
        // Fetch geographic coverage data
        const geoResponse = await fetch('/api/fbdetection/ausGeographic')
        
        if (geoResponse.ok) {
          const geoData = await geoResponse.json()
          if (geoData.success && geoData.data) {
            setGeographicCoverage(geoData.data)
          }
        }
        
      } catch (error) {
        console.error("Error fetching overview data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate verification rate
  const verificationRate = veriStats 
    ? Math.round(((veriStats.verified + veriStats.rejected) / veriStats.total) * 100) 
    : 0
    
  // Calculate detection accuracy
  const accuracy = veriStats && (veriStats.verified + veriStats.rejected) > 0
    ? Math.round((veriStats.verified / (veriStats.verified + veriStats.rejected)) * 100)
    : 0

  // // Color mapping for Australian states to make the stacked bar visually distinct
  // const stateColors: {[key: string]: string} = {
  //   'NSW': '#2563eb', // blue
  //   'VIC': '#9333ea', // purple
  //   'QLD': '#f59e0b', // amber
  //   'SA': '#10b981',  // emerald
  //   'WA': '#ef4444',  // red
  //   'TAS': '#14b8a6', // teal
  //   'NT': '#f97316',  // orange
  //   'ACT': '#8b5cf6'  // violet
  // };

  return (
    <>
      {/* Total Detections Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <>
              <div className="text-2xl font-bold">{veriStats?.total || 0}</div>
              <div className="flex items-center mt-1">
                <TrendingUp className={`h-4 w-4 mr-1 ${trendPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <p className={`text-xs ${trendPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {trendPercentage >= 0 ? '+' : ''}{trendPercentage}% from last month
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Verification Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Verification Status</CardTitle>
          <BarChart4 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-16 w-full mb-2" />
          ) : (
            <>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs flex items-center">
                  <CheckCircle className="h-3 w-3 text-green-500 mr-1" /> Verified
                </span>
                <span className="text-xs font-medium">{veriStats?.verified || 0}</span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs flex items-center">
                  <AlertCircle className="h-3 w-3 text-amber-500 mr-1" /> Pending
                </span>
                <span className="text-xs font-medium">{veriStats?.pending || 0}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs flex items-center">
                  <XCircle className="h-3 w-3 text-red-500 mr-1" /> Rejected
                </span>
                <span className="text-xs font-medium">{veriStats?.rejected || 0}</span>
              </div>
              <Progress 
                value={verificationRate} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground mt-2">
                {verificationRate}% verification rate
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Geographic Coverage Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Australian Geographic Coverage</CardTitle>
          <Map className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 mt-2">
                {/* Display all states in a 2x4 grid (4 per row, 2 rows) */}
                {geographicCoverage.map(item => (
                  <div className="flex flex-col" key={item.state}>
                    <span className="text-sm font-medium">{item.state}</span>
                    <span className="text-xs text-muted-foreground">{item.percentage}%</span>
                  </div>
                ))}
                
                {/* Add empty placeholders if less than 8 states to maintain grid */}
                {Array.from({ length: Math.max(0, 8 - geographicCoverage.length) }).map((_, index) => (
                  <div key={`empty-${index}`} className="flex flex-col">
                    <span className="text-sm font-medium">&nbsp;</span>
                    <span className="text-xs text-muted-foreground">&nbsp;</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detection Accuracy Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Detection Accuracy</CardTitle>
          <Leaf className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mb-2" />
          ) : (
            <>
              <div className="text-2xl font-bold">{accuracy}%</div>
              <p className="text-xs text-muted-foreground">
                Based on verified vs. rejected detections
              </p>
              <div className="mt-2">
                <Progress 
                  value={accuracy} 
                  className="h-2" 
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </>
  )
}