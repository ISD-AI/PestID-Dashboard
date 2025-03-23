// components/verification/NextInQueueCard.tsx
import { PaginatedDetection } from '@/types/detection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalImage } from '@/components/ui/external-image';
import { Button } from '@/components/ui/button';

interface NextInQueueCardProps {
  detections: PaginatedDetection[];
  formatDate: (dateString: string) => string;
}

export function NextInQueueCard({ detections, formatDate }: NextInQueueCardProps) {
  const nextDetections = detections.slice(1, 6);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Next in Queue</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
          {nextDetections.map((detection) => (
            <div
              key={detection.detectionID}
              className="flex items-center space-x-4 p-3 rounded-lg border-l-4 border-l-yellow-500 border hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <div className="flex-shrink-0 w-16 h-16 bg-muted/30 rounded-md overflow-hidden">
                {detection.predImageURL ? (
                  <ExternalImage
                    src={detection.predImageURL}
                    alt="No Image"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-xs text-muted-foreground">No image</p>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{detection.scientificName}</p>
                <p className="text-xs text-muted-foreground truncate">ID: {detection.detectionID}</p>
                <p className="text-xs text-muted-foreground">{formatDate(detection.timestamp)}</p>
              </div>
            </div>
          ))}
          {detections.length > 6 && (
            <div className="text-center pt-2">
              <Button variant="outline" size="sm" className="text-xs">
                View all {detections.length - 1} items in queue
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}