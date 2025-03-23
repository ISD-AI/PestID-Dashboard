// components/species/detail-tabs/map-component.tsx
"use client";

import React, { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet"
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import "leaflet/dist/leaflet.css"
import { GBIFOccurrenceLocation } from '@/lib/gbif/types'

interface MapComponentProps {
  validLocations: GBIFOccurrenceLocation[]
}

export default function MapComponent({ validLocations }: MapComponentProps) {
  // Fix for Leaflet icon issues
  useEffect(() => {
    // Only run this code on the client
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png"
    });
  }, []);

  return (
    <MapContainer
      center={[0, 0]}
      zoom={2}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MarkerClusterGroup>
        {validLocations.map((location) => (
          <CircleMarker
            key={location.key || `${location.decimalLatitude}-${location.decimalLongitude}`}
            center={[location.decimalLatitude, location.decimalLongitude]}
            radius={5}
            fillColor="#8884d8"
            color="#6366f1"
            weight={1}
            opacity={0.8}
            fillOpacity={0.6}
          >
            <Popup>
              <div className="space-y-2">
                <p><strong>Location:</strong> {location.locality || 'Unknown'}</p>
                <p><strong>Date:</strong> {location.eventDate || 'Unknown'}</p>
                {location.habitat && (
                  <p><strong>Habitat:</strong> {location.habitat}</p>
                )}
                {location.countryCode && (
                  <p><strong>Country:</strong> {location.countryCode}</p>
                )}
                {location.stateProvince && (
                  <p><strong>State/Province:</strong> {location.stateProvince}</p>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}