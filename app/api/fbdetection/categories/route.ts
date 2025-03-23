// app/api/fbdetection/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCategoryCountsByMonth } from '@/lib/firebase/queryDetVerification';

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const year = searchParams.get('year') 
      ? parseInt(searchParams.get('year')!) 
      : new Date().getFullYear();
    
    const categoryData = await getCategoryCountsByMonth(year);
    
    return NextResponse.json({
      success: true,
      data: categoryData
    });
  } catch (error) {
    console.error('Error fetching category data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch category data' },
      { status: 500 }
    );
  }
}