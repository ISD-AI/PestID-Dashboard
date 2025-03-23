'use client'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import dynamic from 'next/dynamic'
import type { LatLngTuple, Map as LeafletMap } from 'leaflet'
import { useEffect, useState, useRef } from 'react'
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapDetection } from "@/types/detection"

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

// Color mapping for different verification statuses
const statusColors = {
  verified: "#10b981", // green
  pending: "#f59e0b", // amber
  rejected: "#ef4444", // red
  default: "#6366f1" // indigo
}

interface SpeciesMapProps {
  className?: string
}

export function SpeciesMap({ className }: SpeciesMapProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [mapData, setMapData] = useState<MapDetection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const mapRef = useRef<LeafletMap>(null)

  // Australia center coordinates
  const australiaCenter: LatLngTuple = [-25.2744, 133.7751]

  useEffect(() => {
    setIsMounted(true)
    // Import Leaflet CSS
    require('leaflet/dist/leaflet.css')
  }, [])

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/fbdetection/map')
        
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
          setMapData(data.data)
        } else {
          console.error('Unexpected API response structure:', data)
          setMapData([])
        }
      } catch (error) {
        console.error("Error fetching map data:", error)
        setMapData([])
      } finally {
        setIsLoading(false)
      }
    }

    if (isMounted) {
      fetchMapData()
    }
  }, [isMounted])

  // Filter map data based on selected filter
  const filteredMapData = filter === "all" 
    ? mapData 
    : mapData.filter(item => item.curVeriStatus === filter)

  // Calculate statistics
  const totalPoints = mapData.length
  const verifiedPoints = mapData.filter(item => item.curVeriStatus === "verified").length
  const pendingPoints = mapData.filter(item => item.curVeriStatus === "pending").length
  const rejectedPoints = mapData.filter(item => item.curVeriStatus === "rejected").length

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-xl font-semibold">Species Distribution</CardTitle>
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              `${totalPoints} detection points across Australia`
            )}
          </div>
        </div>
        <Select defaultValue={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent className="select-content z-[9999]" sideOffset={5}>
            <SelectItem value="all">All Points</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {!isMounted || isLoading ? (
          <div className="w-full h-[400px] flex items-center justify-center">
            <Skeleton className="h-[400px] w-full" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: statusColors.verified }}></span>
                <span className="text-xs">Verified ({verifiedPoints})</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: statusColors.pending }}></span>
                <span className="text-xs">Pending ({pendingPoints})</span>
              </div>
              <div className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: statusColors.rejected }}></span>
                <span className="text-xs">Rejected ({rejectedPoints})</span>
              </div>
            </div>
            
            <div className="h-[400px] w-full rounded-md overflow-hidden border">
              <MapContainer
                center={australiaCenter}
                zoom={4}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {filteredMapData.map((detection, index) => {
                  // Skip if no valid coordinates
                  if (!detection.imageLat || !detection.imageLong) return null
                  
                  const position: LatLngTuple = [detection.imageLat, detection.imageLong]
                  const statusColor = statusColors[detection.curVeriStatus as keyof typeof statusColors] || statusColors.default
                  
                  return (
                    <CircleMarker
                      key={`${detection.detectionID}-${index}`}
                      center={position}
                      radius={8}
                      pathOptions={{
                        fillColor: statusColor,
                        fillOpacity: 0.7,
                        color: statusColor,
                        weight: 1
                      }}
                    >
                      <Popup>
                        <a href={`/dashboard/detections/${detection.detectionID}`} className="group">
                          <div className="p-1 max-w-[200px] bg-white shadow-md rounded-lg border border-gray-200">
                            <img 
                              src={detection.inputImageURL} 
                              alt={detection.scientificName || 'Unknown Species'} 
                              className="max-w-[180px] max-h-[120px] object-contain mb-1 rounded" 
                            />
                            <div className="text-xs text-gray-700 space-y-0.5">
                              <h3 className="font-semibold line-clamp-1">{detection.scientificName || 'Unknown Species'}</h3>
                              <p className="line-clamp-1">User: {detection.userName || 'Unknown'}</p>
                              <p className="line-clamp-1">Date: {new Date(detection.timestamp).toLocaleString()}</p>
                              <p className="line-clamp-1">Loc: {detection.imageLocation || detection.userLocation || 'Unknown'}</p>
                            </div>
                          </div>
                        </a>
                      </Popup>
                    </CircleMarker>
                  )
                })}
              </MapContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
