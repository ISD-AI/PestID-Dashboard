// lib/firebase/queryVerification.ts
import { db } from '@/lib/firebase/config';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { Verification, VerificationHistory, VerificationStatus, CategoryChartData } from '@/types/verification';

// Create a new verification record
export async function createVerification(
  verification: Omit<Verification, 'id' | 'timestamp'>
): Promise<string> {
  const verificationRef = collection(db, 'Verification');
  const docRef = await addDoc(verificationRef, {
    ...verification,
    timestamp: Timestamp.now(),
  });
  return docRef.id;
}

// Create a verification history record
export async function createVerificationHistory(
  history: Omit<VerificationHistory, 'id' | 'timestamp' | 'changedAt'> // Exclude changedAt
): Promise<string> {
  const historyRef = collection(db, 'VerificationHistory');
  const now = Timestamp.now();
  const docRef = await addDoc(historyRef, {
    ...history,
    timestamp: now,
    changedAt: now, // Set changedAt here
  });
  return docRef.id;
}

// Fetch verifications by status
export async function getVerificationsByStatus(
  status: VerificationStatus
): Promise<Verification[]> {
  const verificationRef = collection(db, 'Verification');
  const q = query(verificationRef, where('status', '==', status));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp.toDate().toISOString(),
  } as Verification));
}

// Update verification status, log history, and sync Predictions
export async function updateVerification(
  id: string,
  updates: Partial<Verification>,
  changedBy: string,
  reason: string
): Promise<void> {
  const verificationRef = doc(db, 'Verification', id);
  const currentVerificationSnap = await getDoc(verificationRef);

  if (!currentVerificationSnap.exists()) {
    throw new Error('Verification not found');
  }

  const currentData = currentVerificationSnap.data();
  const previousStatus = 'pending' as VerificationStatus;

  // Update the verification record
  await updateDoc(verificationRef, {
    ...updates,
    timestamp: Timestamp.now(),
  });

  // Log the change in VerificationHistory
  await createVerificationHistory({
    predID: currentData.predID,
    previousStatus,
    newStatus: updates.status || previousStatus,
    changedBy,
    reason,
  });

  // Update curVeriStatus in Predictions
  const predictionRef = doc(db, 'Predictions', currentData.predID);
  await updateDoc(predictionRef, {
    curVeriStatus: updates.status || previousStatus,
  });
}

export async function getCategoryCountsByMonth(
  year: number = new Date().getFullYear()
): Promise<CategoryChartData[]> {
  try {
    // Define the date range for the specified year
    const startDate = new Date(year, 0, 1); // Jan 1st of the year
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // Dec 31st of the year
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);

    // Get all verifications
    const verificationRef = collection(db, 'Verification');
    const verificationSnapshot = await getDocs(verificationRef);
    
    // Create a map of predIDs to their categories
    const predIdCategoryMap = new Map();
    verificationSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.predID && data.category) {
        predIdCategoryMap.set(data.predID, data.category);
      }
    });

    // Get predictions within the date range to match with categories
    const predictionsRef = collection(db, 'Predictions');
    const predictionsQuery = query(
      predictionsRef,
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<=', endTimestamp)
    );
    const predictionsSnapshot = await getDocs(predictionsQuery);
    
    // Initialize monthly counts
    const monthCategoryCounts: Record<string, Record<string, number>> = {};
    
    // Populate months with zero counts
    for (let month = 0; month < 12; month++) {
      const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'short' });
      monthCategoryCounts[monthName] = {
        'google-sourced': 0,
        'unknown-species': 0,
        'unrelated': 0,
        'real-pest': 0
      };
    }
    
    // Count categories by month
    predictionsSnapshot.forEach(doc => {
      const data = doc.data();
      const predID = doc.id;
      const category = predIdCategoryMap.get(predID);
      
      // Skip if this prediction doesn't have a category
      if (!category) return;
      
      // Get the month from the timestamp
      const timestamp = data.timestamp instanceof Timestamp 
        ? data.timestamp.toDate() 
        : new Date();
      const monthName = timestamp.toLocaleString('default', { month: 'short' });
      
      // Increment the category count for this month
      if (monthCategoryCounts[monthName] && 
          monthCategoryCounts[monthName][category] !== undefined) {
        monthCategoryCounts[monthName][category]++;
      }
    });
    
    // Convert to array format for charts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result = months.map(month => ({
      month,
      'google-sourced': monthCategoryCounts[month]['google-sourced'] || 0,
      'unknown-species': monthCategoryCounts[month]['unknown-species'] || 0,
      'unrelated': monthCategoryCounts[month]['unrelated'] || 0,
      'real-pest': monthCategoryCounts[month]['real-pest'] || 0
    }));
    
    return result;
  } catch (error) {
    console.error('Error getting category counts by month:', error);
    throw error;
  }
}