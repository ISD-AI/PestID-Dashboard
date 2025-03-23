// components/verification/VerificationHistoryContent.tsx
'use client';

import { useState, useEffect } from 'react';
import { VerificationHistoryTable } from '@/components/verifyHistory/HistoryTable';
import { VerificationDetailPanel } from '@/components/verifyHistory/DetailPanel';
import { VerificationHistoryDetail } from '@/types/verification';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export function VerificationHistoryContent() {
  const [historyRecords, setHistoryRecords] = useState<VerificationHistoryDetail[]>([]);
  const [selectedVerificationId, setSelectedVerificationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // For "Load More" pattern
  const [lastDocId, setLastDocId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageSize] = useState(10);
  
  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/verificationHistory?limit=${pageSize}`);
        if (!response.ok) throw new Error('Failed to fetch verification history');
        
        const data = await response.json();
        if (data.success) {
          setHistoryRecords(data.historyRecords);
          setLastDocId(data.pagination.lastDocId);
          setHasMore(data.pagination.hasMore);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (error) {
        console.error('Error fetching verification history:', error);
        setError('Failed to load verification history. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [pageSize]);

  const handleLoadMore = async () => {
    if (!lastDocId || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const response = await fetch(`/api/verificationHistory?limit=${pageSize}&lastDocId=${lastDocId}`);
      if (!response.ok) throw new Error('Failed to fetch more records');
      
      const data = await response.json();
      if (data.success) {
        // Append new records to existing ones
        setHistoryRecords((prev) => [...prev, ...data.historyRecords]);
        setLastDocId(data.pagination.lastDocId);
        setHasMore(data.pagination.hasMore);
      }
    } catch (error) {
      console.error('Error loading more records:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSelectRecord = (record: VerificationHistoryDetail) => {
    setSelectedVerificationId(record.verificationId);
  };

  const handleSave = () => {
    // Refresh data after save
    const fetchUpdatedData = async () => {
      try {
        const response = await fetch(`/api/verificationHistory?limit=${historyRecords.length}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setHistoryRecords(data.historyRecords);
          }
        }
      } catch (error) {
        console.error('Error refreshing data after save:', error);
      }
    };
    
    fetchUpdatedData();
  };

  if (loading && historyRecords.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 flex justify-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && historyRecords.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
          <VerificationHistoryTable 
            historyRecords={historyRecords}
            onSelectRecord={handleSelectRecord}
            loading={loadingMore}
            hasMore={hasMore}
            onLoadMore={handleLoadMore}
          />
        </div>
        <div className="md:col-span-1">
          <VerificationDetailPanel
            verificationId={selectedVerificationId}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}