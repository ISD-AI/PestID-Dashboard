import { db } from './config';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  limit as limitQuery, 
  orderBy, 
  startAfter,
  Timestamp,
} from 'firebase/firestore';
import { MapDetection, PaginatedDetection, Metadata, ChartData, VeriStats, GeographicCoverage } from '@/types/detection';
import { getAllUsers } from './queryUsers'; // Import getAllUsers instead of getUserById
import { User } from '@/types/user';

// Cache users globally to avoid repeated fetches (scoped to this module)
let usersCache: Map<string, User> | null = null;

async function fetchAndCacheUsers(): Promise<Map<string, User>> {
  if (!usersCache) {
    const users = await getAllUsers();
    usersCache = new Map(users.map(user => [user.userId, user]));
  }
  return usersCache;
}

// Type definitions for API parameters
interface GetDetectionsParams {
  limit?: number;
  startAfterDoc?: any; // Firestore DocumentSnapshot
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface GetMapDetectionsParams {
  startDate?: string; // ISO string, e.g., "2023-07-01T00:00:00Z"
  endDate?: string; // ISO string, e.g., "2023-12-31T23:59:59Z"
  scientificName?: string;
  status?: string;
}

export async function getRecentDetections(limit: number = 100): Promise<PaginatedDetection[]> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    //const pastDate = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000); // Approx Oct 1, 2024
    const startTimestamp = Timestamp.fromDate(sevenDaysAgo);

    const predictionsRef = collection(db, 'Predictions');
    const q = query(
      predictionsRef,
      where('timestamp', '>=', startTimestamp),
      orderBy('timestamp', 'desc'),
      limitQuery(limit)
    );
    const querySnapshot = await getDocs(q);

    const detections: PaginatedDetection[] = [];
    const detectionIds: string[] = [];

    querySnapshot.forEach((doc) => {
      detectionIds.push(doc.id);
    });

    const metadataPromises = detectionIds.map(async (detectionId) => {
      const metadataQuery = query(
        collection(db, 'PredictionMetaData'),
        where('predictionId', '==', detectionId)
      );
      const metadataSnapshot = await getDocs(metadataQuery);
      return metadataSnapshot.docs.map((doc) => doc.data() as Metadata);
    });

    const metadataResults = await Promise.all(metadataPromises);
    const metadataMap = new Map<string, Metadata>();
    metadataResults.forEach((metadataArray, index) => {
      if (metadataArray.length > 0) {
        metadataMap.set(detectionIds[index], metadataArray[0]);
      }
    });

    const users = await fetchAndCacheUsers();

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const timestamp = data.timestamp instanceof Timestamp
        ? data.timestamp.toDate().toISOString()
        : new Date().toISOString();
      const metadata = metadataMap.get(doc.id);
      const user = users.get(data.userId);

      const detection: PaginatedDetection = {
        detectionID: doc.id,
        confScore: data.confScore || 0,
        curVeriStatus: data.curVeriStatus || 'pending',
        inputImageURL: data.inputImageURL || '',
        predImageURL: data.predImageURL || '',
        pestType: data.pestType || '',
        timestamp,
        userId: data.userId || '',
        userName: user?.name || 'Deleted User',
        imageLat: metadata?.imageLat || null,
        imageLong: metadata?.imageLong || null,
        userLat: metadata?.userLat || 0,
        userLong: metadata?.userLong || 0,
        imageLocation: metadata
          ? [metadata.imageCity, metadata.imageRegion, metadata.imageCountry].filter(Boolean).join(', ') || 'Unknown'
          : 'Unknown',
        userLocation: metadata
          ? [metadata.userCity, metadata.userRegion, metadata.userCountry].filter(Boolean).join(', ') || 'Unknown'
          : 'Unknown',
        scientificName: metadata?.scientificName || 'Unknown',
        funFacts: metadata?.funFacts || '',
        aiModel: metadata?.scientificName ? 'YOLO_PIXTRAL' : 'PIXTRAL',
      };

      detections.push(detection);
    }

    return detections;
  } catch (error) {
    console.error('Error getting recent detections:', error);
    throw error;
  }
}

// Function to get paginated data for table/grid view
export async function getPaginatedDetections({
  limit = 10,
  startAfterDoc,
  status,
  sortBy = 'timestamp',
  sortOrder = 'desc',
}: GetDetectionsParams): Promise<{
  detections: PaginatedDetection[];
  pagination: {
    limit: number;
    lastDoc: any; // Return last document for next pagination
    hasMore: boolean;
  };
 }> {
  try {
    const constraints: any[] = [];

    if (status) {
      constraints.push(where('curVeriStatus', '==', status));
    }

    constraints.push(orderBy(sortBy, sortOrder));
    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }
    constraints.push(limitQuery(limit));

    const predictionsRef = collection(db, 'Predictions');
    const q = query(predictionsRef, ...constraints);
    const querySnapshot = await getDocs(q);

    const detections: PaginatedDetection[] = [];
    const detectionIds: string[] = [];

    querySnapshot.forEach((doc) => {
      detectionIds.push(doc.id);
    });

    const metadataPromises = detectionIds.map(async (detectionId) => {
      const metadataQuery = query(
        collection(db, 'PredictionMetaData'),
        where('predictionId', '==', detectionId)
      );
      const metadataSnapshot = await getDocs(metadataQuery);
      return metadataSnapshot.docs.map((doc) => doc.data() as Metadata);
    });

    const metadataResults = await Promise.all(metadataPromises);
    const metadataMap = new Map<string, Metadata>();
    metadataResults.forEach((metadataArray, index) => {
      if (metadataArray.length > 0) {
        metadataMap.set(detectionIds[index], metadataArray[0]);
      }
    });

    const users = await fetchAndCacheUsers();

    for (const doc of querySnapshot.docs) {
      const data = doc.data();
      const timestamp = data.timestamp instanceof Timestamp
        ? data.timestamp.toDate().toISOString()
        : new Date().toISOString();
      const metadata = metadataMap.get(doc.id);
      const user = users.get(data.userId);

      const detection: PaginatedDetection = {
        detectionID: doc.id,
        confScore: data.confScore || 0,
        curVeriStatus: data.curVeriStatus || 'pending',
        inputImageURL: data.inputImageURL || '',
        predImageURL: data.predImageURL || '',
        pestType: data.pestType || '',
        timestamp,
        userId: data.userId || '',
        userName: user?.name || 'Deleted User',
        imageLat: metadata?.imageLat || null,
        imageLong: metadata?.imageLong || null,
        userLat: metadata?.userLat || 0,
        userLong: metadata?.userLong || 0,
        imageLocation: metadata
          ? [metadata.imageCity, metadata.imageRegion, metadata.imageCountry]
              .filter(Boolean)
              .join(', ') || 'Unknown'
          : 'Unknown',
        userLocation: metadata
          ? [metadata.userCity, metadata.userRegion, metadata.userCountry]
              .filter(Boolean)
              .join(', ') || 'Unknown'
          : 'Unknown',
        scientificName: metadata?.scientificName || 'Unknown',
        funFacts: metadata?.funFacts || '',
        aiModel: metadata?.scientificName ? 'YOLO_PIXTRAL' : 'PIXTRAL',
      };

      detections.push(detection);
    }

    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

    return {
      detections,
      pagination: {
        limit,
        lastDoc, // Return last document instead of offset
        hasMore: detections.length === limit,
      },
    };
  } catch (error) {
    console.error('Error getting detections:', error);
    throw error;
  }
}

// Function to query stats
export async function queryVeriStats(): Promise<{veriStats: VeriStats}> {
  
  const predictionsRef = collection(db, 'Predictions');
  const allQuery = query(predictionsRef); // Query to get all documents
  const pendingQuery = query(predictionsRef, where('curVeriStatus', '==', 'pending'));
  const verifiedQuery = query(predictionsRef, where('curVeriStatus', '==', 'verified'));
  const rejectedQuery = query(predictionsRef, where('curVeriStatus', '==', 'rejected'));
  const notPestQuery = query(predictionsRef, where('curVeriStatus', '==', 'not pest'));

  const [allSnapshot, pendingSnapshot, verifiedSnapshot, rejectedSnapshot, notPestSnapshot] = await Promise.all([
    getDocs(allQuery),
    getDocs(pendingQuery),
    getDocs(verifiedQuery),
    getDocs(rejectedQuery),
    getDocs(notPestQuery),
  ]);

  const veriStats: VeriStats = {
    total: allSnapshot.size,
    pending: pendingSnapshot.size,
    verified: verifiedSnapshot.size,
    rejected: rejectedSnapshot.size,
    notPest: notPestSnapshot.size,
  };

  return {veriStats};
}

// For Detail View 
export async function getDetectionById(id: string): Promise<{ detection: MapDetection | null; metadata: Metadata | null }> {
  try {
    const detectionSnap = await getDoc(doc(db, 'Predictions', id));
    
    if (!detectionSnap.exists()) {
      return { detection: null, metadata: null };
    }

    const data = detectionSnap.data();
    const timestamp = data.timestamp instanceof Timestamp 
      ? data.timestamp.toDate().toISOString()
      : new Date().toISOString();
    
    const detection: MapDetection = {
      detectionID: detectionSnap.id,
      confScore: data.confScore || 0,
      curVeriStatus: data.curVeriStatus || 'pending',
      inputImageURL: data.inputImageURL || '',
      predImageURL: data.predImageURL || '',
      pestType: data.pestType || '',
      timestamp,
      userId: data.userId || '',
      imageLat: 0,
      imageLong: 0,
      userLat: 0,
      userLong: 0,
      userName: 'Unknown User', // Will be updated below
      dateTime: new Date(timestamp).toLocaleString(),
      imageLocation: 'Unknown',
      userLocation: 'Unknown',
      scientificName: '',
      funFacts: '',
      aiModel: '',
      isUserLocation: false,
    };

    const metadataQuery = query(
      collection(db, 'PredictionMetaData'),
      where('predictionId', '==', id)
    );
    const metadataSnap = await getDocs(metadataQuery);
    if (!metadataSnap.empty) {
      const metaData = metadataSnap.docs[0].data() as Metadata;
      detection.imageLat = metaData.imageLat || 0;
      detection.imageLong = metaData.imageLong || 0;
      detection.userLat = metaData.userLat || 0;
      detection.userLong = metaData.userLong || 0;
      detection.imageLocation = [metaData.imageCity, metaData.imageRegion, metaData.imageCountry]
        .filter(Boolean)
        .join(', ') || 'Unknown';
      detection.userLocation = [metaData.userCity, metaData.userRegion, metaData.userCountry]
        .filter(Boolean)
        .join(', ') || 'Unknown';
      detection.scientificName = metaData.scientificName || 'Unknown';
      detection.funFacts = metaData.funFacts || '';
      detection.aiModel = detection.scientificName ? 'PIXTRAL_YOLO' : 'PIXTRAL';
      detection.isUserLocation = !metaData.imageLat || metaData.imageLat === 0;
    }

    // Fetch and use cached users
    const users = await fetchAndCacheUsers();
    const user = users.get(data.userId);
    detection.userName = user?.name || 'Deleted User';

    return { detection, metadata: metadataSnap.empty ? null : metadataSnap.docs[0].data() as Metadata };
  } catch (error) {
    console.error('Error getting detection by ID:', error);
    throw error;
  }
}


/**
 * Fetches all detection data for the interactive map with image popups.
 * @returns A promise resolving to an array of MapDetection objects.
 */
export async function getMapDetections({
  startDate,
  endDate,
  scientificName,
  status,
}: GetMapDetectionsParams = {}): Promise<MapDetection[]> {
  const detectionsRef = collection(db, 'Predictions');
  const constraints: any[] = [];

  // Apply date range filter if provided
  if (startDate && endDate) {
    const startTimestamp = Timestamp.fromDate(new Date(startDate));
    const endTimestamp = Timestamp.fromDate(new Date(endDate));
    constraints.push(
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<=', endTimestamp)
    );
  }

  // Apply verification status filter if provided
  if (status) {
    constraints.push(where('curVeriStatus', '==', status));
  }

  // Always order by timestamp
  constraints.push(orderBy('timestamp', 'desc'));

  const detectionsQuery = query(detectionsRef, ...constraints);
  const detectionsSnap = await getDocs(detectionsQuery);

  const detections: MapDetection[] = [];
  const detectionIds = detectionsSnap.docs.map(doc => doc.id);
  
  // Batch fetch metadata for better performance
  const metadataPromises = detectionIds.map(async (detectionId) => {
    const metadataQuery = query(
      collection(db, 'PredictionMetaData'),
      where('predictionId', '==', detectionId)
    );
    const metadataSnapshot = await getDocs(metadataQuery);
    return { 
      id: detectionId, 
      metadata: metadataSnapshot.docs[0]?.data() as Metadata | undefined 
    };
  });
  
  const metadataResults = await Promise.all(metadataPromises);
  const metadataMap = new Map<string, Metadata>();
  
  metadataResults.forEach(result => {
    if (result.metadata) {
      metadataMap.set(result.id, result.metadata);
    }
  });
  
  // Fetch users once
  const users = await fetchAndCacheUsers();

  for (const doc of detectionsSnap.docs) {
    const detectionData = doc.data();
    const metadata = metadataMap.get(doc.id);
    
    // Skip if scientificName filter is applied and doesn't match
    if (scientificName && metadata?.scientificName !== scientificName) {
      continue;
    }

    const isUserLocation = !metadata?.imageLat || metadata?.imageLat === 0;
    const imageLat = metadata?.imageLat ?? 0;
    const imageLong = metadata?.imageLong ?? 0;
    const userLat = metadata?.userLat ?? 0;
    const userLong = metadata?.userLong ?? 0;

    const timestamp = detectionData.timestamp instanceof Timestamp
      ? detectionData.timestamp.toDate().toISOString()
      : new Date().toISOString();

    const user = users.get(detectionData.userId);

    const detection: MapDetection = {
      detectionID: doc.id,
      confScore: detectionData.confScore || 0,
      curVeriStatus: detectionData.curVeriStatus ?? 'pending',
      inputImageURL: detectionData.inputImageURL || '',
      predImageURL: detectionData.predImageURL || '',
      pestType: detectionData.pestType || '',
      timestamp,
      userId: detectionData.userId || '',
      userName: user?.name || 'Deleted User',
      imageLat,
      imageLong,
      userLat,
      userLong,
      imageLocation: metadata
        ? [metadata.imageCity, metadata.imageRegion, metadata.imageCountry]
            .filter(Boolean)
            .join(', ') || 'Unknown'
        : 'Unknown',
      userLocation: metadata
        ? [metadata.userCity, metadata.userRegion, metadata.userCountry]
            .filter(Boolean)
            .join(', ') || 'Unknown'
        : 'Unknown',
      scientificName: metadata?.scientificName || 'Unknown',
      funFacts: metadata?.funFacts || '',
      aiModel: metadata?.scientificName ? 'YOLO_PIXTRAL' : 'PIXTRAL',
      dateTime: new Date(timestamp).toLocaleString(),
      isUserLocation,
    };

    detections.push(detection);
  }

  return detections;
}

/**
 * Fetches aggregated detection data for the line chart, grouped by month.
 * @returns A promise resolving to an array of ChartData objects.
 */
export async function getLineChartData(): Promise<ChartData[]> {
  const detectionsRef = collection(db, 'Predictions');
  const detectionsSnap = await getDocs(detectionsRef);
  
  const monthlyCounts: { [key: string]: number } = {};
  
  detectionsSnap.forEach((doc) => {
    const detectionData = doc.data();
    const timestamp = detectionData.timestamp.toDate();
    const monthYear = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
    
    monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
  });
  
  const chartData: ChartData[] = Object.entries(monthlyCounts).map(([timestamp, value]) => ({
    timestamp,
    value,
  }));
  
  return chartData.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}


/**
 * Fetches and aggregates detection data by Australian state for geographic coverage.
 * @returns A promise resolving to an array of GeographicCoverage objects.
 */
export async function getGeographicCoverage(): Promise<GeographicCoverage[]> {
  try {
    // Define all Australian states/territories with abbreviations and full names
    const australianStates: {[key: string]: string} = {
      'NSW': 'New South Wales',
      'VIC': 'Victoria',
      'QLD': 'Queensland',
      'SA': 'South Australia',
      'WA': 'Western Australia',
      'TAS': 'Tasmania',
      'NT': 'Northern Territory',
      'ACT': 'Australian Capital Territory'
    };
    
    // Initialize state tracking
    const stateCounts: { [key: string]: number } = {};
    Object.keys(australianStates).forEach(stateCode => {
      stateCounts[stateCode] = 0;
    });
    
    // Create a reference to all metadata
    const metadataRef = collection(db, 'PredictionMetaData');
    const metadataSnap = await getDocs(metadataRef);
    
    // Count regions directly from metadata
    let totalDetections = 0;
    
    metadataSnap.forEach(doc => {
      const data = doc.data() as Metadata;
      const region = data.imageRegion || data.userRegion;
      
      if (region) {
        totalDetections++;
        const normalizedState = normalizeStateName(region);
        if (normalizedState in stateCounts) {
          stateCounts[normalizedState]++;
        } else {
          // If somehow we get a state that's not in our predefined list,
          // we'll count it as an unknown location
          console.warn(`Unknown Australian region: ${region}`);
        }
      }
    });
    
    // Calculate percentages and create final result array
    const coverage: GeographicCoverage[] = Object.entries(stateCounts).map(([state, count]) => ({
      state,
      fullName: australianStates[state],
      count,
      percentage: totalDetections > 0 ? Math.round((count / totalDetections) * 100) : 0
    }));
    
    // Sort by count in descending order
    return coverage.sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error getting geographic coverage:', error);
    throw error;
  }
}

/**
 * Helper function to normalize Australian state names to standard abbreviations
 */
function normalizeStateName(stateName: string): string {
  const stateLower = stateName.toLowerCase().trim();
  
  // Full state name mapping
  if (stateLower.includes('new south wales')) return 'NSW';
  if (stateLower.includes('queensland')) return 'QLD';
  if (stateLower.includes('victoria')) return 'VIC';
  if (stateLower.includes('western australia')) return 'WA';
  if (stateLower.includes('south australia')) return 'SA';
  if (stateLower.includes('tasmania')) return 'TAS';
  if (stateLower.includes('northern territory')) return 'NT';
  if (stateLower.includes('australian capital territory')) return 'ACT';
  
  // Abbreviation mapping
  if (stateLower === 'nsw') return 'NSW';
  if (stateLower === 'qld') return 'QLD';
  if (stateLower === 'vic') return 'VIC';
  if (stateLower === 'wa') return 'WA';
  if (stateLower === 'sa') return 'SA';
  if (stateLower === 'tas') return 'TAS';
  if (stateLower === 'nt') return 'NT';
  if (stateLower === 'act') return 'ACT';
  
  // Return default if we can't determine the state
  return 'NSW'; // Most populated state as fallback
}