// components/verification/QueueHeader.tsx
import { PaginatedDetection } from '@/types/detection';

interface QueueHeaderProps {
  detections: PaginatedDetection[];
}

export function QueueHeader({ detections }: QueueHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-medium">Verification Queue ({detections.length})</h2>
      <span className="text-sm text-muted-foreground">
        ID: {detections[0]?.detectionID}
      </span>
    </div>
  );
}