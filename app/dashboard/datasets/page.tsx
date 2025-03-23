"use client";

import { useState, useEffect } from "react";
import { DashboardShell } from "@/components/dashboard/shell";
import { DashboardHeader } from "@/components/dashboard/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatasetOverview } from "@/components/datasets/dataset-overview";
import { SpeciesCard } from "@/components/datasets/species-card";
import { TaxonomyTree } from "@/components/datasets/taxonomy-tree";
import { SpeciesDataset, getPaginatedSpecies, getSpeciesStats } from "@/lib/firebase/querySpecies";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DatasetsPage() {
  const [speciesData, setSpeciesData] = useState<SpeciesDataset[]>([]);
  const [filteredData, setFilteredData] = useState<SpeciesDataset[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSpecies: 0,
    totalImages: 0,
    totalInstances: 0,
    pestSpecies: 0,
    endangeredSpecies: 0,
    vulnerableSpecies: 0,
    orderCounts: {},
    familyCounts: {},
    dangerLevelCounts: {},
  });
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [selectedTaxonomy, setSelectedTaxonomy] = useState<string | null>(null);
  const [taxonomyRank, setTaxonomyRank] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch species data from Firebase
        const { species, pagination } = await getPaginatedSpecies({
          limit: 12,
          filterType,
          searchTerm,
          taxonomyId: selectedTaxonomy || '',
          taxonomyRank,
        });
        
        setSpeciesData(species);
        setFilteredData(species); 
        setLastDoc(pagination.lastDoc);
        setHasMore(pagination.hasMore);
        
        // Fetch species statistics
        const statsData = await getSpeciesStats();
        setStats(statsData);
      } catch (error) {
        console.error("Error loading dataset:", error);
        setError("Failed to load species data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [filterType, searchTerm, selectedTaxonomy, taxonomyRank]);

  // Function to load more species
  const loadMoreSpecies = async () => {
    if (!hasMore || isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      
      const { species, pagination } = await getPaginatedSpecies({
        limit: 12,
        startAfterDoc: lastDoc,
        filterType,
        searchTerm,
        taxonomyId: selectedTaxonomy || '',
        taxonomyRank,
      });
      
      setSpeciesData(prevData => [...prevData, ...species]);
      setFilteredData(prevData => [...prevData, ...species]);
      setLastDoc(pagination.lastDoc);
      setHasMore(pagination.hasMore);
    } catch (error) {
      console.error("Error loading more species:", error);
      setError("Failed to load more species. Please try again.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle taxonomy selection
  const handleTaxonomySelect = (taxonomy: string, rank: string) => {
    setSelectedTaxonomy(taxonomy || null);
    setTaxonomyRank(rank);
  };

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Species Datasets"
        text="Browse and analyze species datasets for pest identification and monitoring."
      />
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : isLoading ? (
            <Card>
              <CardContent className="min-h-[50vh] flex items-center justify-center">
                <p>Loading dataset statistics...</p>
              </CardContent>
            </Card>
          ) : (
            <DatasetOverview data={speciesData} stats={stats} />
          )}
        </TabsContent>
        
        <TabsContent value="datasets" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-4">
            {/* Taxonomy Tree */}
            <div className="md:col-span-1">
              <TaxonomyTree 
                onSelect={handleTaxonomySelect}
                selectedTaxonomy={selectedTaxonomy}
              />
            </div>
            
            {/* Species Dataset */}
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Species Dataset</CardTitle>
                {selectedTaxonomy && (
                  <div className="text-sm text-muted-foreground">
                    Filtered by taxonomy: {taxonomyRank.charAt(0).toUpperCase() + taxonomyRank.slice(1)}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <div>
                    <Label htmlFor="search">Search Species</Label>
                    <Input
                      id="search"
                      placeholder="Search by name, order, family..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="filter">Filter By</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger id="filter">
                        <SelectValue placeholder="Filter type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Species</SelectItem>
                        <SelectItem value="pest">Pest Species</SelectItem>
                        <SelectItem value="endangered">Endangered Species</SelectItem>
                        <SelectItem value="vulnerable">Vulnerable Species</SelectItem>
                        <SelectItem value="high_risk">High Risk</SelectItem>
                        <SelectItem value="medium_risk">Medium Risk</SelectItem>
                        <SelectItem value="low_risk">Low Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {error ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                ) : isLoading ? (
                  <div className="min-h-[50vh] flex items-center justify-center">
                    <p>Loading species data...</p>
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="min-h-[30vh] flex items-center justify-center">
                    <p>No species found matching your criteria.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                      {filteredData.map((species) => (
                        <SpeciesCard key={species.scientificName} species={species} />
                      ))}
                    </div>
                    
                    {hasMore && (
                      <div className="mt-6 flex justify-center">
                        <button
                          onClick={loadMoreSpecies}
                          disabled={isLoadingMore}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                        >
                          {isLoadingMore ? "Loading..." : "Load More"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}