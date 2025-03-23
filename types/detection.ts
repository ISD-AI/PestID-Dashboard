// types/detection.ts

// Note: We don't extend the Metadata interface here because it represents raw Firestore data
// from PredictionMetaData, while these interfaces are UI-specific and include only processed,
// derived fields (e.g., imageLocation, userLocation) needed for dashboard components.
// This separation keeps UI types clean, flexible, and independent of the Firestore schema.

export interface Species {
  scientificName: string;
}

export interface GeographicCoverage {
  state: string;      // Abbreviation (NSW, QLD, etc.)
  fullName: string;   // Full name (New South Wales, Queensland, etc.)
  count: number;
  percentage: number;
}

// Base interface for common detection fields (Predictions collection)
export interface BaseDetection {
    detectionID: string;
    confScore: number;
    curVeriStatus: string;
    inputImageURL: string;
    predImageURL: string;
    pestType: string;
    timestamp: string; // ISO string from Firestore, e.g., "2025-02-24T10:32:35.230Z"
    userId: string;
    userName: string;
  }
  
  // Interface for metadata (PredictionMetaData collection)
  export interface Metadata {
    predictionId: string; // Links to detectionID in Predictions
    funFacts?: string;
    prompt?: string;
    imageCity?: string;
    imageRegion?: string;
    imageCountry?: string;
    imageLat: number | 0;
    imageLong: number | 0;
    pestType?: string;
    predTime?: number;
    scientificName?: string | null;
    aiModel?: string;
    userCity?: string;
    userRegion?: string;
    userCountry?: string;
    userLat: number;
    userLong: number;
  }
  
  // For paginated grid/table data with limits (extends BaseDetection, includes metadata)
  export interface PaginatedDetection extends BaseDetection {
    imageLat: number | null;
    imageLong: number | null;
    userLat: number;
    userLong: number;
    imageLocation?: string;
    userLocation?: string;
    scientificName?: string;
    funFacts?: string;
    aiModel?: string;
  }
  
  // For map data with popups and full dataset (extends BaseDetection, includes metadata and map-specific fields)
  export interface MapDetection extends BaseDetection {
    imageLat: number | 0;
    imageLong: number | 0;
    userLat: number;
    userLong: number;
    inputImageURL: string;
    userName: string;
    dateTime: string;
    imageLocation?: string;
    userLocation?: string;
    scientificName?: string;
    funFacts?: string;
    aiModel?: string;
    isUserLocation: boolean;
  }
  
  // For recent detections list in the dashboard
  export interface RecentDetection {
    detectionID: string;
    curVeriStatus: string;
    inputImageURL?: string;
    scientificName?: string;
    userName?: string;
    imageLocation?: string;
    imageLat?: number;
    imageLong?: number;
    timestamp: number; // Numeric timestamp for easier date calculations
  }
  
  // Interface for line chart data (aggregated detections over time)
  export interface ChartData {
    timestamp: string;
    value: number;
    scientificName?: string;
  }
  
  export interface VeriStats {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
    notPest?: number;
  }

 