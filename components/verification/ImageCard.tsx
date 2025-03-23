// components/verification/ImageCard.tsx
import { useState } from 'react';
import { PaginatedDetection } from '@/types/detection';
import { Card } from '@/components/ui/card';
import { ExternalImage } from '@/components/ui/external-image';
import { AlertTriangle, Maximize2, ZoomIn, ZoomOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageCardProps {
  detection: PaginatedDetection;
  onOpenImage?: (imageUrl: string) => void;
}

export function ImageCard({ detection, onOpenImage }: ImageCardProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const imageUrl = detection.predImageURL || detection.inputImageURL;

  const handleImageClick = () => {
    if (onOpenImage && imageUrl) {
      onOpenImage(imageUrl);
    } else {
      setIsImageModalOpen(true);
      setZoomLevel(1); // Reset zoom when opening
    }
  };

  const zoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const zoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  return (
    <>
      <Card className="overflow-hidden border-l-4 border-l-yellow-500">
        <div className="bg-yellow-50 px-4 py-2 flex items-center">
          <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
          <span className="text-sm font-medium text-yellow-800">Pending Verification</span>
        </div>
        <div className="p-0">
          <div 
            className="relative aspect-video bg-gray-100 group cursor-pointer" 
            onClick={handleImageClick}
          >
            {imageUrl ? (
              <ExternalImage
                src={imageUrl}
                alt="No image"
                className="w-full h-full object-contain transition-transform group-hover:scale-[1.02]"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No image available</p>
              </div>
            )}
            {imageUrl && (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        </div>
      </Card>

      {isImageModalOpen && imageUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center overflow-hidden">
          {/* Fullscreen backdrop that closes modal when clicked */}
          <div 
            className="absolute inset-0 w-full h-full" 
            onClick={() => setIsImageModalOpen(false)}
            aria-hidden="true"
          />

          {/* Controls overlay at the top */}
          <div className="absolute top-4 right-4 flex gap-2 z-20">
            <Button
              onClick={zoomIn}
              size="sm"
              variant="secondary"
              className="bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 p-0"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <Button
              onClick={zoomOut}
              size="sm"
              variant="secondary"
              className="bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 p-0"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                setIsImageModalOpen(false);
              }}
              size="sm"
              variant="secondary"
              className="bg-black/50 hover:bg-black/70 text-white rounded-full h-10 w-10 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          
          {/* Image container */}
          <div className="relative z-10 w-full h-full flex items-center justify-center overflow-auto px-4 py-16">
            <img 
              src={imageUrl} 
              alt="Detection image" 
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{ 
                transform: `scale(${zoomLevel})`,
                cursor: 'grab'
              }}
              onClick={(e) => e.stopPropagation()} // Prevent clicks on image from closing modal
            />
          </div>
        </div>
      )}
    </>
  );
}