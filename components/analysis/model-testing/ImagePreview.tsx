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
        const bbox = detection.box_2d.box_2d || (detection.box_2d as unknown as { x1: number; y1: number; x2: number; y2: number });
        return (
          <div
            key={index}
            className="absolute border-2 border-green-500 bg-green-500/10"
            style={{
              left: `${bbox.x1 * 100}%`,
              top: `${bbox.y1 * 100}%`,
              width: `${(bbox.x2 - bbox.x1) * 100}%`,
              height: `${(bbox.y2 - bbox.y1) * 100}%`
            }}
          >
            <div className="absolute top-0 left-0 -translate-y-full">
              <span className="inline-block px-1.5 py-0.5 text-xs bg-green-500 text-white rounded-sm whitespace-nowrap">
                {detection.taxonomy.species}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
