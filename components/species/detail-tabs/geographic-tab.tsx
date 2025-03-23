"use client";

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import MarkerClusterGroup from 'react-leaflet-cluster'
import "leaflet/dist/leaflet.css"
import { GBIFDistribution, GBIFOccurrenceLocation } from '@/lib/gbif/types'
import dynamic from 'next/dynamic'

// Dynamically import the map component with SSR disabled
const MapWithNoSSR = dynamic(
  () => import('./map-component'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] rounded-lg flex items-center justify-center bg-muted">
        <span>Loading map...</span>
      </div>
    )
  }
)

interface GeographicTabProps {
  distributions?: GBIFDistribution[]
  locations?: GBIFOccurrenceLocation[]
}

export function GeographicTab({ 
  distributions = [], 
  locations = [] 
}: GeographicTabProps) {
  // Filter out locations without coordinates
  const validLocations = locations.filter(
    loc => loc.decimalLatitude && loc.decimalLongitude
  )

  // Group distributions by country for better organization
  const distributionsByCountry = distributions.reduce((acc, dist) => {
    if (dist.country) {
      if (!acc[dist.country]) {
        acc[dist.country] = []
      }
      acc[dist.country].push(dist)
    }
    return acc
  }, {} as Record<string, GBIFDistribution[]>)

  return (
    <div className="space-y-6">
      {/* Distribution Map */}
      {validLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Geographic Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] rounded-lg overflow-hidden">
            <MapWithNoSSR validLocations={validLocations} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Known Distributions */}
      {Object.keys(distributionsByCountry).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Known Distributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(distributionsByCountry).map(([country, dists]) => (
                <div key={country} className="p-4 border rounded-lg">
                  <div className="font-medium">{country}</div>
                  <div className="space-y-2 mt-2">
                    {dists.map((dist, index) => (
                      <div key={index} className="text-sm text-muted-foreground">
                        {dist.locality && (
                          <div>Locality: {dist.locality}</div>
                        )}
                        {dist.establishmentMeans && (
                          <div>Establishment: {dist.establishmentMeans}</div>
                        )}
                        {dist.occurrenceStatus && (
                          <div>Status: {dist.occurrenceStatus}</div>
                        )}
                        {dist.threatStatus && (
                          <div>Threat Status: {dist.threatStatus}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data Message */}
      {!validLocations.length && !Object.keys(distributionsByCountry).length && (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">No geographic data available for this species.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
