import { NextRequest, NextResponse } from 'next/server';
import { getGeographicCoverage } from '@/lib/firebase/queryDetections';

export async function GET(request: NextRequest) {
  try {
    const coverage = await getGeographicCoverage();
    return NextResponse.json({ success: true, data: coverage });
  } catch (error) {
    console.error('Error fetching geographic coverage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch geographic coverage' },
      { status: 500 }
    );
  }
}