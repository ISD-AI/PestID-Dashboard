// app/api/fbdetection/map/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { queryVeriStats } from '@/lib/firebase/queryDetections';

export async function GET(request: NextRequest) {
  try {
    const veriStats = await queryVeriStats();

    return NextResponse.json({
      success: true,
      data: veriStats,
    });
  } catch (error: any) {
    console.error('Error fetching verification stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch verication stats',
      },
      { status: 500 }
    );
  }
}