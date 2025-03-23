// components/verification/VerificationQueue.tsx
import { useState, useEffect } from 'react';
import {VerificationHistory} from '@/types/verification';
import { PaginatedDetection } from '@/types/detection';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { QueueHeader } from './QueueHeader';
import { ImageCard } from './ImageCard';
import { SpeciesInfoCard } from './SpeciesInfoCard';
import { VerificationHistoryCard } from './VerificationHistoryCard';
import { VerificationForm } from './VerificationForm';
import { NextInQueueCard } from './NextInQueueCard';
import { Button } from '@/components/ui/button';
import { useUser } from "@clerk/nextjs";

interface VerificationQueueProps {
  detections: PaginatedDetection[];
  refreshQueue: () => Promise<void>;
  handleLoadMoreQueue: () => Promise<void>;
  queueHasMore: boolean;
  paginationLoading: boolean;
}

export function VerificationQueue({
  detections,
  refreshQueue,
  handleLoadMoreQueue,
  queueHasMore,
  paginationLoading,
}: VerificationQueueProps) {
  const [verificationHistory, setVerificationHistory] = useState<VerificationHistory[]>([]);
  const { user } = useUser();

  useEffect(() => {
    const fetchVerificationHistory = async () => {
      if (detections.length === 0) return;
      try {
        const response = await fetch(`/api/verification?predID=${detections[0].detectionID}`);
        const data = await response.json();
        if (data.success) {
          setVerificationHistory(data.history);
        }
      } catch (error) {
        console.error('Error fetching verification history:', error);
      }
    };
    fetchVerificationHistory();
  }, [detections]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'PP');
    } catch {
      return 'Invalid date';
    }
  };

  const handleVerify = async (id: string, status: 'verified' | 'rejected', data: any) => {
    try {
      // First, create a verification record if it doesn't exist
      const createResponse = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predID: id,
          status,
          category: data.category,
          needsExpertReview: data.needsExpertReview,
          canReuseForAI: data.canReuseForAI, // Fixed typo: canReuseforAI -> canReuseForAI
          verifierID: user?.id,
          verifierName: user?.firstName?.trim(),
          confidence: data.confidence,
          notes: data.comment,
          correctSciName: data.correctSpecies,
        }),
      });
      const createData = await createResponse.json();
      if (!createResponse.ok) throw new Error('Failed to create verification');

      // Then, update the verification status
      const updateResponse = await fetch(`/api/verification?id=${createData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: {
            status,
            confidence: data.confidence,
            notes: data.comment,
            correctSciName: data.correctSpecies,
          },
          changedBy: user?.firstName?.trim(),
          reason: 'Initial Verification',
        }),
      });
      if (!updateResponse.ok) throw new Error('Failed to update verification');

      // Show success toast
      toast.success('Verification updated successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });

      // Refresh the queue after successful verification
      await refreshQueue();
    } catch (error) {
      console.error('Error verifying detection:', error);
      toast.error('Failed to update verification', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  if (detections.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">Queue Empty</h3>
          <p className="text-muted-foreground">No detections left to verify!</p>
          {queueHasMore && (
            <Button
              onClick={handleLoadMoreQueue}
              disabled={paginationLoading}
              className="mt-4"
            >
              {paginationLoading ? 'Loading...' : 'Load More'}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <QueueHeader detections={detections} />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="md:col-span-2 lg:col-span-1 space-y-6">
          <ImageCard detection={detections[0]} />
          <SpeciesInfoCard detection={detections[0]} formatDate={formatDate} />
          <VerificationHistoryCard
            verificationHistory={verificationHistory}
            formatDate={formatDate}
          />
        </div>
        <div className="md:col-span-2 lg:col-span-1 space-y-6">
          <VerificationForm detection={detections[0]} onVerify={handleVerify} />
          <NextInQueueCard detections={detections} formatDate={formatDate} />
        </div>
      </div>
    </div>
  );
}