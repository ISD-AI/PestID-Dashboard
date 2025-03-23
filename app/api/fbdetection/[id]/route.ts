import { NextRequest, NextResponse } from 'next/server';
import { getDetectionById } from '@/lib/firebase/queryDetections';

export async function GET(
  request: NextRequest,
  {params}: {params: Promise<{ id: string }>}
) {
  try {
    const { id } = await params;
    
    // Get detection from Firebase
    const { detection, metadata } = await getDetectionById(id);
    
    if (!detection) {
      return NextResponse.json(
        { success: false, error: 'Detection not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        detection,
        metadata
      }
    });
  } catch (error: any) {
    console.error('Error fetching detection:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch detection',
      },
      { status: 500 }
    );
  }
}