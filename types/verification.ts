export enum VerificationStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    REJECTED = 'rejected',
  }

export interface Verification {
    id: string;
    predID: string; // Links to detectionID in Predictions
    status: VerificationStatus;
    verifierID: string;
    verifierName: string;
    confidence: number;
    notes: string;
    category: string;
    correctSciName?: string; // Optional
    timestamp: string; // ISO string, e.g., "2025-02-24T10:32:35.230Z"
    canReuseData: boolean;
    needsExpertReview: boolean;
    predImageURL: string;
    inputImageURL: string;
}

export interface VerificationHistory {
    id: string;
    predID: string; // Links to detectionID in Predictions
    previousStatus: VerificationStatus;
    newStatus: VerificationStatus;
    changedBy: string;
    changedAt: string; // ISO string
    reason: string;
  }

  // Enhanced interface for the history table display
export interface VerificationHistoryDetail extends VerificationHistory {
  currentStatus: VerificationStatus;
  category: string;
  suggestedName: string | null;
  needsExpertReview: boolean;
  notes: string;
  verifierName: string;
  verificationId: string; // To reference the verification record
}

// For the request to update a verification
export interface UpdateVerificationRequest {
  updates: Partial<Verification>;
  changedBy: string;
  reason: string;
}

export interface CategoryChartData {
  month: string;
  'google-sourced': number;
  'unknown-species': number;
  'unrelated': number;
  'real-pest': number;
}