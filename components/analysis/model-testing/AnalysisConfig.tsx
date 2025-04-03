'use client'

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

interface AnalysisConfigProps {
  mode: 'free' | 'battle';
  onModeChange: (mode: 'free' | 'battle') => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  maxTokens: number;
  onMaxTokensChange: (tokens: number) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
  isOllama?: boolean;
}

export function AnalysisConfig({
  mode,
  onModeChange,
  systemPrompt,
  onSystemPromptChange,
  maxTokens,
  onMaxTokensChange,
  temperature,
  onTemperatureChange,
  isOllama = false
}: AnalysisConfigProps) {
  const [promptText, setPromptText] = useState(systemPrompt);

  const handlePromptUpdate = () => {
    onSystemPromptChange(promptText);
  };

  const defaultPrompt = `You are a specialized AI for identifying insects and other organisms. 
Analyze the provided image carefully to identify the species in the image.
Focus on providing:
1. The most likely species name
2. Taxonomic information (family, genus, etc.) if you can determine it
3. Brief description of key identifying features
4. Your confidence level in this identification

Please respond in a clear, human-readable format. If you're uncertain, explain your reasoning and offer possible alternatives.`;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Analysis Configuration</h3>
          <p className="text-sm text-muted-foreground">Configure how the AI will analyze your image</p>
        </div>

        {/* System Prompt */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <button 
              onClick={() => setPromptText(defaultPrompt)}
              className="text-xs text-primary hover:underline"
            >
              Reset to Default
            </button>
          </div>
          <Textarea
            id="system-prompt"
            placeholder="Enter custom instructions for the AI model..."
            rows={6}
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            onBlur={handlePromptUpdate}
            className="resize-y"
          />
          <p className="text-xs text-muted-foreground">
            Customize how the AI should approach the species identification task
          </p>
        </div>

        {/* Max Tokens Slider */}
        <div className="space-y-4 mb-6">
          <div>
            <div className="flex justify-between mb-2">
              <Label htmlFor="max-tokens">Max Tokens: {maxTokens}</Label>
              <span className="text-xs text-muted-foreground">{maxTokens}/2048</span>
            </div>
            <Slider
              id="max-tokens"
              min={100}
              max={2048}
              step={1}
              value={[maxTokens]}
              onValueChange={(value) => onMaxTokensChange(value[0])}
            />
          </div>
        </div>

        {/* Temperature Slider */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <Label htmlFor="temperature">Temperature: {temperature.toFixed(1)}</Label>
              <span className="text-xs text-muted-foreground">{temperature.toFixed(1)}/1.0</span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={1}
              step={0.1}
              value={[temperature]}
              onValueChange={(value) => onTemperatureChange(value[0])}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
