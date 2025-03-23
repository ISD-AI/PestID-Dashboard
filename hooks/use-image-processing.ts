import { useState, useEffect } from 'react';
import { ImageDimensions, AnalysisResult, StreamingState } from '@/types/types';

export const useImageProcessing = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<any | null>(null);
  const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    status: 'initial-detection',
    currentDetectionIndex: 0,
    message: 'Initializing analysis...'
  });

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      resetStates();
    }
  };

  const resetStates = () => {
    setResult(null);
    setError(null);
    setDebug(null);
    setStreamingState({
      status: 'initial-detection',
      currentDetectionIndex: 0,
      message: 'Initializing analysis...'
    });
  };

  const processImage = async () => {
    if (!imageFile) return;

    try {
      setIsLoading(true);
      setError(null);
      setDebug(null);

      const maxSize = 640;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = await createImageBitmap(imageFile);
      
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95);
      });

      const formData = new FormData();
      formData.append('image', blob, 'image.jpg');
      formData.append('mode', 'vlm');

      // Update streaming state for initial detection
      setStreamingState({
        status: 'initial-detection',
        currentDetectionIndex: 0,
        message: 'Detecting objects and analyzing taxonomy...'
      });

      const response = await fetch('/api/analysis/model-testing', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.details || data.error || 'Failed to process image');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Stream not available');

      let partialData = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert the chunk to text and append to partial data
        partialData += new TextDecoder().decode(value);

        try {
          // Try to parse the accumulated JSON
          const data = JSON.parse(partialData);
          
          // Update streaming state based on the current phase
          if (data.status === 'refining') {
            setStreamingState({
              status: 'refining',
              currentDetectionIndex: data.currentDetectionIndex,
              message: `Analyzing detection ${data.currentDetectionIndex + 1}: ${data.currentMessage}`
            });
          }

          // If we have a complete result, update it
          if (data.detections) {
            setResult(data);
            setStreamingState({
              status: 'complete',
              currentDetectionIndex: data.detections.length - 1,
              message: 'Analysis complete!'
            });
          }

          if (data.debug) {
            setDebug(data.debug);
          }
        } catch (e) {
          // If we can't parse the JSON yet, continue accumulating data
          continue;
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setStreamingState({
        status: 'complete',
        currentDetectionIndex: 0,
        message: 'Analysis failed'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    imageFile,
    selectedImage,
    isLoading,
    result,
    error,
    debug,
    imageDimensions,
    streamingState,
    handleImageUpload,
    processImage,
  };
};
