import { NextRequest, NextResponse } from 'next/server';
import { getMapDetections } from '@/lib/firebase/queryDetections';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const scientificName = searchParams.get('scientificName') || undefined;
    const status = searchParams.get('status') || undefined;

    const detections = await getMapDetections({
      startDate,
      endDate,
      scientificName,
      status,
    });

    return NextResponse.json({
      success: true,
      data: detections,
    });
  } catch (error: any) {
    console.error('Error fetching detections:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch detections',
      },
      { status: 500 }
    );
  }
}