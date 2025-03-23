// app/api/fbdetection/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPaginatedDetections } from '@/lib/firebase/queryDetections';
import { db } from '@/lib/firebase/config';
import { 
  getDoc, 
  doc, 
} from 'firebase/firestore';
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const lastDocId = searchParams.get('lastDocId') || undefined; // Pass last document ID
    const status = searchParams.get('status') || undefined;

    let startAfterDoc;
    if (lastDocId) {
      startAfterDoc = await getDoc(doc(db, 'Predictions', lastDocId));
    }

    const { detections, pagination} = await getPaginatedDetections({
      limit,
      startAfterDoc,
      status,
    });

    return NextResponse.json({
      success: true,
      data: {
        detections,
        pagination: {
          ...pagination,
          lastDocId: pagination.lastDoc ? pagination.lastDoc.id : null, // Return last doc ID
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching paginated detections:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch detections',
      },
      { status: 500 }
    );
  }
}