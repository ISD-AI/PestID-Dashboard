"use client";

import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, FolderTree, Image, Database } from "lucide-react";
import { getTaxonomyByRank, TaxonomyItem } from "@/lib/firebase/querySpecies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TaxonomyTreeProps {
  onSelect: (taxonomy: string, rank: string) => void;
  selectedTaxonomy: string | null;
}

export function TaxonomyTree({ onSelect, selectedTaxonomy }: TaxonomyTreeProps) {
  const [taxonomyData, setTaxonomyData] = useState<{
    orders: TaxonomyItem[];
    families: TaxonomyItem[];
    genera: TaxonomyItem[];
  }>({
    orders: [],
    families: [],
    genera: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [expandedFamilies, setExpandedFamilies] = useState<Set<string>>(new Set());
  
  // Fetch taxonomy data
  useEffect(() => {
    async function fetchTaxonomyData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch orders, families, and genera
        const [orders, families, genera] = await Promise.all([
          getTaxonomyByRank("order"),
          getTaxonomyByRank("family"),
          getTaxonomyByRank("genus"),
        ]);
        
        setTaxonomyData({
          orders,
          families,
          genera,
        });
      } catch (error) {
        console.error("Error fetching taxonomy data:", error);
        setError("Failed to load taxonomy data");
      } finally {
        setLoading(false);
      }
    }
    
    fetchTaxonomyData();
  }, []);
  
  // Toggle order expansion
  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };
  
  // Toggle family expansion
  const toggleFamily = (familyId: string) => {
    setExpandedFamilies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(familyId)) {
        newSet.delete(familyId);
      } else {
        newSet.add(familyId);
      }
      return newSet;
    });
  };
  
  // Handle selecting a taxonomy item
  const handleSelect = (id: string, rank: string) => {
    onSelect(id, rank);
  };
  
  // Reset filter
  const resetFilter = () => {
    onSelect("", "");
  };

  // Format count with thousands separator
  const formatCount = (count: number | undefined): string => {
    if (count === undefined) return "0";
    return count.toLocaleString();
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <FolderTree className="h-4 w-4" />
            <span>Loading taxonomy data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-destructive">
            <FolderTree className="h-4 w-4" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <FolderTree className="h-4 w-4" />
          Taxonomy Filter
        </CardTitle>
      </CardHeader>
      <CardContent className="py-0 px-2">
        {selectedTaxonomy && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilter}
            className="mb-2 w-full"
          >
            Clear Filter
          </Button>
        )}
        
        <div className="max-h-[400px] overflow-auto">
          <ul className="space-y-1">
            {taxonomyData.orders.map((order) => {
              const isExpanded = expandedOrders.has(order.id);
              const orderFamilies = taxonomyData.families.filter(
                (family) => family.parent === order.id
              );
              
              return (
                <li key={order.id} className="text-sm">
                  <div
                    className={cn(
                      "flex items-center py-1 px-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer",
                      selectedTaxonomy === order.id && "bg-accent text-accent-foreground font-medium"
                    )}
                  >
                    <button
                      onClick={() => toggleOrder(order.id)}
                      className="mr-1"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      {orderFamilies.length > 0 && (
                        isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
                      )}
                      {orderFamilies.length === 0 && <span className="w-3.5"></span>}
                    </button>
                    <span 
                      onClick={() => handleSelect(order.id, "order")}
                      className="flex-grow truncate"
                    >
                      {order.name}
                    </span>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <Database className="h-3 w-3" />
                            <span>{formatCount(order.instanceCount)}</span>
                            <Image className="h-3 w-3 ml-1" />
                            <span>{formatCount(order.imageCount)}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{formatCount(order.instanceCount)} specimens</p>
                          <p>{formatCount(order.imageCount)} images</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {isExpanded && orderFamilies.length > 0 && (
                    <ul className="pl-4 space-y-1 mt-1">
                      {orderFamilies.map((family) => {
                        const isExpanded = expandedFamilies.has(family.id);
                        const familyGenera = taxonomyData.genera.filter(
                          (genus) => genus.parent === family.id
                        );
                        
                        return (
                          <li key={family.id}>
                            <div
                              className={cn(
                                "flex items-center py-1 px-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer",
                                selectedTaxonomy === family.id && "bg-accent text-accent-foreground font-medium"
                              )}
                            >
                              <button
                                onClick={() => toggleFamily(family.id)}
                                className="mr-1"
                                aria-label={isExpanded ? "Collapse" : "Expand"}
                              >
                                {familyGenera.length > 0 && (
                                  isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
                                )}
                                {familyGenera.length === 0 && <span className="w-3.5"></span>}
                              </button>
                              <span 
                                onClick={() => handleSelect(family.id, "family")}
                                className="flex-grow truncate"
                              >
                                {family.name}
                              </span>
                              <TooltipProvider delayDuration={300}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                      <Database className="h-3 w-3" />
                                      <span>{formatCount(family.instanceCount)}</span>
                                      <Image className="h-3 w-3 ml-1" />
                                      <span>{formatCount(family.imageCount)}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="right">
                                    <p>{formatCount(family.instanceCount)} specimens</p>
                                    <p>{formatCount(family.imageCount)} images</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                            
                            {isExpanded && familyGenera.length > 0 && (
                              <ul className="pl-4 space-y-1 mt-1">
                                {familyGenera.map((genus) => (
                                  <li key={genus.id}>
                                    <div
                                      className={cn(
                                        "flex items-center py-1 px-2 hover:bg-accent hover:text-accent-foreground rounded-md cursor-pointer",
                                        selectedTaxonomy === genus.id && "bg-accent text-accent-foreground font-medium"
                                      )}
                                    >
                                      <span className="ml-4 truncate flex-grow" onClick={() => handleSelect(genus.id, "genus")}>
                                        {genus.name}
                                      </span>
                                      <TooltipProvider delayDuration={300}>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                              <Database className="h-3 w-3" />
                                              <span>{formatCount(genus.instanceCount)}</span>
                                              <Image className="h-3 w-3 ml-1" />
                                              <span>{formatCount(genus.imageCount)}</span>
                                            </div>
                                          </TooltipTrigger>
                                          <TooltipContent side="right">
                                            <p>{formatCount(genus.instanceCount)} specimens</p>
                                            <p>{formatCount(genus.imageCount)} images</p>
                                          </TooltipContent>
                                        </Tooltip>
                                      </TooltipProvider>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
