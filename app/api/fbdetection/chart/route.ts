// app/api/fbdetection/chart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getLineChartData } from '@/lib/firebase/queryDetections';

export async function GET(request: NextRequest) {
  try {
    const chartData = await getLineChartData();

    return NextResponse.json({
      success: true,
      data: chartData,
    });
  } catch (error: any) {
    console.error('Error fetching chart data:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch chart data',
      },
      { status: 500 }
    );
  }
}