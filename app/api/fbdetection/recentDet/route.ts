// app/api/fbdetection/recentDet/route.ts
import { NextResponse } from 'next/server';
import { getRecentDetections } from '@/lib/firebase/queryDetections'; // Adjust the import path

export async function GET(request: Request) {
  try {
    // Get the 'limit' parameter from the URL, default to 100 if not provided
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 100;
    
    // Fetch data with the specified limit
    const detections = await getRecentDetections(limit);
    
    return NextResponse.json({ 
      success: true,
      data: detections 
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching recent detections:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch recent detections' 
    }, { status: 500 });
  }
}