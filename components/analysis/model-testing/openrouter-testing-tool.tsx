'use client'

import { useState, useEffect } from 'react';
import { useOpenRouterAnalysis } from '@/hooks/use-openrouter-analysis';
import { ModelSelector } from './ModelSelector';
import { AnalysisConfig } from './AnalysisConfig';
import { BattleMode } from './BattleMode';
import { OllamaConfig } from './OllamaConfig';
import { ProviderSelector } from './ProviderSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Brain, 
  AlertCircle, 
  ImageIcon, 
  Settings,
  BarChart,
  Award,
  Key,
  History,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface OpenRouterTestingToolProps {
  className?: string;
}

interface AnalysisMode {
  type: 'free' | 'battle';
}

interface Result {
  model: string;
  responseText?: string;
}

interface BattleResults {
  leftModel: string;
  rightModel: string;
  leftResult: string;
  rightResult: string;
}

interface StreamingState {
  status: 'initial-detection' | 'refining' | 'complete';
  message?: string;
}

interface OpenRouterAnalysis {
  imageFile: File | null;
  selectedImage: string | null;
  imageDimensions: { width: number; height: number } | null;
  isLoading: boolean;
  isLoadingModels: boolean;
  error: string | null;
  result: Result | null;
  battleResults: BattleResults | null;
  streamingState: StreamingState;
  availableModels: string[];
  selectedModels: string[];
  apiKey: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  analysisMode: AnalysisMode;
  provider: any;
  ollamaModels: any;
  ollamaBaseUrl: string;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  processImage: () => void;
  fetchModels: () => void;
  setApiKey: (apiKey: string) => void;
  setSystemPrompt: (systemPrompt: string) => void;
  setMaxTokens: (maxTokens: number) => void;
  setTemperature: (temperature: number) => void;
  handleModelSelection: (models: string[]) => void;
  updateAnalysisMode: (mode: AnalysisMode) => void;
  handleBattleVote: (vote: 'left' | 'right') => void;
  setProvider: (provider: any) => void;
  setOllamaBaseUrl: (baseUrl: string) => void;
  setOllamaModels: (models: any) => void;
}

export default function OpenRouterTestingTool({ className }: OpenRouterTestingToolProps) {
  const {
    imageFile,
    selectedImage,
    imageDimensions,
    isLoading,
    isLoadingModels,
    error,
    result,
    battleResults,
    streamingState,
    availableModels,
    selectedModels,
    apiKey,
    systemPrompt,
    maxTokens,
    temperature,
    analysisMode,
    provider,
    ollamaModels,
    ollamaBaseUrl,
    handleImageUpload,
    processImage,
    fetchModels,
    setApiKey,
    setSystemPrompt,
    setMaxTokens,
    setTemperature,
    handleModelSelection,
    updateAnalysisMode,
    handleBattleVote,
    setProvider,
    setOllamaBaseUrl,
    setOllamaModels
  } = useOpenRouterAnalysis();

  const [activeTab, setActiveTab] = useState<string>('upload');
  const [isMounted, setIsMounted] = useState(false);

  // This helps prevent hydration mismatch errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle image upload from file input
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleImageUpload(e);
    if (e.target.files && e.target.files.length > 0) {
      setActiveTab('config');
    }
  };

  // Handle analyze button click
  const handleAnalyze = () => {
    processImage();
    setActiveTab('results');
  };

  // Calculate progress based on streaming state
  const calculateProgress = () => {
    if (streamingState.status === 'initial-detection') return 30;
    if (streamingState.status === 'refining') return 70;
    if (streamingState.status === 'complete') return 100;
    return 0;
  };

  // Helper to determine if analyze button should be enabled
  const canAnalyze = 
    selectedImage && 
    selectedModels.length > 0 &&
    (analysisMode.type !== 'free' || selectedModels.length === 1) &&
    (analysisMode.type !== 'battle' || selectedModels.length >= 2);

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Configuration Column */}
        <div className="w-full sm:w-1/3 space-y-6">
          {/* Tabs for tool sections */}
          {isMounted && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-4 w-full">
                <TabsTrigger value="upload" className="flex items-center justify-center">
                  <Upload className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Upload</span>
                </TabsTrigger>
                <TabsTrigger value="config" className="flex items-center justify-center">
                  <Settings className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Configure</span>
                </TabsTrigger>
                <TabsTrigger value="results" className="flex items-center justify-center">
                  <BarChart className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Results</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center justify-center">
                  <History className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
              </TabsList>

              {/* Upload Tab */}
              <TabsContent value="upload">
                <Card className="shadow-sm border-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Upload Image</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed rounded-lg p-6 text-center bg-muted/10 hover:bg-muted/20 transition-colors">
                        <div className="flex justify-center mb-4">
                          <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <p className="text-sm mb-4">Drag and drop an image, or click to browse</p>
                        <label className="cursor-pointer">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileInputChange}
                          />
                          <span className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                            Select Image
                          </span>
                        </label>
                      </div>
                      
                      {error && (
                        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive rounded">
                          <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                          <p className="text-xs text-destructive">
                            {typeof error === 'string' 
                              ? error 
                              : error && typeof error === 'object' && 'message' in error 
                                ? error.message 
                                : 'An unknown error occurred'}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Configure Tab */}
              <TabsContent value="config">
                <div className="space-y-6">
                  {/* Provider Selection */}
                  <ProviderSelector 
                    provider={provider}
                    onProviderChange={setProvider}
                  />

                  {/* Provider-specific Configuration */}
                  {provider.type === 'openrouter' ? (
                    /* OpenRouter API Key Section */
                    <Card className="shadow-sm border-muted">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-medium flex items-center">
                          <Key className="h-4 w-4 mr-2" />
                          OpenRouter API Key
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="block text-sm font-medium mb-1" htmlFor="api-key">API Key</label>
                            <input 
                              id="api-key"
                              type="password"
                              placeholder="sk-or-..."
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              className="block w-full p-2 border rounded-md text-sm"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Your API key is used locally and never stored on our servers.
                            </p>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={fetchModels}
                              disabled={isLoadingModels}
                            >
                              {isLoadingModels ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Loading...
                                </>
                              ) : 'Refresh Models'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    /* Ollama Configuration */
                    <OllamaConfig 
                      baseUrl={ollamaBaseUrl}
                      onBaseUrlChange={setOllamaBaseUrl}
                      ollamaModels={ollamaModels}
                      isLoading={isLoadingModels}
                      error={error}
                    />
                  )}
                  
                  {/* Model Selection */}
                  <Card className="shadow-sm border-muted">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">Model Selection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {provider.type === 'openrouter' && (
                          <Tabs defaultValue="free" className="w-full">
                            <TabsList className="grid grid-cols-2 mb-4">
                              <TabsTrigger 
                                value="free" 
                                onClick={() => updateAnalysisMode({ type: 'free' })}
                                disabled={isLoading}
                              >
                                <Brain className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Single Model</span>
                              </TabsTrigger>
                              <TabsTrigger 
                                value="battle" 
                                onClick={() => updateAnalysisMode({ type: 'battle' })}
                                disabled={isLoading}
                              >
                                <Award className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Battle Mode</span>
                              </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="free">
                              <div className="text-sm text-muted-foreground mb-4">
                                Select a model to analyze your image. Free models are marked with a ✓.
                              </div>
                            </TabsContent>
                            
                            <TabsContent value="battle">
                              <div className="text-sm text-muted-foreground mb-4">
                                Select two models to compare their analysis results side by side.
                              </div>
                            </TabsContent>
                          </Tabs>
                        )}
                        
                        {provider.type === 'ollama' && (
                          <div className="text-sm text-muted-foreground mb-4">
                            Select a model to analyze your image with Ollama.
                            <p className="mt-2 text-xs">Note: Battle mode is not available with Ollama.</p>
                          </div>
                        )}
                        
                        <div className="border rounded-md p-4">
                          <ModelSelector
                            availableModels={provider.type === 'openrouter' ? availableModels : ollamaModels}
                            selectedModels={selectedModels}
                            onSelectionChange={handleModelSelection}
                            maxSelections={provider.type === 'ollama' ? 1 : (analysisMode.type === 'battle' ? 2 : 1)}
                            isProviderOllama={provider.type === 'ollama'}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Analysis Configuration */}
                  <AnalysisConfig 
                    mode={analysisMode.type}
                    onModeChange={(mode) => updateAnalysisMode({ type: mode })}
                    systemPrompt={systemPrompt}
                    onSystemPromptChange={setSystemPrompt}
                    maxTokens={maxTokens}
                    onMaxTokensChange={setMaxTokens}
                    temperature={temperature}
                    onTemperatureChange={setTemperature}
                    isOllama={provider.type === 'ollama'}
                  />
                  
                  <Button 
                    className="w-full"
                    onClick={handleAnalyze}
                    disabled={!canAnalyze || isLoading}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    {isLoading ? 'Analyzing...' : 'Analyze Image'}
                  </Button>
                </div>
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results">
                <Card className="shadow-sm border-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Analysis Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        <p className="text-sm">{streamingState.message || 'Processing image...'}</p>
                        <Progress value={calculateProgress()} className="h-2" />
                      </div>
                    ) : result || (battleResults && battleResults.leftModel) ? (
                      <div className="space-y-4">
                        <p className="text-sm font-medium flex items-center">
                          <Award className="h-4 w-4 mr-2 text-primary" />
                          Analysis Complete
                        </p>
                        <p className="text-xs text-muted-foreground">
                          View the detailed results in the main panel
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">
                          Click "Analyze Image" to start the analysis
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history">
                <Card className="shadow-sm border-muted">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-medium">Analysis History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      View and manage your past analyses.
                    </p>
                    <div className="mt-4">
                      <Button variant="outline" disabled>
                        <History className="mr-2 h-4 w-4" />
                        History feature temporarily unavailable
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Main Content Area */}
        <div className="w-full sm:w-2/3 space-y-6">
          {/* Image Preview */}
          {selectedImage && (
            <Card className="shadow-sm border-muted overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Image Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative aspect-video max-h-[40vh] overflow-hidden">
                  <img 
                    src={selectedImage} 
                    alt="Analysis" 
                    className="w-full h-full object-contain" 
                  />
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Analysis Results */}
          {analysisMode.type === 'free' && result && (
            <Card className="shadow-sm border-muted">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="font-medium text-sm">Model: <span className="text-primary">{result.model || 'Unknown'}</span></p>
                  
                  <div className="p-4 bg-muted/10 rounded-md">
                    {result.responseText ? (
                      <div className="prose prose-sm max-w-none markdown-content">
                        {/* Try to detect if the response is a valid markdown/text or an error object */}
                        {typeof result.responseText === 'string' && 
                         !result.responseText.startsWith('{') && 
                         !result.responseText.startsWith('[') ? (
                          <ReactMarkdown>
                            {result.responseText}
                          </ReactMarkdown>
                        ) : (
                          <div className="bg-red-50 p-4 rounded-md border border-red-200">
                            <h3 className="text-red-800 text-sm font-medium mb-2">Error Response</h3>
                            <div className="overflow-auto max-h-[300px] text-xs">
                              <pre className="whitespace-pre-wrap break-all">
                                {typeof result.responseText === 'string' 
                                  ? result.responseText 
                                  : JSON.stringify(result.responseText, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        No analysis results available yet
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Battle Mode Comparison */}
          {analysisMode.type === 'battle' && battleResults && battleResults.leftModel && (
            <BattleMode 
              leftModelName={battleResults.leftModel}
              rightModelName={battleResults.rightModel}
              leftModelResult={battleResults.leftResult}
              rightModelResult={battleResults.rightResult}
              onVote={handleBattleVote}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
