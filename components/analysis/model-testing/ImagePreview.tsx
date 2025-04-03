import Image from 'next/image';
import {ImageDimensions, Detection } from '@/types/types';

interface ImagePreviewProps {
  src: string;
  detections?: Detection[];
  imageDimensions: ImageDimensions | null;
  onLoad: () => void;
}

export function ImagePreview({ src, detections, imageDimensions, onLoad }: ImagePreviewProps) {
  return (
    <div 
      className="relative w-full rounded-lg overflow-hidden bg-gray-100"
      style={{
        aspectRatio: imageDimensions ? `${imageDimensions.width} / ${imageDimensions.height}` : '16/9'
      }}
    >
      <Image
        src={src}
        alt="Uploaded image"
        fill
        className="object-contain"
        onLoad={onLoad}
        priority
      />
      
      {detections?.map((detection, index) => {
        return (
          <div
            key={index}
            className="inline-block m-1 p-1 bg-green-100 border border-green-500 rounded text-sm"
            style={{
              position: 'absolute',
              bottom: '8px',
              left: `${(index * 120) % 90}%`,
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            <div className="font-medium text-green-800">
              {detection.taxonomy?.species || "Unknown"}
            </div>
          </div>
        );
      })}
    </div>
  );
}
