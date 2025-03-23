// lib/firebase/queryVerificationHistory.ts
import { db } from '@/lib/firebase/config';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
  Timestamp,
  addDoc,
  startAfter,
  limit as limitQuery,
} from 'firebase/firestore';
import { Verification,VerificationStatus, VerificationHistoryDetail } from '@/types/verification';

// Get verification history with pagination
export async function getPaginatedVerificationHistory(
  limit: number = 10,
  lastDocId?: string
): Promise<{
  historyRecords: VerificationHistoryDetail[];
  pagination: {
    limit: number;
    lastDocId: string | null;
    hasMore: boolean;
    totalCount: number;
  };
}> {
  try {
    // Get total count first (for pagination info)
    const countSnapshot = await getDocs(collection(db, 'VerificationHistory'));
    const totalCount = countSnapshot.size;
    
    // Build query with pagination
    const historyRef = collection(db, 'VerificationHistory');
    const constraints: any[] = [orderBy('changedAt', 'desc')];
    
    // Add cursor if lastDocId is provided
    if (lastDocId) {
      const lastDocRef = doc(db, 'VerificationHistory', lastDocId);
      const lastDocSnap = await getDoc(lastDocRef);
      if (lastDocSnap.exists()) {
        constraints.push(startAfter(lastDocSnap));
      }
    }
    
    // Add limit
    constraints.push(limitQuery(limit));
    
    // Execute query
    const q = query(historyRef, ...constraints);
    const historySnapshot = await getDocs(q);
    
    // Process results
    const historyPromises = historySnapshot.docs.map(async (historyDoc) => {
      const historyData = historyDoc.data();
      
      // Get the most recent verification record for this predID
      const verificationRef = collection(db, 'Verification');
      const vq = query(verificationRef, where('predID', '==', historyData.predID));
      const verificationSnapshot = await getDocs(vq);
      
      let verificationData = null;
      let verificationId = '';
      
      if (!verificationSnapshot.empty) {
        verificationData = verificationSnapshot.docs[0].data();
        verificationId = verificationSnapshot.docs[0].id;
      }
      
      return {
        id: historyDoc.id,
        predID: historyData.predID,
        previousStatus: historyData.previousStatus,
        newStatus: historyData.newStatus,
        changedBy: historyData.changedBy,
        changedAt: historyData.changedAt.toDate().toISOString(),
        reason: historyData.reason,
        // Additional fields from Verification
        currentStatus: verificationData?.status || historyData.newStatus,
        category: verificationData?.category || '',
        suggestedName: verificationData?.correctSciName || null,
        needsExpertReview: verificationData?.needsExpertReview || false,
        notes: verificationData?.notes || '',
        verifierName: verificationData?.verifierName || historyData.changedBy,
        verificationId: verificationId,
      } as VerificationHistoryDetail;
    });
    
    const historyRecords = await Promise.all(historyPromises);
    
    // Determine if there are more records
    const hasMore = historyRecords.length === limit;
    
    // Get the ID of the last document for next page
    const lastDoc = historySnapshot.docs[historySnapshot.docs.length - 1];
    const lastDocumentId = lastDoc ? lastDoc.id : null;
    
    return {
      historyRecords,
      pagination: {
        limit,
        lastDocId: lastDocumentId,
        hasMore,
        totalCount,
      },
    };
  } catch (error) {
    console.error('Error getting paginated verification history:', error);
    throw error;
  }
}

// Get a specific verification by ID with detailed information
export async function getVerificationById(id: string): Promise<Verification & { predImageURL?: string; inputImageURL?: string } | null> {
    try {
      const verificationRef = doc(db, 'Verification', id);
      const verificationSnap = await getDoc(verificationRef);
      
      if (!verificationSnap.exists()) {
        return null;
      }
      
      const data = verificationSnap.data();
      
      // Fetch the prediction data to get the images
      const predictionRef = doc(db, 'Predictions', data.predID);
      const predictionSnap = await getDoc(predictionRef);
      
      const verification = {
        id: verificationSnap.id,
        predID: data.predID,
        status: data.status,
        verifierID: data.verifierID,
        verifierName: data.verifierName,
        confidence: data.confidence,
        notes: data.notes,
        category: data.category,
        correctSciName: data.correctSciName || null,
        timestamp: data.timestamp.toDate().toISOString(),
        canReuseData: data.canReuseForAI || false,
        needsExpertReview: data.needsExpertReview || false,
      } as Verification;
      
      // Add the image URLs if the prediction exists
      if (predictionSnap.exists()) {
        const predictionData = predictionSnap.data();
        verification.predImageURL = predictionData.predImageURL;
        verification.inputImageURL = predictionData.inputImageURL;
      }
      
      return verification;
    } catch (error) {
      console.error('Error getting verification by ID:', error);
      throw error;
    }
  }
  
// Update verification and create history record
export async function updateVerification(
  id: string, 
  updates: Partial<Verification>,
  changedBy: string,
  reason: string
): Promise<void> {
  const verificationRef = doc(db, 'Verification', id);
  const verificationSnap = await getDoc(verificationRef);
  
  if (!verificationSnap.exists()) {
    throw new Error('Verification not found');
  }
  
  const currentData = verificationSnap.data();
  const previousStatus = currentData.status as VerificationStatus;
  const newStatus = updates.status || previousStatus;
  
  // Update the verification
  await updateDoc(verificationRef, {
    ...updates,
    timestamp: Timestamp.now(),
  });
  
  // Create history record if status changed
  if (previousStatus !== newStatus) {
    const historyRef = collection(db, 'VerificationHistory');
    await addDoc(historyRef, {
      predID: currentData.predID,
      previousStatus,
      newStatus,
      changedBy,
      changedAt: Timestamp.now(),
      reason,
    });
    
    // Update the status in Predictions collection
    const predictionRef = doc(db, 'Predictions', currentData.predID);
    await updateDoc(predictionRef, {
      curVeriStatus: newStatus,
    });
  }
}