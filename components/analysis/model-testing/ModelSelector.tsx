'use client'

import { useState } from 'react';
import { OpenRouterModel } from '@/types/types';
import { Check, Star } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  availableModels: Array<OpenRouterModel | string>;
  selectedModels: string[];
  onSelectionChange: (modelIds: string[]) => void;
  maxSelections: number;
  isProviderOllama?: boolean;
}

export function ModelSelector({
  availableModels,
  selectedModels,
  onSelectionChange,
  maxSelections,
  isProviderOllama = false
}: ModelSelectorProps) {
  // Handle model selection
  const handleModelSelection = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      // Deselect the model
      onSelectionChange(selectedModels.filter(id => id !== modelId));
    } else {
      // For Ollama, always replace the current selection with the new one
      if (isProviderOllama) {
        onSelectionChange([modelId]);
        return;
      }
      
      // For OpenRouter, respect maxSelections
      if (selectedModels.length >= maxSelections) {
        // Replace the oldest selection
        onSelectionChange([...selectedModels.slice(1 - maxSelections), modelId]);
      } else {
        onSelectionChange([...selectedModels, modelId]);
      }
    }
  };

  // Helper to get a clean display name for the model
  const getModelDisplayName = (model: OpenRouterModel | string): string => {
    if (isProviderOllama) {
      return model as string;
    }
    
    const openRouterModel = model as OpenRouterModel;
    return openRouterModel.name || openRouterModel.id.split('/').pop() || '';
  };

  // Get the model ID based on the provider type
  const getModelId = (model: OpenRouterModel | string): string => {
    if (isProviderOllama) {
      return model as string;
    }
    return (model as OpenRouterModel).id;
  };

  return (
    <div className="space-y-4">
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {/* Model list */}
          {availableModels.length > 0 ? (
            availableModels.map((model) => {
              const modelId = getModelId(model);
              const isSelected = selectedModels.includes(modelId);
              
              return (
                <div 
                  key={modelId}
                  className={cn(
                    "flex items-center justify-between p-3 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                    isSelected ? "border-primary bg-primary/5" : "border-muted"
                  )}
                  onClick={() => handleModelSelection(modelId)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center border",
                      isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted"
                    )}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    
                    <div>
                      <div className="font-medium text-sm">{getModelDisplayName(model)}</div>
                      {!isProviderOllama && (model as OpenRouterModel).isFree && (
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Star className="h-3 w-3 mr-1 text-yellow-500 fill-yellow-500" />
                          Free model
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              {isProviderOllama 
                ? "No Ollama models found. Make sure Ollama is running and accessible."
                : "No OpenRouter models available. Please check your API key and try again."}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Display selected models */}
      {selectedModels.length > 0 && (
        <div className="border rounded-md p-3 mt-4">
          <p className="text-sm font-medium mb-2">Selected {maxSelections > 1 ? 'Models' : 'Model'}:</p>
          <div className="space-y-2">
            {selectedModels.map((modelId, index) => {
              const model = availableModels.find(m => getModelId(m) === modelId);
              const displayName = model ? getModelDisplayName(model) : modelId;
              
              return (
                <div key={modelId} className="flex justify-between items-center">
                  <span className="text-sm">
                    {index + 1}. {displayName}
                  </span>
                  <button
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => handleModelSelection(modelId)}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
