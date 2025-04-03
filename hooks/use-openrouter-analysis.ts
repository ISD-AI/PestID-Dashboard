import { useState, useEffect } from 'react';
import { 
  ImageDimensions, 
  AnalysisResult, 
  StreamingState, 
  OpenRouterModel,
  AnalysisMode,
  BattleModeResults,
  AnalysisProvider
} from '@/types/types';
import { saveAnalysisToHistory, saveBattleToHistory, getAnalysisHistory } from '@/lib/storage/analysisHistoryStorage';
import { testOllamaConnection, fetchOllamaModels } from '@/lib/ollama/ollamaService';

// Define a proper error type to handle different error scenarios
type AnalysisError = string | null | {
  type: 'openrouter' | 'ollama';
  message: string;
};

export const useOpenRouterAnalysis = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [battleResults, setBattleResults] = useState<BattleModeResults>({
    leftModel: '',
    leftResult: '',
    rightModel: '',
    rightResult: '',
    votes: []
  });
  const [error, setError] = useState<AnalysisError>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [availableModels, setAvailableModels] = useState<OpenRouterModel[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>({
    type: 'free',
    selectedModels: [],
    provider: { type: 'openrouter' }
  });
  const [streamingState, setStreamingState] = useState<StreamingState>({
    status: 'initial-detection',
    currentDetectionIndex: 0,
    message: 'Initializing analysis...'
  });
  const [maxTokens, setMaxTokens] = useState<number>(1024);
  const [temperature, setTemperature] = useState<number>(0.2);
  const [lastSavedResultId, setLastSavedResultId] = useState<string | null>(null);
  // Ollama specific state
  const [provider, setProvider] = useState<AnalysisProvider>({ type: 'openrouter' });
  const [ollamaModels, setOllamaModels] = useState<string[]>([]);
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState<string>('http://localhost:11434');
  const [ollamaModelsCache, setOllamaModelsCache] = useState<Record<string, string[]>>({});

  // Fetch available models when API key changes or provider changes
  useEffect(() => {
    if (provider.type === 'openrouter') {
      fetchOpenRouterModels();
    } else if (provider.type === 'ollama' && ollamaBaseUrl) {
      fetchOllamaModelsList();
    }
  }, [apiKey, provider.type, ollamaBaseUrl]);

  // Update selected models when available models change
  useEffect(() => {
    // Reset selected models when provider changes
    if (provider.type === 'openrouter' && availableModels.length > 0 && selectedModels.length === 0) {
      // Preselect the first free model if no model is selected yet
      const freeModels = availableModels.filter((model: OpenRouterModel) => model.isFree);
      if (freeModels.length > 0) {
        setSelectedModels([freeModels[0].id]);
      } else {
        setSelectedModels([availableModels[0].id]);
      }
    } else if (provider.type === 'ollama' && ollamaModels.length > 0 && selectedModels.length === 0) {
      // Preselect the first Ollama model
      setSelectedModels([ollamaModels[0]]);
    }
  }, [availableModels, ollamaModels, provider.type]);

  // Update image dimensions when image is selected
  useEffect(() => {
    if (selectedImage) {
      const img = document.createElement('img');
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.src = selectedImage;
    }
  }, [selectedImage]);

  // Fetch available OpenRouter models
  const fetchOpenRouterModels = async () => {
    try {
      setIsLoadingModels(true);
      setError(null);

      const url = new URL('/api/analysis/openrouter', window.location.origin);
      if (apiKey) {
        url.searchParams.append('apiKey', apiKey);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success && data.models) {
        setAvailableModels(data.models);
      } else {
        throw new Error(data.error || 'Failed to fetch models');
      }
    } catch (error) {
      console.error('Error fetching OpenRouter models:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while fetching models');
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Fetch available Ollama models
  const fetchOllamaModelsList = async () => {
    try {
      // Don't proceed if URL is empty
      if (!ollamaBaseUrl) {
        return;
      }

      setIsLoadingModels(true);
      setError(null);

      // Check if we have cached models for this URL
      if (ollamaModelsCache[ollamaBaseUrl]) {
        console.log('Using cached Ollama models for:', ollamaBaseUrl);
        setOllamaModels(ollamaModelsCache[ollamaBaseUrl]);
        setIsLoadingModels(false);
        return;
      }

      console.log('Fetching Ollama models from:', ollamaBaseUrl);
      const url = new URL('/api/analysis/ollama', window.location.origin);
      url.searchParams.append('baseUrl', ollamaBaseUrl);

      try {
        const response = await fetch(url.toString());
        const data = await response.json();
        
        if (data.success && data.models) {
          // Cache the models for this URL
          setOllamaModelsCache(prev => ({
            ...prev,
            [ollamaBaseUrl]: data.models
          }));
          
          setOllamaModels(data.models);
          setError(null);
        } else {
          // Handle API-level errors (e.g., wrong URL format, connection issues)
          const errorMessage = data.error || 'Failed to fetch Ollama models';
          console.error('Ollama API error:', errorMessage);
          setError({
            type: 'ollama',
            message: `Ollama error: ${errorMessage}`
          });
          setOllamaModels([]);
        }
      } catch (fetchError) {
        // Handle network-level errors (e.g., CORS, network down)
        console.error('Fetch error when connecting to Ollama:', fetchError);
        setError({
          type: 'ollama',
          message: `Connection error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to Ollama server'}`
        });
        setOllamaModels([]);
      }
    } catch (error) {
      // Handle unexpected errors in our own code
      console.error('Unexpected error in fetchOllamaModelsList:', error);
      setError({
        type: 'ollama',
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`
      });
      setOllamaModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  // Public method to fetch models based on current provider
  const fetchModels = () => {
    if (provider.type === 'openrouter') {
      fetchOpenRouterModels();
    } else {
      fetchOllamaModelsList();
    }
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      resetStates();
    }
  };

  // Reset all states
  const resetStates = () => {
    setResult(null);
    setBattleResults({
      leftModel: '',
      leftResult: '',
      rightModel: '',
      rightResult: '',
      votes: []
    });
    setError(null);
    setStreamingState({
      status: 'initial-detection',
      currentDetectionIndex: 0,
      message: 'Initializing analysis...'
    });
    setLastSavedResultId(null);
  };

  // Handle form submission for analysis
  const processImage = async () => {
    if (!imageFile) return;

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setBattleResults({
        leftModel: '',
        leftResult: '',
        rightModel: '',
        rightResult: '',
        votes: []
      });

      // Resize the image to a reasonable size to avoid large uploads
      const maxSize = 1200;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = await createImageBitmap(imageFile);
      
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.9);
      });

      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');
      
      // Set appropriate streaming state and mode
      if (analysisMode.type === 'battle' && selectedModels.length >= 2) {
        setStreamingState({
          status: 'initial-detection',
          currentDetectionIndex: 0,
          message: `Running battle mode with ${selectedModels.slice(0, 2).length} models...`
        });
        
        formData.append('mode', 'battle');
        formData.append('selectedModels', JSON.stringify(selectedModels.slice(0, 2)));
      } else {
        setStreamingState({
          status: 'initial-detection',
          currentDetectionIndex: 0,
          message: 'Analyzing image...'
        });
        
        formData.append('mode', 'free');
        formData.append('modelId', selectedModels[0]);
      }
      
      // Add provider-specific params
      if (provider.type === 'openrouter') {
        // OpenRouter params
        if (apiKey) {
          formData.append('apiKey', apiKey);
        }
        
        // API endpoint for OpenRouter
        const url = '/api/analysis/openrouter';
        await processWithProvider(url, formData);
      } else {
        // Ollama params
        formData.append('baseUrl', ollamaBaseUrl);
        formData.append('modelName', selectedModels[0]);
        
        // API endpoint for Ollama
        const url = '/api/analysis/ollama';
        await processWithProvider(url, formData);
      }
      
      // Add common params
      if (systemPrompt) {
        formData.append('systemPrompt', systemPrompt);
      }
      
      if (maxTokens) {
        formData.append('maxTokens', maxTokens.toString());
      }
      
      if (temperature) {
        formData.append('temperature', temperature.toString());
      }

    } catch (error) {
      console.error('Error processing image:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while processing the image');
    } finally {
      setIsLoading(false);
    }
  };

  // Process with the selected provider
  const processWithProvider = async (url: string, formData: FormData) => {
    // Make the API request
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to analyze image');
    }

    if (analysisMode.type === 'battle') {
      const battleData = {
        leftModel: data.leftModel,
        leftResult: data.leftResult?.responseText || '',
        rightModel: data.rightModel,
        rightResult: data.rightResult?.responseText || '',
        votes: []
      };
      
      setBattleResults(battleData);
      
      // Save to history with required parameters
      const savedBattleId = saveBattleToHistory({
        leftModel: battleData.leftModel,
        leftResult: battleData.leftResult,
        rightModel: battleData.rightModel,
        rightResult: battleData.rightResult,
        votes: []
      }, selectedImage, imageFile?.name || "image.jpg");
      
      setLastSavedResultId(savedBattleId);
      
    } else {
      // For free mode
      const resultData: AnalysisResult = {
        model: data.model,
        responseText: data.responseText,
        usage: data.usage
      };
      
      setResult(resultData);
      
      // Save to history with required parameters
      const savedResultId = saveAnalysisToHistory(
        resultData,
        selectedImage,
        imageFile?.name || "image.jpg"
      );
      
      setLastSavedResultId(savedResultId);
    }
  };

  // Handle model selection changes
  const handleModelSelection = (modelIds: string[]) => {
    // Ensure only one model is selected in free mode
    if (analysisMode.type === 'free' && modelIds.length > 1) {
      // Keep only the most recently selected model
      setSelectedModels([modelIds[modelIds.length - 1]]);
      return;
    }
    
    // For battle mode with OpenRouter, ensure exactly 2 models
    if (analysisMode.type === 'battle' && provider.type === 'openrouter') {
      if (modelIds.length > 2) {
        setSelectedModels(modelIds.slice(-2)); // Keep last 2 selected
        return;
      }
    }
    
    // For Ollama, ensure only one model is selected
    if (provider.type === 'ollama' && modelIds.length > 1) {
      setSelectedModels([modelIds[modelIds.length - 1]]);
      return;
    }
    
    setSelectedModels(modelIds);
  };

  // Update analysis mode
  const updateAnalysisMode = (mode: Partial<AnalysisMode>) => {
    setAnalysisMode(prev => ({
      ...prev,
      ...mode
    }));
    
    // Reset selected models if changing mode and no models are selected
    if (mode.type && mode.type !== analysisMode.type) {
      resetStates();
    }
  };

  // Handle battle vote
  const handleBattleVote = (vote: 'left' | 'right' | 'tie' | 'both-bad') => {
    if (!lastSavedResultId) return;
    
    // Update local state
    setBattleResults(prev => {
      const newVotes = [...prev.votes, {
        vote,
        timestamp: new Date().toISOString()
      }];
      
      return {
        ...prev,
        votes: newVotes
      };
    });
    
    // Update in storage
    try {
      const history = getAnalysisHistory();
      const existingItem = history.find(item => item.id === lastSavedResultId);
      
      if (existingItem && existingItem.type === 'battle') {
        // Update the existing entry with the new vote
        const updatedHistory = history.map(item => {
          if (item.id === lastSavedResultId) {
            return {
              ...item,
              result: {
                ...(item.result as any),
                votes: [...(item.result as any).votes, {
                  vote,
                  timestamp: new Date().toISOString()
                }]
              }
            };
          }
          return item;
        });
        
        // Save the updated history
        localStorage.setItem('pestid-analysis-history', JSON.stringify(updatedHistory));
      }
    } catch (error) {
      console.error('Failed to update battle votes in history:', error);
    }
  };

  // Set provider with URL validation for Ollama
  const handleSetProvider = async (newProvider: AnalysisProvider) => {
    setProvider(newProvider);
    
    // Reset selected models when switching providers
    setSelectedModels([]);
    
    // If switching to Ollama, test the connection and force single mode
    if (newProvider.type === 'ollama') {
      if (newProvider.baseUrl) {
        setOllamaBaseUrl(newProvider.baseUrl);
        fetchOllamaModelsList();
      }
      
      // Force single mode (free) for Ollama as battle mode is not supported
      if (analysisMode.type === 'battle') {
        setAnalysisMode(prev => ({
          ...prev,
          type: 'free'
        }));
      }
    }
  };

  return {
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
    setProvider: handleSetProvider,
    setOllamaBaseUrl,
    setOllamaModels
  };
};
