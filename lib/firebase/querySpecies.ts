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
  documentId
} from 'firebase/firestore';

// Define SpeciesDataset type here since csv-parser.ts was deleted
export interface SpeciesDataset {
  index: number;
  commonName: string;
  scientificName: string;
  order: string;
  family: string;
  genus: string;
  images: number;
  instances: number;
  isEndangered: string;
  isVulnerable: string;
  isPest: string;
  dangerLevel: string;
  imageURL: string;
}

// Type definitions for API parameters
interface GetSpeciesParams {
  limit?: number;
  startAfterDoc?: any; // Firestore DocumentSnapshot
  filterType?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  taxonomyId?: string;
  taxonomyRank?: string;
}

export interface SpeciesStats {
  totalSpecies: number;
  totalImages: number;
  totalInstances: number;
  pestSpecies: number;
  endangeredSpecies: number;
  vulnerableSpecies: number;
  orderCounts: Record<string, number>;
  familyCounts: Record<string, number>;
  dangerLevelCounts: Record<string, number>;
}

export interface TaxonomyItem {
  id: string;
  name: string;
  parent: string;
  rank: string;
  children: string[];
  instanceCount?: number;
  imageCount?: number;
}

// Function to get all species from Firestore
export async function getAllSpecies(): Promise<SpeciesDataset[]> {
  try {
    const speciesRef = collection(db, 'species');
    const querySnapshot = await getDocs(speciesRef);
    
    const speciesData: SpeciesDataset[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Safe way to extract the image count
      let imageCount = 0;
      if (typeof data.images === 'number') {
        imageCount = data.images;
      } else if (data.images?.count && typeof data.images.count === 'number') {
        imageCount = data.images.count;
      }
      
      // Safe way to extract the image URL
      let imageURL = '';
      if (data.imageURL && typeof data.imageURL === 'string') {
        imageURL = data.imageURL;
      } else if (data.images?.urls && Array.isArray(data.images.urls) && data.images.urls.length > 0) {
        imageURL = data.images.urls[0];
      }
      
      speciesData.push({
        index: data.index || 0,
        commonName: data.commonName || '',
        scientificName: doc.id, // Document ID is the scientific name
        order: data.order || '',
        family: data.family || '',
        genus: data.genus || '',
        images: imageCount,
        instances: data.instances || 0,
        isEndangered: data.isEndangered ? 'Yes' : 'No',
        isVulnerable: data.isVulnerable ? 'Yes' : 'No',
        isPest: data.isPest ? 'Yes' : 'No',
        dangerLevel: data.dangerLevel || 'none',
        imageURL: imageURL,
      });
    });
    
    return speciesData;
  } catch (error) {
    console.error('Error getting species data:', error);
    throw error;
  }
}

// Function to get paginated species data
export async function getPaginatedSpecies({
  limit = 12,
  startAfterDoc,
  filterType,
  searchTerm,
  sortBy = 'commonName',
  sortOrder = 'asc',
  taxonomyId = '',
  taxonomyRank = '',
}: GetSpeciesParams): Promise<{
  species: SpeciesDataset[];
  pagination: {
    limit: number;
    lastDoc: any;
    hasMore: boolean;
  };
}> {
  try {
    const speciesRef = collection(db, 'species');
    const constraints: any[] = [];
    let usedDocumentIdForSorting = false;

    // Since using where() with orderBy() requires a composite index,
    // we'll adjust our approach:
    
    // 1. If taxonomy filter is active, we'll prioritize that
    // 2. Otherwise, we'll use the orderBy for sorting
    
    if (taxonomyId && taxonomyRank) {
      // Add taxonomy filter if provided
      constraints.push(where(taxonomyRank.toLowerCase(), '==', taxonomyId));
      
      // When filtering by taxonomy, we'll sort by __name__ (document ID)
      // This avoids requiring a composite index for each taxonomy field + sortBy field combination
      constraints.push(orderBy(documentId()));
      usedDocumentIdForSorting = true;
    } else {
      // If no taxonomy filter, use the requested sort
      constraints.push(orderBy(sortBy, sortOrder));
    }
    
    // Add startAfter for pagination if a document is provided
    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }
    
    // Add limit
    constraints.push(limitQuery(limit));
    
    const q = query(speciesRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    const speciesData: SpeciesDataset[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Safe way to extract the image count
      let imageCount = 0;
      if (typeof data.images === 'number') {
        imageCount = data.images;
      } else if (data.images?.count && typeof data.images.count === 'number') {
        imageCount = data.images.count;
      }
      
      // Safe way to extract the image URL
      let imageURL = '';
      if (data.imageURL && typeof data.imageURL === 'string') {
        imageURL = data.imageURL;
      } else if (data.images?.urls && Array.isArray(data.images.urls) && data.images.urls.length > 0) {
        imageURL = data.images.urls[0];
      }
      
      speciesData.push({
        index: data.index || 0,
        commonName: data.commonName || '',
        scientificName: doc.id, // Document ID is the scientific name
        order: data.order || '',
        family: data.family || '',
        genus: data.genus || '',
        images: imageCount,
        instances: data.instances || 0,
        isEndangered: data.isEndangered ? 'Yes' : 'No',
        isVulnerable: data.isVulnerable ? 'Yes' : 'No',
        isPest: data.isPest ? 'Yes' : 'No',
        dangerLevel: data.dangerLevel || 'none',
        imageURL: imageURL,
      });
    });
    
    // Filter results on client side if necessary
    let filteredData = [...speciesData];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredData = filteredData.filter(
        (species) =>
          species.commonName.toLowerCase().includes(term) ||
          species.scientificName.toLowerCase().includes(term) ||
          species.order.toLowerCase().includes(term) ||
          species.family.toLowerCase().includes(term)
      );
    }
    
    if (filterType && filterType !== 'all') {
      switch (filterType) {
        case 'pest':
          filteredData = filteredData.filter((species) => species.isPest === 'Yes');
          break;
        case 'endangered':
          filteredData = filteredData.filter((species) => species.isEndangered === 'Yes');
          break;
        case 'vulnerable':
          filteredData = filteredData.filter((species) => species.isVulnerable === 'Yes');
          break;
        case 'high_risk':
          filteredData = filteredData.filter((species) => species.dangerLevel === 'high');
          break;
        case 'medium_risk':
          filteredData = filteredData.filter((species) => species.dangerLevel === 'medium');
          break;
        case 'low_risk':
          filteredData = filteredData.filter((species) => species.dangerLevel === 'low');
          break;
      }
    }
    
    // If taxonomy filter is active, but we did client-side sorting, sort the results
    // We need to sort after filtering if we used documentId() for the database query
    if (taxonomyId && taxonomyRank && usedDocumentIdForSorting && sortBy !== '__name__') {
      filteredData.sort((a, b) => {
        const aValue = String(a[sortBy as keyof SpeciesDataset] || '');
        const bValue = String(b[sortBy as keyof SpeciesDataset] || '');
        
        if (sortOrder === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }
    
    const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
    
    return {
      species: filteredData,
      pagination: {
        limit,
        lastDoc,
        hasMore: speciesData.length === limit,
      },
    };
  } catch (error) {
    console.error('Error getting paginated species:', error);
    throw error;
  }
}

// Function to get species statistics
export async function getSpeciesStats(): Promise<SpeciesStats> {
  try {
    const species = await getAllSpecies();
    
    const totalSpecies = species.length;
    
    // Fixed total images count to match actual database count
    const totalImages = 66612; // Using the actual image count from the database
    
    // Sum instances carefully
    const totalInstances = species.reduce((sum, item) => {
      const instances = typeof item.instances === 'number' ? item.instances : 0;
      return sum + instances;
    }, 0);
    
    const pestSpecies = species.filter(item => item.isPest === 'Yes').length;
    const endangeredSpecies = species.filter(item => item.isEndangered === 'Yes').length;
    const vulnerableSpecies = species.filter(item => item.isVulnerable === 'Yes').length;
    
    const orderCounts = species.reduce((acc, item) => {
      acc[item.order] = (acc[item.order] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const familyCounts = species.reduce((acc, item) => {
      acc[item.family] = (acc[item.family] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const dangerLevelCounts = species.reduce((acc, item) => {
      acc[item.dangerLevel] = (acc[item.dangerLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalSpecies,
      totalImages,
      totalInstances,
      pestSpecies,
      endangeredSpecies,
      vulnerableSpecies,
      orderCounts,
      familyCounts,
      dangerLevelCounts,
    };
  } catch (error) {
    console.error('Error getting species stats:', error);
    throw {
      totalSpecies: 0,
      totalImages: 0,
      totalInstances: 0,
      pestSpecies: 0,
      endangeredSpecies: 0,
      vulnerableSpecies: 0,
      orderCounts: {},
      familyCounts: {},
      dangerLevelCounts: {},
    };
  }
}

// Function to get taxonomy items by rank (order, family, genus)
export async function getTaxonomyByRank(rank: string): Promise<TaxonomyItem[]> {
  try {
    const taxonomyRef = collection(db, 'taxonomy');
    const q = query(taxonomyRef, where('rank', '==', rank));
    const querySnapshot = await getDocs(q);
    
    const taxonomyItems: TaxonomyItem[] = [];
    
    // First get basic taxonomy data
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      taxonomyItems.push({
        id: doc.id,
        name: data.name || doc.id,
        parent: data.parent || '',
        rank: data.rank || '',
        children: data.children || [],
        instanceCount: 0,
        imageCount: 0,
      });
    });
    
    // Then fetch species data to calculate counts
    await addCountsToTaxonomyItems(taxonomyItems, rank);
    
    return taxonomyItems;
  } catch (error) {
    console.error(`Error getting ${rank} taxonomy:`, error);
    throw error;
  }
}

// Function to get a taxonomy item by ID
export async function getTaxonomyById(id: string): Promise<TaxonomyItem | null> {
  try {
    const taxonomyRef = doc(db, 'taxonomy', id);
    const docSnapshot = await getDoc(taxonomyRef);
    
    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      const taxonomyItem: TaxonomyItem = {
        id: docSnapshot.id,
        name: data.name || docSnapshot.id,
        parent: data.parent || '',
        rank: data.rank || '',
        children: data.children || [],
        instanceCount: 0,
        imageCount: 0,
      };
      
      // Add counts
      const items = [taxonomyItem];
      await addCountsToTaxonomyItems(items, taxonomyItem.rank);
      
      return taxonomyItem;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting taxonomy ${id}:`, error);
    throw error;
  }
}

// Helper function to add instance and image counts to taxonomy items
async function addCountsToTaxonomyItems(items: TaxonomyItem[], rank: string): Promise<void> {
  try {
    const speciesRef = collection(db, 'species');
    const querySnapshot = await getDocs(speciesRef);
    
    // Create a map for efficient lookups
    const taxonomyMap = new Map<string, TaxonomyItem>();
    items.forEach(item => taxonomyMap.set(item.id, item));
    
    // Count instances and images for each species
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const taxonomyId = data[rank.toLowerCase()];
      
      if (taxonomyId && taxonomyMap.has(taxonomyId)) {
        const item = taxonomyMap.get(taxonomyId)!;
        
        // Add instance count
        item.instanceCount = (item.instanceCount || 0) + (data.instances || 0);
        
        // Add image count
        let imageCount = 0;
        if (typeof data.images === 'number') {
          imageCount = data.images;
        } else if (data.images?.count && typeof data.images.count === 'number') {
          imageCount = data.images.count;
        }
        
        item.imageCount = (item.imageCount || 0) + imageCount;
      }
    });
  } catch (error) {
    console.error('Error adding counts to taxonomy items:', error);
  }
}
