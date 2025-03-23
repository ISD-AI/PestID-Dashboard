'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { DetectionOverview } from '@/components/detections/detectionOverview';
import { VerificationQueue } from '@/components/verification/VerificationQueue';
import { VerificationHistoryContent } from '@/components/verifyHistory/HistoryContent';
import { MapDetection, PaginatedDetection, VeriStats, Species } from '@/types/detection';
import { DashboardShell } from '@/components/dashboard/shell';
import { DashboardHeader } from '@/components/dashboard/header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryChartData } from '@/types/verification';

const ITEMS_PER_PAGE = 10;

type FilterType = 'all' | 'verified' | 'rejected';

export default function DetectionsPage() {
  const [verifiStats, setVerifiStats] = useState<VeriStats>({
    total: 0,
    pending: 0,
    verified: 0,
    rejected: 0,
  });
  const [mapDetections, setMapDetections] = useState<MapDetection[]>([]);
  const [gridDetections, setGridDetections] = useState<PaginatedDetection[]>([]);
  const [pendingPaginatedDet, setPendingPaginatedDet] = useState<PaginatedDetection[]>([]);
  const [allRecentDetections, setAllRecentDetections] = useState<PaginatedDetection[]>([]);
  const [selectedDaysAgo, setSelectedDaysAgo] = useState<number>(7);
  const [rawChartData, setRawChartData] = useState<{ timestamp: string; value: number }[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(true);
  const [lastDocId, setLastDocId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [PaginationLoading, setPaginationLoading] = useState(false);
  const [queueLastDocId, setQueueLastDocId] = useState<string | null>(null);
  const [queueHasMore, setQueueHasMore] = useState(true);
  const [categoryChartData, setCategoryChartData] = useState<CategoryChartData[]>([]);

  // Filter states for map
  const [yearRange, setYearRange] = useState<[number, number]>([2024, 2025]);
  const [monthRange, setMonthRange] = useState<[number, number]>([1, 12]);
  const [selectedSpecies, setSelectedSpecies] = useState<string | null>(null);
  const [speciesInput, setSpeciesInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [speciesList, setSpeciesList] = useState<Species[] | null>(null);
  const isMapFetchingRef = useRef(false);
  const prevMapParamsRef = useRef<{
    yearRange: [number, number];
    monthRange: [number, number];
    selectedSpecies: string | null;
    filterType: FilterType;
  } | null>(null);

  // Fetch static data and species list on mount
  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        const veriStatsResponse = await fetch('/api/fbdetection/veriStats');
        if (!veriStatsResponse.ok) throw new Error('Failed to fetch verification status data');
        const { data: veriStatData } = await veriStatsResponse.json();
        setVerifiStats(veriStatData.veriStats);

        const lineChartResponse = await fetch('/api/fbdetection/chart');
        if (!lineChartResponse.ok) throw new Error('Failed to fetch chart data');
        const { data: rawData } = await lineChartResponse.json();
        setRawChartData(rawData);

        const recentResponse = await fetch('/api/fbdetection/recentDet');
        if (!recentResponse.ok) throw new Error('Failed to fetch recent detections');
        const { data: recentData } = await recentResponse.json();
        setAllRecentDetections(recentData);

        // Fetch species list
        const speciesResponse = await fetch('/api/fbdetection/detectedSpecies');
        if (!speciesResponse.ok) throw new Error('Failed to fetch species');
        const { data: speciesData } = await speciesResponse.json();
        setSpeciesList(speciesData);

        const categoryResponse = await fetch(`/api/fbdetection/categories?year=${selectedYear}`);
        if (!categoryResponse.ok) throw new Error('Failed to fetch category data');
        const { data: categoryData } = await categoryResponse.json();
        setCategoryChartData(categoryData);

      } catch (error) {
        console.error('Error fetching static data:', error);
      }
    };
    fetchStaticData();
  }, [selectedYear]);

  // Fetch map data when filters change
  useEffect(() => {
    const fetchMapData = async () => {
      // Skip if already fetching or params haven't changed
      if (isMapFetchingRef.current) return;
      
      const currentParams = {
        yearRange,
        monthRange,
        selectedSpecies,
        filterType
      };
      
      // Check if params are the same as previous fetch
      if (prevMapParamsRef.current && 
          prevMapParamsRef.current.yearRange[0] === currentParams.yearRange[0] &&
          prevMapParamsRef.current.yearRange[1] === currentParams.yearRange[1] &&
          prevMapParamsRef.current.monthRange[0] === currentParams.monthRange[0] &&
          prevMapParamsRef.current.monthRange[1] === currentParams.monthRange[1] &&
          prevMapParamsRef.current.selectedSpecies === currentParams.selectedSpecies &&
          prevMapParamsRef.current.filterType === currentParams.filterType) {
        return;
      }
      
      try {
        isMapFetchingRef.current = true;
        const startDate = new Date(yearRange[0], monthRange[0] - 1, 1).toISOString();
        const endDate = new Date(yearRange[1], monthRange[1], 0, 23, 59, 59, 999).toISOString();
        const queryParams = new URLSearchParams({
          startDate,
          endDate,
          ...(selectedSpecies && { scientificName: selectedSpecies }),
          ...(filterType !== 'all' && { status: filterType }),
        });
        const mapResponse = await fetch(`/api/fbdetection/map?${queryParams}`);
        if (!mapResponse.ok) throw new Error('Failed to fetch map data');
        const { data: mapData } = await mapResponse.json();
        setMapDetections(mapData);
        
        // Save current params for comparison
        prevMapParamsRef.current = currentParams;
      } catch (error) {
        console.error('Error fetching map data:', error);
      } finally {
        isMapFetchingRef.current = false;
      }
    };
    fetchMapData();
  }, [yearRange, monthRange, selectedSpecies, filterType]);

  // Fetch grid data when filterType changes
  useEffect(() => {
    const fetchGridData = async () => {
      try {
        setLoading(true);
        const gridResponse = await fetch(
          `/api/fbdetection/paginated?limit=${ITEMS_PER_PAGE}${
            filterType !== 'all' ? `&status=${filterType}` : ''
          }`
        );

        const pendingPaginatedResponse = await fetch(
          `/api/fbdetection/paginated?limit=${ITEMS_PER_PAGE}&status=pending`
        );

        if (!gridResponse.ok) throw new Error('Failed to fetch grid data');
        if (!pendingPaginatedResponse.ok) throw new Error('Failed to fetch paginated pending review data');

        const { data: gridData } = await gridResponse.json();
        setGridDetections(gridData.detections);
        setHasMore(gridData.pagination.hasMore);
        setLastDocId(gridData.pagination.lastDocId);

        const { data: pendingData } = await pendingPaginatedResponse.json();
        setPendingPaginatedDet(pendingData.detections);
        setQueueLastDocId(pendingData.pagination.lastDocId);
        setQueueHasMore(pendingData.pagination.hasMore);
      } catch (error) {
        console.error('Error fetching grid data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchGridData();
  }, [filterType]);

  const refreshQueue = async () => {
    try {
      const pendingPaginatedResponse = await fetch(
        `/api/fbdetection/paginated?limit=${ITEMS_PER_PAGE}&status=pending`
      );
      if (!pendingPaginatedResponse.ok) throw new Error('Failed to fetch paginated pending review data');
      const { data: pendingData } = await pendingPaginatedResponse.json();
      setPendingPaginatedDet(pendingData.detections);
      setQueueLastDocId(pendingData.pagination.lastDocId);
      setQueueHasMore(pendingData.pagination.hasMore);
    } catch (error) {
      console.error('Error refreshing queue:', error);
    }
  };

  const handleLoadMoreQueue = async () => {
    try {
      setPaginationLoading(true);
      const response = await fetch(
        `/api/fbdetection/paginated?limit=${ITEMS_PER_PAGE}&status=pending${
          queueLastDocId ? `&lastDocId=${queueLastDocId}` : ''
        }`
      );
      if (!response.ok) throw new Error('Failed to fetch more pending detections');
      const { data } = await response.json();
      setPendingPaginatedDet((prev) => [...prev, ...data.detections]);
      setQueueLastDocId(data.pagination.lastDocId);
      setQueueHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('Error loading more queue items:', error);
    } finally {
      setPaginationLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const filteredData = rawChartData
      .filter((item) => item.timestamp.startsWith(selectedYear))
      .map((item) => ({
        month: new Date(item.timestamp).toLocaleString('default', { month: 'short' }),
        observations: item.value,
      }));

    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return allMonths.map((month) => {
      const found = filteredData.find((d) => d.month === month);
      return found || { month, observations: 0 };
    });
  }, [rawChartData, selectedYear]);

  const computedRecentDetections = useMemo(() => {
    const cutoffDate = new Date(Date.now() - selectedDaysAgo * 24 * 60 * 60 * 1000);
    const filtered = allRecentDetections.filter((d) => new Date(d.timestamp) >= cutoffDate);
    return filtered;
  }, [allRecentDetections, selectedDaysAgo]);

  const handleLoadMore = async () => {
    try {
      setPaginationLoading(true);
      const response = await fetch(
        `/api/fbdetection/paginated?limit=${ITEMS_PER_PAGE}${
          lastDocId ? `&lastDocId=${lastDocId}` : ''
        }${filterType !== 'all' ? `&status=${filterType}` : ''}`
      );
      if (!response.ok) throw new Error('Failed to fetch more detections');
      const { data } = await response.json();

      setGridDetections((prev) => [...prev, ...data.detections]);
      setLastDocId(data.pagination.lastDocId);
      setHasMore(data.pagination.hasMore);
    } catch (error) {
      console.error('Error loading more detections:', error);
    } finally {
      setPaginationLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'verified':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'not pest':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Pest Detections"
        text="Monitor and verify pest detections across Australia."
      />
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="verify">Verify</TabsTrigger>
          <TabsTrigger value="verificationHistory">Verification History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
        <DetectionOverview
          verifiStats={verifiStats}
          chartData={chartData}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          categoryChartData={categoryChartData}
          mapDetections={mapDetections}
          recentDetections={computedRecentDetections}
          gridDetections={gridDetections}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filterType={filterType}
          setFilterType={setFilterType}
          handleLoadMore={handleLoadMore}
          hasMore={hasMore}
          getBadgeClass={getBadgeClass}
          formatDate={formatDate}
          PaginationLoading={PaginationLoading}
          selectedDaysAgo={selectedDaysAgo}
          setSelectedDaysAgo={setSelectedDaysAgo}
          // Filter props
          yearRange={yearRange}
          setYearRange={setYearRange}
          monthRange={monthRange}
          setMonthRange={setMonthRange}
          speciesInput={speciesInput}
          setSpeciesInput={setSpeciesInput}
          selectedSpecies={selectedSpecies}
          setSelectedSpecies={setSelectedSpecies}
          showSuggestions={showSuggestions}
          setShowSuggestions={setShowSuggestions}
          speciesList={speciesList}
        />
        </TabsContent>
        <TabsContent value="verify" className="space-y-6">
          <VerificationQueue
            detections={pendingPaginatedDet}
            refreshQueue={refreshQueue}
            handleLoadMoreQueue={handleLoadMoreQueue}
            queueHasMore={queueHasMore}
            paginationLoading={PaginationLoading}
          />
        </TabsContent>
        <TabsContent value="verificationHistory" className="space-y-6">
          <VerificationHistoryContent />
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}