// app/api/verificationHistory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getVerificationById, updateVerification, getPaginatedVerificationHistory } from '@/lib/firebase/queryVerificationHistory';

// GET: Fetch all verification history with details (now with pagination)
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    
    if (id) {
      // Fetch a specific verification by ID
      const verification = await getVerificationById(id);
      return NextResponse.json({ success: true, verification });
    } else {
      // Pagination parameters
      const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
      const lastDocId = request.nextUrl.searchParams.get('lastDocId') || undefined;
      
      // Fetch paginated verification history entries
      const result = await getPaginatedVerificationHistory(limit, lastDocId);
      return NextResponse.json({ 
        success: true, 
        historyRecords: result.historyRecords,
        pagination: result.pagination
      });
    }
  } catch (error) {
    console.error('Error fetching verification history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch verification history' },
      { status: 500 }
    );
  }
}

// PATCH: Update a verification and create history record
export async function PATCH(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Verification ID is required' },
        { status: 400 }
      );
    }
    
    const { updates, changedBy, reason } = await request.json();
    await updateVerification(id, updates, changedBy, reason);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update verification' },
      { status: 500 }
    );
  }
}