// components/verification/SuggestionModal.tsx
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import ReactCrop, { Crop, PercentCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface SuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputImageURL?: string;
  predImageURL?: string;
  onSelectSuggestion: (species: string) => void;
}

interface Suggestion {
  label: string;
  confidence: number;
}

export function SuggestionModal({
  isOpen,
  onClose,
  inputImageURL,
  predImageURL,
  onSelectSuggestion,
}: SuggestionModalProps) {
  const [selectedImage, setSelectedImage] = useState<'input' | 'pred'>(
    predImageURL ? 'pred' : 'input'
  );
  const [crop, setCrop] = useState<Crop>({ unit: '%' as const, width: 50, height: 50, x: 25, y: 25 });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [croppedImageUrl, setCroppedImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isCropped, setIsCropped] = useState(false); // New state to track cropping completion
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageURL = selectedImage === 'input' ? inputImageURL : predImageURL;

  // Handle image loading and errors
  useEffect(() => {
    if (!imageURL) {
      setImageError('No image available to crop.');
      return;
    }

    setImageError(null);
    setImageLoaded(false);
    setCroppedImageUrl(null); // Reset cropped image when image changes
    setIsCropped(false); // Reset cropping state

    const img = new Image();
    img.src = imageURL;
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      setImageError('Failed to load image.');
    };
  }, [imageURL, selectedImage]);

  const getCroppedImageBlob = async (): Promise<Blob | null> => {
    if (!imgRef.current || !crop.width || !crop.height) return null;

    const naturalWidth = imgRef.current.naturalWidth;
    const naturalHeight = imgRef.current.naturalHeight;

    // Convert percentage-based crop to pixel values
    const cropX = ((crop.x ?? 0) / 100) * naturalWidth;
    const cropY = ((crop.y ?? 0) / 100) * naturalHeight;
    const cropWidth = ((crop.width ?? 0) / 100) * naturalWidth;
    const cropHeight = ((crop.height ?? 0) / 100) * naturalHeight;

    // Validate crop dimensions
    if (cropX < 0 || cropY < 0 || cropWidth <= 0 || cropHeight <= 0 || 
        cropX + cropWidth > naturalWidth || cropY + cropHeight > naturalHeight) {
      console.warn('Invalid crop dimensions:', { cropX, cropY, cropWidth, cropHeight, naturalWidth, naturalHeight });
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(
      imgRef.current,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.95);
    });
  };

  // Handle cropping completion
  const handleCropComplete = async () => {
    if (!imgRef.current || !crop.width || !crop.height) {
      setImageError('Crop area is invalid.');
      return;
    }

    const blob = await getCroppedImageBlob();
    if (blob) {
      const croppedUrl = URL.createObjectURL(blob);
      setCroppedImageUrl(croppedUrl);
      setIsCropped(true); // Mark cropping as complete
    } else {
      setImageError('Failed to generate cropped image.');
    }
  };

  const handleGetSuggestions = async () => {
    if (!croppedImageUrl) {
      setImageError('Please crop the image first.');
      return;
    }
  
    setIsLoading(true);
    setSuggestions([]);
    setImageError(null);
  
    try {
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      const base64Data = await base64Promise;
      const base64String = base64Data.split(',')[1];
  
      const apiResponse = await fetch('/api/get-bioclip-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBlobBase64: base64String }),
      });
  
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(`API request failed: ${errorData.error || apiResponse.statusText}`);
      }
  
      const { data } = await apiResponse.json();
      const parsedSuggestions = data[0].confidences.map(
        (item: { label: string; confidence: number }) => ({
          label: item.label,
          confidence: item.confidence * 100,
        })
      );
      setSuggestions(parsedSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setImageError('Failed to get suggestions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to parse the label into taxonomic hierarchy, species name, and common name
  const parseLabel = (label: string) => {
    // Extract the common name (in parentheses)
    const commonNameMatch = label.match(/\(([^)]+)\)$/);
    const commonName = commonNameMatch ? `(${commonNameMatch[1]})` : '';

    // Remove the common name to get the taxonomic part
    const taxonomicPart = label.replace(/\s*\([^)]+\)$/, '');

    // Split the taxonomic part into words
    const words = taxonomicPart.split(' ');

    // The last two words are the species name
    const speciesName = words.slice(-2).join(' ');

    // The remaining words are the taxonomic hierarchy
    const taxonomicHierarchy = words.slice(0, -2);

    // Join the taxonomic hierarchy with arrows
    const taxonomicLabel = taxonomicHierarchy.join(' -> ');

    return {
      taxonomicLabel: taxonomicLabel ? `${taxonomicLabel} -> ${speciesName}` : speciesName,
      commonName,
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Get AI Suggestions</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Image Selection */}
          {(inputImageURL || predImageURL) && (
            <div>
              <Label className="block mb-2">Select Image to Use</Label>
              <div className="flex space-x-4">
                {inputImageURL && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="input-image"
                      name="image-selection"
                      value="input"
                      checked={selectedImage === 'input'}
                      onChange={() => setSelectedImage('input')}
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="input-image">Input Image</Label>
                  </div>
                )}
                {predImageURL && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="pred-image"
                      name="image-selection"
                      value="pred"
                      checked={selectedImage === 'pred'}
                      onChange={() => setSelectedImage('pred')}
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="pred-image">Prediction Image</Label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cropper */}
          {imageURL && !imageError ? (
            <div>
              <Label className="block mb-2">Crop the Image (Focus on the Pest)</Label>
              {imageLoaded ? (
                <ReactCrop
                  crop={crop}
                  onChange={(pixelCrop: PixelCrop, percentCrop: PercentCrop) =>
                    setCrop(percentCrop)
                  }
                  onComplete={handleCropComplete} // Trigger cropping on complete
                  className="max-h-[400px] w-full object-contain"
                >
                  <img
                    src={imageURL}
                    alt="Image to crop"
                    ref={imgRef}
                    style={{ maxHeight: '400px', width: '100%', objectFit: 'contain' }}
                  />
                </ReactCrop>
              ) : (
                <p className="text-gray-500">Loading image...</p>
              )}
            </div>
          ) : (
            <p className="text-red-500">{imageError || 'No image available to crop.'}</p>
          )}

          {/* Display Cropped Image */}
          {isCropped && croppedImageUrl && (
            <div className="space-y-4">
              <Label className="block mb-2">Cropped Image</Label>
              <img
                src={croppedImageUrl}
                alt="Cropped image"
                className="max-h-[150px] w-auto object-contain mx-auto border rounded"
              />
              <Button
                onClick={handleGetSuggestions}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Fetching Suggestions...' : 'Get Suggestions'}
              </Button>
            </div>
          )}

          {imageError && <p className="text-red-500 text-sm">{imageError}</p>}

          {/* Display Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Top 5 AI Suggestions:</h3>
              <ul className="space-y-2">
                {suggestions.map((suggestion, index) => {
                  const { taxonomicLabel, commonName } = parseLabel(suggestion.label);
                  return (
                    <li key={index} className="p-2 rounded border border-orange-500">
                      <div className="flex justify-between items-center mb-1">
                        <div>
                          <p className="text-sm font-medium">{taxonomicLabel}</p>
                          <p className="text-xs text-gray-600">{commonName}</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onSelectSuggestion(`${taxonomicLabel.split(' ').slice(-2).join(' ')} ${commonName}`);
                            onClose();
                          }}
                        >
                          Select
                        </Button>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-orange-500 h-2 rounded-full"
                          style={{ width: `${Math.round(suggestion.confidence)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Confidence: {Math.round(suggestion.confidence)}%
                      </p>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}