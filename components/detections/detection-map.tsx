'use client';

import { useEffect, useRef, useState, memo } from 'react';
import { useInView } from 'react-intersection-observer';
import type { Map as LeafletMap } from 'leaflet';
import { MapDetection, Species } from '@/types/detection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Filter, X, Calendar, Search, Check } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface DetectionMapProps {
  detections: MapDetection[];
  // Filter props
  yearRange?: [number, number];
  setYearRange?: (range: [number, number]) => void;
  monthRange?: [number, number];
  setMonthRange?: (range: [number, number]) => void;
  speciesInput?: string;
  setSpeciesInput?: (input: string) => void;
  selectedSpecies?: string | null;
  setSelectedSpecies?: (species: string | null) => void;
  showSuggestions?: boolean;
  setShowSuggestions?: (show: boolean) => void;
  speciesList?: Species[] | null;
  // Display control
  showFilterToggle?: boolean; 
  initialFilterVisibility?: boolean; 
  mapHeight?: string; 
}

function DetectionMapComponent({
  detections,
  yearRange = [2024, new Date().getFullYear()],
  setYearRange = () => {},
  monthRange = [1, 12],
  setMonthRange = () => {},
  speciesInput = '',
  setSpeciesInput = () => {},
  selectedSpecies = null,
  setSelectedSpecies = () => {},
  showSuggestions = false,
  setShowSuggestions = () => {},
  speciesList = null,
  showFilterToggle = true, 
  initialFilterVisibility = false, 
  mapHeight = '500px', 
}: DetectionMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [showFilters, setShowFilters] = useState(initialFilterVisibility);

  const { ref: observerRef, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const monthsShort = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  useEffect(() => {
    if (!inView || mapInitialized) return;

    const initializeMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');
        await import('leaflet.markercluster');
        await import('leaflet.markercluster/dist/MarkerCluster.css');
        await import('leaflet.markercluster/dist/MarkerCluster.Default.css');

        if (!mapContainer.current) return;

        if (mapInstance.current) {
          mapInstance.current.remove();
          mapInstance.current = null;
        }

        mapInstance.current = L.map(mapContainer.current).setView([-25.2744, 133.7751], 3);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: ' OpenStreetMap contributors',
        }).addTo(mapInstance.current);

        setMapInitialized(true);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeMap();
  }, [inView, mapInitialized]);

  useEffect(() => {
    if (!mapInstance.current || !mapInitialized) return;

    const L = require('leaflet');

    const markers = new L.MarkerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });

    // Count for debugging
    let validMarkersCount = 0;
    let invalidMarkersCount = 0;
    let missingCoordinatesCount = 0;

    detections.forEach((detection) => {
      const hasValidImageCoords =
        detection.imageLat && detection.imageLong && detection.imageLat !== 0 && detection.imageLong !== 0;
      const hasValidUserCoords =
        detection.userLat && detection.userLong && detection.userLat !== 0 && detection.userLong !== 0;
      
      // Skip if both coordinates are missing or invalid
      if (!hasValidImageCoords && !hasValidUserCoords) {
        missingCoordinatesCount++;
        return;
      }

      const lat = hasValidImageCoords ? detection.imageLat! : detection.userLat!;
      const long = hasValidImageCoords ? detection.imageLong! : detection.userLong!;

      // Additional validation for coordinates
      if (!lat || !long || lat === 0 || long === 0 || 
          !isFinite(lat) || !isFinite(long) ||
          Math.abs(lat) > 90 || Math.abs(long) > 180) {
        invalidMarkersCount++;
        return;
      }

      validMarkersCount++;

      const icon = L.divIcon({
        html: `
          <div class="relative p-1 bg-white rounded-full shadow-lg transition-transform hover:scale-110">
            <div class="w-4 h-4 ${detection.isUserLocation ? 'bg-blue-500' : 'bg-green-500'} rounded-full"></div>
          </div>
        `,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([lat, long], { icon }).on('click', () =>
        handleMarkerClick(String(detection.detectionID), [lat, long])
      );
      markers.addLayer(marker);
    });

    // Log debugging information
    console.log('Map Markers Debug:', {
      totalDetections: detections.length,
      validMarkers: validMarkersCount,
      invalidMarkers: invalidMarkersCount,
      missingCoordinates: missingCoordinatesCount,
      totalAccounted: validMarkersCount + invalidMarkersCount + missingCoordinatesCount
    });

    mapInstance.current.eachLayer((layer) => {
      if (layer instanceof L.MarkerClusterGroup) {
        mapInstance.current?.removeLayer(layer);
      }
    });
    mapInstance.current.addLayer(markers);

    if (detections.length > 0) {
      const validDetections = detections.filter(
        (d) =>
          (d.imageLat && d.imageLong && d.imageLat !== 0 && d.imageLong !== 0) ||
          (d.userLat && d.userLong && d.userLat !== 0 && d.userLong !== 0)
      );
      if (validDetections.length > 0) {
        const bounds = L.latLngBounds(
          validDetections.map((d) => [
            d.imageLat && d.imageLat !== 0 ? d.imageLat : d.userLat!,
            d.imageLong && d.imageLong !== 0 ? d.imageLong : d.userLong!,
          ])
        );
        mapInstance.current.fitBounds(bounds, { padding: [100, 100], maxZoom: 10 });
      }
    }
  }, [detections, mapInitialized]);

  const handleMarkerClick = async (detectionId: string, position: [number, number]) => {

    if (mapInstance.current) {
      mapInstance.current.openPopup(
        `
          <div class="p-1 max-w-[200px] bg-white shadow-md rounded-lg border border-gray-200 flex items-center justify-center">
            <svg class="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="ml-2 text-xs text-gray-700">Loading...</span>
          </div>
        `,
        position
      );
    }

    try {
      const response = await fetch(`/api/fbdetection/${detectionId}`);
      if (!response.ok) throw new Error('Failed to fetch detection details');
      const { data } = await response.json();
      const detection = data.detection;

      if (detection && mapInstance.current) {
        const lat = detection.imageLat && detection.imageLat !== 0 ? detection.imageLat : detection.userLat;
        const long = detection.imageLong && detection.imageLong !== 0 ? detection.imageLong : detection.userLong;

        if (
          typeof lat === 'number' && typeof long === 'number' &&
          !isNaN(lat) && !isNaN(long) &&
          lat !== 0 && long !== 0
        ) {
          mapInstance.current.openPopup(
            `
              <a href="/dashboard/detections/${detection.detectionID}" class="group">
                <div class="p-1 max-w-[200px] bg-white shadow-md rounded-lg border border-gray-200">
                  <img src="${detection.inputImageURL}" alt="${detection.scientificName}" class="max-w-[180px] max-h-[120px] object-contain mb-1 rounded" />
                  <div class="text-xs text-gray-700 space-y-0.5">
                    <h3 class="font-semibold line-clamp-1">${detection.scientificName}</h3>
                    <p class="line-clamp-1">User: ${detection.userName}</p>
                    <p class="line-clamp-1">Date: ${detection.dateTime}</p>
                    <p class="line-clamp-1">Loc: ${detection.isUserLocation ? detection.userLocation : detection.imageLocation}</p>
                  </div>
                </div>
              </a>
            `,
            [lat, long]
          );
        } else {
          console.error('Invalid coordinates:', { lat, long });
          mapInstance.current.openPopup(
            `
              <div class="p-1 max-w-[200px] bg-white shadow-md rounded-lg border border-gray-200">
                <p class="text-xs text-gray-700">Invalid location data</p>
              </div>
            `,
            position
          );
        }
      }
    } catch (error) {
      console.error('Error fetching detection details:', error);
      if (mapInstance.current) {
        mapInstance.current.openPopup(
          `
            <div class="p-1 max-w-[200px] bg-white shadow-md rounded-lg border border-gray-200">
              <p class="text-xs text-red-700">Error loading data</p>
            </div>
          `,
          position
        );
      }
    } finally {
    }
  };

  // Type definitions for the dual thumb slider
  interface DualSliderProps {
    min: number;
    max: number;
    minValue: number;
    maxValue: number;
    onChange: (values: [number, number]) => void;
    title: string;
    valueFormatter?: (value: number) => string;
    className?: string;
    icon?: React.ReactNode;
    marks?: boolean;
  }

  const DualThumbSlider = ({ min, max, minValue, maxValue, onChange, title, valueFormatter, className, marks = false }: DualSliderProps) => {
    // Calculate positions for the UI (percentages)
    const range = max - min;
    const leftPosition = ((minValue - min) / range) * 100;
    const rightPosition = ((maxValue - min) / range) * 100;
    const width = rightPosition - leftPosition;
    
    const trackRef = useRef<HTMLDivElement>(null);
    
    const formatter = valueFormatter || ((value: number) => `${value}`);
    
    const handleMinMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!trackRef.current) return;
      
      // Prevent text selection
      e.preventDefault();
      
      // Add a class to the body to prevent text selection during drag
      document.body.classList.add('no-select');
      
      const trackRect = trackRef.current.getBoundingClientRect();
      const moveHandler = (moveEvent: MouseEvent) => {
        // Prevent default to avoid text selection
        moveEvent.preventDefault();
        
        // Calculate position but constrain it to the track boundaries
        const posX = Math.max(0, Math.min(moveEvent.clientX - trackRect.left, trackRect.width));
        const posPercentage = (posX / trackRect.width) * 100;
        const newMinValue = Math.max(min, Math.min(Math.round(min + (posPercentage / 100) * range), max));
        
        // Ensure min doesn't exceed max
        if (newMinValue < maxValue) {
          onChange([newMinValue, maxValue]);
        }
      };
      
      const upHandler = () => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        
        // Remove the no-select class when done dragging
        document.body.classList.remove('no-select');
      };
      
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
    };
    
    const handleMaxMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!trackRef.current) return;
      
      // Prevent text selection
      e.preventDefault();
      
      // Add a class to the body to prevent text selection during drag
      document.body.classList.add('no-select');
      
      const trackRect = trackRef.current.getBoundingClientRect();
      const moveHandler = (moveEvent: MouseEvent) => {
        // Prevent default to avoid text selection
        moveEvent.preventDefault();
        
        // Calculate position but constrain it to the track boundaries
        const posX = Math.max(0, Math.min(moveEvent.clientX - trackRect.left, trackRect.width));
        const posPercentage = (posX / trackRect.width) * 100;
        const newMaxValue = Math.max(min, Math.min(Math.round(min + (posPercentage / 100) * range), max));
        
        // Ensure max doesn't go below min
        if (newMaxValue > minValue) {
          onChange([minValue, newMaxValue]);
        }
      };
      
      const upHandler = () => {
        document.removeEventListener('mousemove', moveHandler);
        document.removeEventListener('mouseup', upHandler);
        
        // Remove the no-select class when done dragging
        document.body.classList.remove('no-select');
      };
      
      document.addEventListener('mousemove', moveHandler);
      document.addEventListener('mouseup', upHandler);
    };
    
    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMin = parseInt(e.target.value);
      if (newMin <= maxValue) {
        onChange([newMin, maxValue]);
      }
    };
    
    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMax = parseInt(e.target.value);
      if (newMax >= minValue) {
        onChange([minValue, newMax]);
      }
    };
    
    const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current) return;
      
      const trackRect = trackRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(e.clientX - trackRect.left, trackRect.width));
      const clickPercentage = (clickX / trackRect.width) * 100;
      const clickValue = Math.max(min, Math.min(Math.round(min + (clickPercentage / 100) * range), max));
      
      // Determine which thumb to move based on distance
      const distToMin = Math.abs(((minValue - min) / range) * 100 - clickPercentage);
      const distToMax = Math.abs(((maxValue - min) / range) * 100 - clickPercentage);
      
      if (distToMin <= distToMax) {
        onChange([clickValue, maxValue]);
      } else {
        onChange([minValue, clickValue]);
      }
    };
    
    return (
      <div className={`p-4 rounded-xl bg-white/70 backdrop-blur-sm shadow-md ${className || ''}`}>
        <div className="flex items-center mb-2">
          {title && <h3 className="text-sm font-medium text-foreground">{title}</h3>}
        </div>
        
        <div className="relative py-5 px-2 group">
          {/* Track background */}
          <div 
            ref={trackRef}
            className="absolute h-2 inset-x-2 bg-muted/80 rounded-full cursor-pointer"
            onClick={handleTrackClick}
          />
          
          {/* Selected range */}
          <div
            className="absolute h-2 rounded-full bg-gradient-to-r from-primary/70 to-primary shadow-sm"
            style={{
              left: `${leftPosition}%`,
              width: `${width}%`,
            }}
          />
          
          {/* Thumb Min */}
          <motion.div
            className="absolute w-5 h-5 -mt-1.5 bg-white border-2 border-primary rounded-full shadow-md cursor-grab active:cursor-grabbing z-10"
            style={{ left: `${leftPosition}%` }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onMouseDown={handleMinMove}
          >
            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-primary text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {formatter(minValue)}
            </div>
          </motion.div>
          
          {/* Thumb Max */}
          <motion.div
            className="absolute w-5 h-5 -mt-1.5 bg-white border-2 border-primary rounded-full shadow-md cursor-grab active:cursor-grabbing z-10"
            style={{ left: `${rightPosition}%` }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onMouseDown={handleMaxMove}
          >
            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-primary text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {formatter(maxValue)}
            </div>
          </motion.div>
          
          {/* For touch interfaces, use two separate inputs for min and max */}
          <input
            type="range"
            min={min}
            max={max}
            value={minValue}
            onChange={handleMinChange}
            className="absolute inset-0 opacity-0 w-1/2 h-full cursor-pointer z-0"
            aria-label={`Adjust minimum ${title}`}
          />
          <input
            type="range"
            min={min}
            max={max}
            value={maxValue}
            onChange={handleMaxChange}
            className="absolute top-0 right-0 opacity-0 w-1/2 h-full cursor-pointer z-0"
            aria-label={`Adjust maximum ${title}`}
          />
          
          {/* Markers */}
          {marks && (
            <div className="absolute inset-x-2 top-3 flex justify-between">
              {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((mark) => (
                <div 
                  key={mark} 
                  className={`h-3 w-px -mt-2 bg-muted/50 ${mark >= minValue && mark <= maxValue && "bg-primary/60"}`}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Value display */}
        <div className="flex justify-between text-xs mt-1">
          <span className="font-medium text-foreground">{formatter(minValue)}</span>
          <span className="text-muted-foreground">Selected Range</span>
          <span className="font-medium text-foreground">{formatter(maxValue)}</span>
        </div>
      </div>
    );
  };

  const exportFilteredDataAsCSV = () => {
    try {
      // Generate timestamp and filename
      const timeRange = `${yearRange[0]}-${monthRange[0]}_to_${yearRange[1]}-${monthRange[1]}`;
      const speciesTag = selectedSpecies ? `-${selectedSpecies.replace(/\s+/g, '_')}` : '';
      const fileName = `PestID-Coordinates${speciesTag}-${timeRange}.csv`;
      
      // CSV Headers
      const headers = [
        "Count",
        "ID",
        "Discovered Date",
        "Species Name",
        "Image Link",
        "Image Coordinates (Lat|Long)",
        "Image Location",
        "User Coordinates (Lat|Long)",
        "User Location"
      ];
      
      // Helper function to escape CSV field values properly
      const escapeCSV = (value: string) => {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };
      
      // Ensure we're using the current detections array
      const currentDetections = [...detections];

      // Format data for CSV with proper escaping
      const csvData = currentDetections.map((detection, index) => {
        // Handle null/undefined values
        const safeImageLat = detection.imageLat || 0;
        const safeImageLong = detection.imageLong || 0;
        const safeUserLat = detection.userLat || 0;
        const safeUserLong = detection.userLong || 0;
        
        return [
          escapeCSV((index + 1).toString()),
          escapeCSV(detection.detectionID || ''),
          escapeCSV(new Date(detection.timestamp).toLocaleDateString()),
          escapeCSV(detection.scientificName || 'Unknown'),
          escapeCSV(detection.inputImageURL || ''),
          escapeCSV(`${safeImageLat}|${safeImageLong}`),
          escapeCSV(detection.imageLocation || 'Unknown'),
          escapeCSV(`${safeUserLat}|${safeUserLong}`),
          escapeCSV(detection.userLocation || 'Unknown')
        ];
      });
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');
      
      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
      // You can add a toast notification here if you have a toast library
    }
  };

  useEffect(() => {
    // Add the style for the no-select class
    const style = document.createElement('style');
    style.innerHTML = `
      .no-select {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="relative" ref={observerRef}>
      <div
        ref={mapContainer}
        className={`w-full ${mapHeight ? `h-[${mapHeight}]` : 'h-[500px]'} min-h-[400px] relative rounded-xl overflow-hidden shadow-md`}
        style={{ height: mapHeight }}
      >
        {!mapInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
            <svg
              className="animate-spin h-8 w-8 text-primary/70"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}
      </div>

      {/* Map Legends and Filters */}
      <div className="mt-4 space-y-4">
        {/* Legends */}
        <div className="flex justify-center items-center space-x-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2 shadow-sm"></div>
            <span className="text-muted-foreground">Image Location</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 shadow-sm"></div>
            <span className="text-muted-foreground">User Location</span>
          </div>
        </div>

        {/* Filter Toggle Button - Only show if showFilterToggle is true */}
        {showFilterToggle && (
          <div className="flex justify-center">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="group transition-all duration-300 hover:bg-muted/50"
              >
                <Filter className="h-4 w-4 mr-1" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
                <motion.div
                  animate={{ rotate: showFilters ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="ml-1"
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </Button>
            </motion.div>
          </div>
        )}

        {/* Filter UI - Card Based Design */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="max-h-[400px] overflow-y-auto" 
          >
            <Card className="mt-4 overflow-hidden shadow-md border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Filter className="h-5 w-5 mr-2 text-primary" />
                  Detection Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 pt-2">
                {/* Time Period Filter */}
                <div className="space-y-6">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-primary" />
                    <h3 className="text-sm font-medium">Time Period</h3>
                  </div>
                  
                  <div className="space-y-6 pl-6">
                    {/* Year Range Slider */}
                    <DualThumbSlider
                      min={2024}
                      max={2025}
                      minValue={yearRange[0]}
                      maxValue={yearRange[1]}
                      onChange={(values) => setYearRange(values)}
                      title="Year Range"
                      className="mb-6"
                      marks
                    />
                    
                    {/* Month Range Slider */}
                    <div className="mt-8">
                      <DualThumbSlider
                        min={1}
                        max={12}
                        minValue={monthRange[0]}
                        maxValue={monthRange[1]}
                        onChange={(values) => setMonthRange(values)}
                        title="Month Range"
                        valueFormatter={(val) => monthsShort[val - 1]}
                        marks
                      />
                      
                      {/* Month Labels */}
                      <div className="flex justify-between text-xs mt-2 px-2 text-muted-foreground">
                        <span>{months[0]}</span>
                        <span className="hidden md:inline">{months[3]}</span>
                        <span className="hidden md:inline">{months[6]}</span>
                        <span className="hidden md:inline">{months[9]}</span>
                        <span>{months[11]}</span>
                      </div>
                    </div>
                    
                    {/* Time period summary */}
                    <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 mt-3">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-muted-foreground">Selected time period:</span>
                      </div>
                      <p className="mt-1 font-medium">
                        {months[monthRange[0] - 1]} {yearRange[0]} – {months[monthRange[1] - 1]} {yearRange[1]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Species Search */}
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Search className="h-4 w-4 mr-2 text-primary" />
                    <h3 className="text-sm font-medium">Species Search</h3>
                  </div>
                  
                  <div className="relative pl-6">
                    <div className="relative">
                      <div className="flex items-center border rounded-md border-border bg-background shadow-sm">
                        <input
                          type="text"
                          placeholder="Search for a species..."
                          value={speciesInput}
                          onChange={(e) => {
                            setSpeciesInput(e.target.value);
                            if (e.target.value.length > 1) {
                              setShowSuggestions(true);
                            } else {
                              setShowSuggestions(false);
                            }
                          }}
                          onClick={() => {
                            if (speciesInput.length > 1) {
                              setShowSuggestions(true);
                            }
                          }}
                          className="w-full py-2 px-3 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm"
                        />
                        {speciesInput && (
                          <button 
                            className="p-2 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setSpeciesInput('');
                              setSelectedSpecies(null);
                              setShowSuggestions(false);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Species Suggestions */}
                      {showSuggestions && speciesList && (
                        <div className="absolute z-10 mt-1 w-full bg-background border border-border rounded-md shadow-md max-h-[200px] overflow-y-auto">
                          {speciesList.filter(species => 
                            species.scientificName.toLowerCase().includes(speciesInput.toLowerCase())
                          ).length > 0 ? (
                            <div>
                              {speciesList
                                .filter(species => species.scientificName.toLowerCase().includes(speciesInput.toLowerCase()))
                                .slice(0, 6)
                                .map(species => (
                                  <div 
                                    key={species.scientificName} 
                                    className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 cursor-pointer"
                                    onClick={() => {
                                      setSelectedSpecies(species.scientificName);
                                      setSpeciesInput(species.scientificName);
                                      setShowSuggestions(false);
                                    }}
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{species.scientificName}</div>
                                      <div className="text-xs text-muted-foreground">{species.scientificName.length} detections</div>
                                    </div>
                                    {selectedSpecies === species.scientificName && (
                                      <Check className="h-4 w-4 text-primary/80" />
                                    )}
                                  </div>
                                ))
                              }
                            </div>
                          ) : (
                            <div className="px-3 py-2 text-sm text-muted-foreground">No species found</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Selected Species */}
                    {selectedSpecies && (
                      <div className="mt-2">
                        <Badge 
                          variant="outline" 
                          className="bg-primary/10 text-primary/90 hover:bg-primary/20 border-primary/20"
                        >
                          {selectedSpecies}
                          <button
                            className="ml-2 text-primary/60 hover:text-primary"
                            onClick={() => {
                              setSelectedSpecies(null);
                              setSpeciesInput('');
                            }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-between pt-2 border-t border-border/50">
                  <div className="flex flex-wrap gap-2">
                    {(selectedSpecies || yearRange[0] > 2024 || yearRange[1] < 2025 || monthRange[0] > 1 || monthRange[1] < 12) && (
                      <div className="flex flex-wrap gap-2">
                        {selectedSpecies && (
                          <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 shadow-sm">
                            <span className="truncate max-w-[120px]">{selectedSpecies}</span>
                            <button 
                              onClick={() => {
                                setSpeciesInput('');
                                setSelectedSpecies(null);
                              }}
                              className="ml-1 hover:text-primary/80"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )}
                        
                        {(yearRange[0] > 2024 || yearRange[1] < 2025) && (
                          <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 shadow-sm">
                            Years: {yearRange[0]}–{yearRange[1]}
                          </Badge>
                        )}
                        
                        {(monthRange[0] > 1 || monthRange[1] < 12) && (
                          <Badge variant="outline" className="bg-primary/10 text-primary hover:bg-primary/20 shadow-sm">
                            Months: {monthsShort[monthRange[0] - 1]}–{monthsShort[monthRange[1] - 1]}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    onClick={exportFilteredDataAsCSV}
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap bg-green-200 text-green-600 border-green-200"
                    disabled={detections.length === 0}
                  >
                    <svg 
                      className="h-3.5 w-3.5 mr-1" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                  </Button>
                    <Button
                      onClick={() => {
                        setSpeciesInput('');
                        setSelectedSpecies(null);
                        setShowSuggestions(false);
                        setYearRange([2024, 2025]);
                        setMonthRange([1, 12]);
                      }}
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                    >
                      <X className="h-3.5 w-3.5 mr-1" />
                      Reset All
                    </Button>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export const DetectionMap = memo(DetectionMapComponent);