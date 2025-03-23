'use client'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { RecentDetection } from "@/types/detection"
import { CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RecentDetectionsProps {
  className?: string
}

export function RecentDetections({ className }: RecentDetectionsProps) {
  const [recentDetections, setRecentDetections] = useState<RecentDetection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  // We'll fetch more items than we display to have data ready for pagination
  const fetchLimit = 50

  useEffect(() => {
    const fetchRecentDetections = async () => {
      try {
        setIsLoading(true)
        // Add limit parameter to fetch more items at once but display fewer per page
        const response = await fetch(`/api/fbdetection/recentDet?limit=${fetchLimit}`)
        
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
          setRecentDetections(data.data)
        } else {
          console.error('Unexpected API response structure:', data)
          setRecentDetections([])
        }
      } catch (error) {
        console.error("Error fetching recent detections:", error)
        setRecentDetections([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentDetections()
  }, [fetchLimit])

  // Get current page items
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = recentDetections.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(recentDetections.length / itemsPerPage)

  // Change page
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  // Function to format date to relative time (e.g., "2 days ago")
  const formatRelativeTime = (timestamp: number) => {
    const now = new Date()
    const detectionDate = new Date(timestamp)
    const diffInMs = now.getTime() - detectionDate.getTime()
    const diffInSecs = Math.floor(diffInMs / 1000)
    const diffInMins = Math.floor(diffInSecs / 60)
    const diffInHours = Math.floor(diffInMins / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInDays > 0) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`
    } else if (diffInHours > 0) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`
    } else if (diffInMins > 0) {
      return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`
    } else {
      return 'Just now'
    }
  }

  // Function to get status icon based on verification status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-amber-500" />
    }
  }

  // Function to get status badge based on verification status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verified</Badge>
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
      case 'pending':
      default:
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
    }
  }

  // Function to generate avatar fallback from species name
  const getAvatarFallback = (name: string) => {
    if (!name) return '??'
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle>Recent Detections</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-8">
            {Array(itemsPerPage).fill(0).map((_, i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="ml-4 space-y-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <div className="ml-auto">
                  <Skeleton className="h-6 w-[80px]" />
                </div>
              </div>
            ))}
          </div>
        ) : recentDetections.length === 0 ? (
          <div className="text-center py-12 border rounded-md bg-muted/10">
            <p className="text-muted-foreground">No recent detections found</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {currentItems.map((detection) => (
                <div key={detection.detectionID} className="flex items-center">
                  <Avatar className="h-12 w-12 border">
                    {detection.inputImageURL ? (
                      <AvatarImage src={detection.inputImageURL} alt={detection.scientificName || 'Species'} />
                    ) : null}
                    <AvatarFallback>{getAvatarFallback(detection.scientificName || '')}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none flex items-center gap-2">
                      {detection.scientificName || 'Unknown Species'}
                      {getStatusIcon(detection.curVeriStatus)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {detection.userName ? `Detected by ${detection.userName}` : 'Unknown user'} • 
                      {detection.imageLocation ? ` ${detection.imageLocation}` : ' Location unknown'}
                    </p>
                  </div>
                  <div className="ml-auto flex flex-col items-end gap-2">
                    {getStatusBadge(detection.curVeriStatus)}
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(detection.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between space-x-2 mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToPreviousPage} 
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Previous page</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={goToNextPage} 
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">Next page</span>
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
