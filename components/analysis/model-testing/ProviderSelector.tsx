'use client'

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnalysisProvider } from '@/types/types';
import { Server, Network } from 'lucide-react';

interface ProviderSelectorProps {
  provider: AnalysisProvider;
  onProviderChange: (provider: AnalysisProvider) => void;
}

export function ProviderSelector({ 
  provider, 
  onProviderChange 
}: ProviderSelectorProps) {
  const [activeTab, setActiveTab] = useState<string>(provider.type);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update provider when tab changes
    if (value === 'openrouter') {
      onProviderChange({
        type: 'openrouter',
        apiKey: provider.apiKey || ''
      });
    } else if (value === 'ollama') {
      onProviderChange({
        type: 'ollama',
        baseUrl: provider.baseUrl || 'http://localhost:11434'
      });
    }
  };

  return (
    <Card className="shadow-sm border-muted">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Model Provider</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue={activeTab} 
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="openrouter" className="flex items-center">
              <Network className="h-4 w-4 mr-2" />
              OpenRouter
            </TabsTrigger>
            <TabsTrigger value="ollama" className="flex items-center">
              <Server className="h-4 w-4 mr-2" />
              Ollama
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="openrouter">
            <div className="text-sm text-muted-foreground">
              <p>Use OpenRouter to access a variety of AI models through their API.</p>
              <p className="mt-2">Requires an API key from OpenRouter.</p>
            </div>
          </TabsContent>
          
          <TabsContent value="ollama">
            <div className="text-sm text-muted-foreground">
              <p>Connect to Ollama to use local AI models running on your machine or network.</p>
              <p className="mt-2">Requires Ollama to be installed and running.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
