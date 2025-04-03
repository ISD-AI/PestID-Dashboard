'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { LoadingAnimation } from '@/components/ui/loading-spinner';

interface OllamaConfigProps {
  baseUrl: string;
  onBaseUrlChange: (baseUrl: string) => void;
  ollamaModels: string[];
  isLoading: boolean;
  error: any;
}

export function OllamaConfig({
  baseUrl,
  onBaseUrlChange,
  ollamaModels,
  isLoading,
  error
}: OllamaConfigProps) {
  const [inputUrl, setInputUrl] = useState(baseUrl);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Initialize the input URL without triggering API calls
  useEffect(() => {
    if (isInitialLoad) {
      setInputUrl(baseUrl);
      setIsInitialLoad(false);
    }
  }, [baseUrl, isInitialLoad]);

  // Update connection status based on error state
  useEffect(() => {
    if (error) {
      setConnectionStatus('error');
      setStatusMessage(typeof error === 'string' 
        ? error 
        : error && typeof error === 'object' && 'message' in error 
          ? error.message 
          : 'Connection error');
    }
  }, [error]);

  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputUrl(e.target.value);
    // Just update the UI, don't trigger API calls while typing
  };

  // Only test connection and update URL when explicitly requested
  const handleTestConnection = () => {
    if (!inputUrl) {
      setConnectionStatus('error');
      setStatusMessage('Please enter a valid Ollama server URL');
      return;
    }

    setConnectionStatus('testing');
    setStatusMessage('Testing connection...');
    
    // Now update the parent component with the new URL
    onBaseUrlChange(inputUrl);
    
    // The parent component will handle connection testing
    // We'll get feedback through the isLoading and error props
  };

  // Handle models loaded successfully
  useEffect(() => {
    if (ollamaModels.length > 0 && !isLoading && !error) {
      setConnectionStatus('success');
      setStatusMessage(`Connected! Found ${ollamaModels.length} models.`);
    }
  }, [ollamaModels, isLoading, error]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Ollama Configuration</CardTitle>
        <CardDescription>
          Connect to your local or remote Ollama server
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="http://localhost:11434"
              value={inputUrl}
              onChange={handleUrlChange}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleTestConnection}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? <LoadingAnimation className="mr-2 h-4 w-4" /> : null}
              Test Connection
            </Button>
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground">
            {connectionStatus === 'idle' && (
              <p>
                Enter your Ollama server URL and click Test Connection.
                <br />
                For a local Ollama server, use: http://localhost:11434
                <br />
                For a remote Ollama server, use: http://IP_ADDRESS:11434
              </p>
            )}
          </div>
        </div>

        {/* Connection status and models */}
        {connectionStatus === 'testing' && (
          <Alert variant="default">
            <LoadingAnimation className="mr-2 h-4 w-4" />
            <AlertDescription>
              {statusMessage}
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === 'success' && (
          <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
            <AlertDescription className="text-green-700">
              {statusMessage}
            </AlertDescription>
          </Alert>
        )}

        {connectionStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>
              {statusMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Display available models if connection is successful */}
        {ollamaModels.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Available Models:</h4>
            <div className="grid grid-cols-2 gap-2">
              {ollamaModels.map((model) => (
                <div
                  key={model}
                  className="text-xs bg-muted rounded-md px-2 py-1"
                >
                  {model}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
