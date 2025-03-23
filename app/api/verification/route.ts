// app/api/verification/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  createVerification,
  getVerificationsByStatus,
  updateVerification,
} from '@/lib/firebase/queryDetVerification';
import { VerificationStatus, VerificationHistory } from '@/types/verification';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

// POST: Create a new verification
export async function POST(request: NextRequest) {
  try {
    const verificationData = await request.json();
    const id = await createVerification(verificationData);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error creating verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create verification' },
      { status: 500 }
    );
  }
}

// GET: Fetch verifications by status or history by predID
export async function GET(request: NextRequest) {
  try {
    const predID = request.nextUrl.searchParams.get('predID');
    const status = request.nextUrl.searchParams.get('status') as VerificationStatus | null;

    if (predID) {
      // Fetch verification history if predID is provided
      const historyQuery = query(
        collection(db, 'VerificationHistory'),
        where('predID', '==', predID)
      );
      const snapshot = await getDocs(historyQuery);
      const history = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        changedAt: doc.data().changedAt.toDate().toISOString(),
      })) as VerificationHistory[];
      return NextResponse.json({ success: true, history });
    }

    if (status) {
      // Fetch verifications by status
      const verifications = await getVerificationsByStatus(status);
      return NextResponse.json({ success: true, verifications });
    }

    return NextResponse.json(
      { success: false, error: 'Either status or predID is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

// PATCH: Update a verification
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