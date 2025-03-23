'use client'

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useImageProcessing } from '@/hooks/use-image-processing';
import { ImageUploader } from './ImageUploader';
import { ImagePreview } from './ImagePreview';
import { ResultDisplay } from './ResultDisplay';
import { ErrorDisplay } from './ErrorDisplay';


interface ModelTestingToolProps {
  className?: string;
}

export function ModelTestingTool({ className }: ModelTestingToolProps) {
  const {
    imageFile,
    selectedImage,
    isLoading,
    result,
    error,
    debug,
    imageDimensions,
    handleImageUpload,
    processImage,
    streamingState, // Add this line
  } = useImageProcessing();
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Model Testing Tool</h2>
          <p className="text-sm text-gray-500">
            Upload an image to analyze and detect objects using our AI model.
          </p>
        </div>

        <ImageUploader
          onUpload={handleImageUpload}
          onSubmit={processImage}
          isLoading={isLoading}
          hasImage={!!imageFile}
        />

        {error && (
          <ErrorDisplay error={error} debug={debug} />
        )}

        {selectedImage && (
          <div className="space-y-4">
            <ImagePreview
              src={selectedImage}
              detections={result?.detections}
              imageDimensions={imageDimensions}
              onLoad={handleImageLoad}
            />
            {result && imageLoaded && (
              <ResultDisplay 
                result={result}
                streamingState={streamingState}
              />
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
