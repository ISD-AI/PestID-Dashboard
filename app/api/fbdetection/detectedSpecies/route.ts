import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { Species } from '@/types/detection';

export async function GET(request: NextRequest) {
  try {
    const metadataRef = collection(db, 'PredictionMetaData');
    const metadataSnapshot = await getDocs(metadataRef);

    const scientificNames = new Set<string>();
    metadataSnapshot.forEach((doc) => {
      const metadata = doc.data();
      if (metadata.scientificName) {
        scientificNames.add(metadata.scientificName);
      }
    });

    const speciesList: Species[] = Array.from(scientificNames).map((name) => ({
      scientificName: name,
    }));

    return NextResponse.json({
      success: true,
      data: speciesList,
    });
  } catch (error: any) {
    console.error('Error fetching species:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch species',
      },
      { status: 500 }
    );
  }
}