import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/detections/data-table';
import { columns } from '@/components/detections/columns';
import { DetectionStats } from '@/components/detections/detection-stats';
import { DetectionMap } from '@/components/detections/detection-map';
import { DetectionDistribution } from '@/components/detections/detection-distribution';
import { DetectionImgGrid } from '@/components/detections/detectionImgGrid';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Grid, List, Filter, AlertCircle } from 'lucide-react';
import { MapDetection, PaginatedDetection, VeriStats, Species } from '@/types/detection';
import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CategoryDistribution } from '@/components/detections/category-distribution';
import { CategoryChartData } from '@/types/verification';

interface DetectionOverviewProps {
  verifiStats: VeriStats;
  chartData: { month: string; observations: number }[];
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  categoryChartData: CategoryChartData[];
  mapDetections: MapDetection[];
  recentDetections: PaginatedDetection[];
  gridDetections: PaginatedDetection[];
  viewMode: 'grid' | 'table';
  setViewMode: (mode: 'grid' | 'table') => void;
  filterType: 'all' | 'verified' | 'rejected';
  setFilterType: (type: 'all' | 'verified' | 'rejected') => void;
  handleLoadMore: () => void;
  hasMore: boolean;
  getBadgeClass: (status: string) => string;
  formatDate: (dateString: string) => string;
  PaginationLoading: boolean;
  selectedDaysAgo: number;
  setSelectedDaysAgo: (days: number) => void;
  yearRange: [number, number];
  setYearRange: (range: [number, number]) => void;
  monthRange: [number, number];
  setMonthRange: (range: [number, number]) => void;
  speciesInput: string;
  setSpeciesInput: (input: string) => void;
  selectedSpecies: string | null;
  setSelectedSpecies: (species: string | null) => void;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  speciesList: Species[] | null;
}

export const DetectionOverview = ({
  categoryChartData,
  verifiStats,
  chartData,
  selectedYear,
  setSelectedYear,
  mapDetections,
  recentDetections,
  gridDetections,
  viewMode,
  setViewMode,
  filterType,
  setFilterType,
  handleLoadMore,
  hasMore,
  getBadgeClass,
  formatDate,
  PaginationLoading,
  selectedDaysAgo,
  setSelectedDaysAgo,
  yearRange,
  setYearRange,
  monthRange,
  setMonthRange,
  speciesInput,
  setSpeciesInput,
  selectedSpecies,
  setSelectedSpecies,
  showSuggestions,
  setShowSuggestions,
  speciesList,
  
}: DetectionOverviewProps) => {
  const [validMarkerCount, setValidMarkerCount] = useState<number>(0);

  const exportTableDataAsCSV = () => {
    try {
      // Generate filename with date and filter type
      const timestamp = new Date().toISOString().split('T')[0];
      const filterLabel = filterType !== 'all' ? `-${filterType}` : '';
      const fileName = `PestID-Detections${filterLabel}-${timestamp}.csv`;
      
      // CSV Headers
      const headers = [
        "Count",
        "Detection ID",
        "UserID",
        "Verification Status",
        "Discovered Date",
        "Species Name",
        "Accuracy",
        "Image Description",
        "Image Link",
        "Image Coordinates (Lat|Long)",
        "Image Location",
        "User Coordinates (Lat|Long)",
        "User Location"
      ];
      
      // Helper function to escape CSV field values properly
      const escapeCSV = (value: string) => {
        if (!value) return '';
        
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };
      
      // Format data for CSV with proper escaping
      const csvData = gridDetections.map((detection, index) => {
        // Handle null/undefined values
        const safeImageLat = detection.imageLat || 0;
        const safeImageLong = detection.imageLong || 0;
        
        return [
          escapeCSV((index + 1).toString()),
          escapeCSV(detection.detectionID),
          escapeCSV(detection.userId),
          escapeCSV(detection.curVeriStatus),
          escapeCSV(formatDate(detection.timestamp)),
          escapeCSV(detection.scientificName || 'Unknown'),
          escapeCSV((detection.confScore * 100).toFixed(2) + '%'),
          escapeCSV(detection.funFacts || 'No description'),
          escapeCSV(detection.inputImageURL || ''),
          escapeCSV(`${safeImageLat}|${safeImageLong}`),
          escapeCSV(detection.imageLocation || 'Unknown'),
          escapeCSV(`${detection.userLat}|${detection.userLong}`),
          escapeCSV(detection.userLocation || 'Unknown')
        ];
      });
      
      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.join(','))
      ].join('\n');
      
      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  // Listen for console logs to capture the valid marker count
  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = function(...args) {
      originalConsoleLog.apply(console, args);
      
      // Check if this is our debug log
      if (args[0] === 'Map Markers Debug:' && args[1] && typeof args[1] === 'object') {
        const debugInfo = args[1];
        if (debugInfo.validMarkers !== undefined) {
          setValidMarkerCount(debugInfo.validMarkers);
        }
      }
    };
    
    // Restore original console.log on cleanup
    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  return (
    <div className="space-y-6">
      <DetectionStats stats={verifiStats} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DetectionDistribution
          detections={chartData}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
        
        <CategoryDistribution
          categoryData={categoryChartData}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Detection Locations</CardTitle>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {validMarkerCount} of {mapDetections.length} {mapDetections.length === 1 ? 'marker' : 'markers'} 
                {filterType !== 'all' && ` (${filterType})`}
              </div>
              {validMarkerCount !== mapDetections.length && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Some markers cannot be displayed due to missing or invalid coordinates.
                        Only {validMarkerCount} of {mapDetections.length} markers have valid location data.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardHeader>
          <CardContent className="pl-2">
            <DetectionMap
              detections={mapDetections}
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
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Detections</CardTitle>
            <div className="flex items-center space-x-2">
              <Select
                value={selectedDaysAgo.toString()}
                onValueChange={(value) => setSelectedDaysAgo(Number(value))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Last 3 days</SelectItem>
                  <SelectItem value="5">Last 5 days</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={recentDetections} pageSize={5} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Detections</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
                onClick={exportTableDataAsCSV}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 bg-green-50 text-green-600 border-green-200"
                disabled={gridDetections.length === 0}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Export</span>
            </Button>
            <Select
              value={filterType}
              onValueChange={(value: 'all' | 'verified' | 'rejected') => setFilterType(value)}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Detections</SelectItem>
                <SelectItem value="verified">Verified Correct</SelectItem>
                <SelectItem value="rejected">Rejected Incorrect</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex border rounded-md border-border overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-muted hover:bg-muted/80' : 'hover:bg-muted/50 transition-colors'}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('table')}
                className={viewMode === 'table' ? 'bg-muted hover:bg-muted/80' : 'hover:bg-muted/50 transition-colors'}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {viewMode === 'grid' ? (
              <DetectionImgGrid
                items={gridDetections}
                getBadgeClass={getBadgeClass}
                formatDate={formatDate}
              />
            ) : (
              <DataTable columns={columns} data={gridDetections} />
            )}
            {hasMore && (
              <div className="flex justify-center mt-6">
                {PaginationLoading ? (
                  <div className="flex items-center space-x-2">
                    <svg
                      className="animate-spin h-5 w-5 text-primary/70"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <Button onClick={handleLoadMore} variant="outline">
                    Load More Detections
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}