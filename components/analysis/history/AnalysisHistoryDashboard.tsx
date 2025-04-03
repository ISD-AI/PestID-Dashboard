'use client'

import React, { useState, useEffect } from 'react';
import { 
  getAnalysisHistory, 
  AnalysisHistoryItem, 
  deleteAnalysisById, 
  clearAnalysisHistory 
} from '@/lib/storage/analysisHistoryStorage';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  Filter, 
  Trash2, 
  Download, 
  BarChart, 
  Image as ImageIcon,
  Search,
  X,
  Info,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

export function AnalysisHistoryDashboard() {
  const [historyItems, setHistoryItems] = useState<AnalysisHistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<AnalysisHistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<AnalysisHistoryItem | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [modelFilter, setModelFilter] = useState('all');
  const [uniqueModels, setUniqueModels] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Load history items on mount
  useEffect(() => {
    setIsClient(true);
    loadHistory();
  }, []);

  // Extract unique models from history
  useEffect(() => {
    if (historyItems.length > 0) {
      const models = new Set<string>();
      historyItems.forEach(item => {
        item.models.forEach(model => models.add(model));
      });
      setUniqueModels(Array.from(models));
    }
  }, [historyItems]);

  // Filter history items when filters change
  useEffect(() => {
    let filtered = [...historyItems];
    
    // Filter by tab (type)
    if (activeTab !== 'all') {
      filtered = filtered.filter(item => item.type === activeTab);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.imageName.toLowerCase().includes(term) || 
        item.models.some(model => model.toLowerCase().includes(term))
      );
    }
    
    // Filter by model
    if (modelFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.models.includes(modelFilter)
      );
    }
    
    setFilteredItems(filtered);
  }, [historyItems, activeTab, searchTerm, modelFilter]);

  const loadHistory = () => {
    const history = getAnalysisHistory();
    setHistoryItems(history);
    setFilteredItems(history);
  };

  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this analysis?')) {
      deleteAnalysisById(id);
      loadHistory();
      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all analysis history? This cannot be undone.')) {
      clearAnalysisHistory();
      loadHistory();
      setSelectedItem(null);
    }
  };

  const handleExportHistory = () => {
    const dataStr = JSON.stringify(historyItems, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `pestid-analysis-history-${format(new Date(), 'yyyy-MM-dd')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleExportCsv = () => {
    // Create CSV header
    const headers = [
      'ID', 'Type', 'Timestamp', 'Image Name', 'Models', 
      'Result Type', 'Votes'
    ].join(',');
    
    // Create CSV rows
    const rows = historyItems.map(item => {
      const votes = item.type === 'battle' 
        ? (item.result as any).votes.length 
        : 'N/A';
      
      return [
        item.id,
        item.type,
        item.timestamp,
        item.imageName,
        item.models.join(';'),
        item.type,
        votes
      ].join(',');
    });
    
    // Combine header and rows
    const csv = [headers, ...rows].join('\n');
    
    // Create download link
    const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    const exportFileDefaultName = `pestid-analysis-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return dateString;
    }
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold">Analysis History</h2>
        <p className="text-muted-foreground">
          View and manage your past analysis results
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left panel - History list */}
        <div className="w-full lg:w-2/5 space-y-4">
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">History</CardTitle>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportHistory}
                    title="Export as JSON"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleExportCsv}
                    title="Export as CSV"
                  >
                    <BarChart className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearHistory}
                    className="text-destructive hover:text-destructive"
                    title="Clear all history"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Filters */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or model..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-9"
                  />
                  {searchTerm && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9" 
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={modelFilter} onValueChange={setModelFilter}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Filter by model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Models</SelectItem>
                      {uniqueModels.map(model => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
                <TabsList className="grid grid-cols-3 h-10">
                  <TabsTrigger value="all" className="text-sm">All</TabsTrigger>
                  <TabsTrigger value="single" className="text-sm">Single</TabsTrigger>
                  <TabsTrigger value="battle" className="text-sm">Battle</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            
            <CardContent className="px-3 pb-4">
              {filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
                  <h3 className="font-medium">No history found</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {historyItems.length === 0 
                      ? "You haven't analyzed any images yet." 
                      : "No results match your current filters."}
                  </p>
                  {historyItems.length > 0 && (
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setSearchTerm('');
                        setModelFilter('all');
                        setActiveTab('all');
                      }}
                    >
                      Clear filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 pt-2">
                  {filteredItems.map((item) => (
                    <div 
                      key={item.id}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-colors shadow-sm",
                        selectedItem?.id === item.id 
                          ? "bg-primary/10 border-primary" 
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => setSelectedItem(item)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          <span className="font-medium truncate max-w-[180px]">
                            {item.imageName}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => handleDeleteItem(item.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center mt-3 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{formatDate(item.timestamp)}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="outline" className="text-sm py-1">
                          {item.type === 'single' ? 'Single Analysis' : 'Battle Mode'}
                        </Badge>
                        {item.models.map((model, index) => (
                          <Badge key={index} variant="secondary" className="text-sm py-1 truncate max-w-[160px]">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right panel - Selected item details */}
        <div className="w-full lg:w-3/5">
          {selectedItem ? (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-xl">
                  <span>Analysis Details</span>
                  <Badge variant={selectedItem.type === 'battle' ? 'default' : 'secondary'} className="text-sm py-1">
                    {selectedItem.type === 'battle' ? 'Battle Mode' : 'Single Analysis'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="aspect-video relative rounded-md overflow-hidden border shadow-sm">
                  <img 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.imageName} 
                    className="object-contain w-full h-full"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground text-sm">Image</Label>
                    <p className="font-medium text-base mt-1">{selectedItem.imageName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Date</Label>
                    <p className="font-medium text-base mt-1">{formatDate(selectedItem.timestamp)}</p>
                  </div>
                </div>
                
                <Separator />
                
                {selectedItem.type === 'battle' ? (
                  <div className="space-y-5">
                    <h3 className="font-medium text-lg">Battle Results</h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <Card className="h-full shadow-sm">
                        <CardHeader className="py-3">
                          <CardTitle className="text-base font-medium">
                            {selectedItem.models[0]}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px] overflow-auto bg-muted/20 rounded-md p-4 text-sm">
                          {(selectedItem.result as any).leftResult}
                        </CardContent>
                      </Card>
                      
                      <Card className="h-full shadow-sm">
                        <CardHeader className="py-3">
                          <CardTitle className="text-base font-medium">
                            {selectedItem.models[1]}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px] overflow-auto bg-muted/20 rounded-md p-4 text-sm">
                          {(selectedItem.result as any).rightResult}
                        </CardContent>
                      </Card>
                    </div>
                    
                    {(selectedItem.result as any).votes.length > 0 && (
                      <div>
                        <h4 className="text-base font-medium mb-3">Votes</h4>
                        <div className="space-y-3">
                          {/* Filter duplicate votes by using timestamp as key */}
                          {Array.from(new Map((selectedItem.result as any).votes.map((vote: any) => 
                            [vote.timestamp, vote])).values()).map((vote: any, index: number) => (
                            <div key={index} className="text-sm p-3 bg-muted/20 rounded-md">
                              <span className="font-medium">
                                {vote.vote === 'left' && `${selectedItem.models[0]} is better`}
                                {vote.vote === 'right' && `${selectedItem.models[1]} is better`}
                                {vote.vote === 'tie' && "It's a tie"}
                                {vote.vote === 'both-bad' && "Both models are inaccurate"}
                              </span>
                              <span className="text-muted-foreground ml-2">
                                {formatDate(vote.timestamp)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <Label className="text-muted-foreground text-sm">Model</Label>
                      <p className="font-medium text-base mt-1">{selectedItem.models[0]}</p>
                    </div>
                    
                    <div>
                      <Label className="text-muted-foreground text-sm">Analysis Result</Label>
                      {(selectedItem.result as any).responseText && (
                        <div className="mt-4 text-sm">
                          <div className="prose prose-sm max-w-none markdown-content">
                            <ReactMarkdown>
                              {(selectedItem.result as any).responseText}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {(selectedItem.result as any).usage && (
                      <div>
                        <Label className="text-muted-foreground text-sm">API Usage</Label>
                        <div className="mt-2 text-sm">
                          <p>Prompt Tokens: {(selectedItem.result as any).usage.prompt_tokens}</p>
                          <p>Completion Tokens: {(selectedItem.result as any).usage.completion_tokens}</p>
                          <p>Total Tokens: {(selectedItem.result as any).usage.total_tokens}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end py-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedItem(null)}
                >
                  Close
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card className="shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Info className="h-16 w-16 text-muted-foreground mb-6" />
                <h3 className="text-xl font-medium">No analysis selected</h3>
                <p className="text-muted-foreground mt-3 max-w-md text-base">
                  Select an analysis from the history panel to view details.
                  {historyItems.length === 0 && " You haven't analyzed any images yet."}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
