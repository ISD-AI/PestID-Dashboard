import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalImage } from '@/components/ui/external-image';
import { MapPin, Calendar, User, Brain } from 'lucide-react';
import Link from 'next/link';
import { PaginatedDetection } from '@/types/detection';

interface DetectionImgGridProps {
  items: PaginatedDetection[];
  getBadgeClass: (status: string) => string;
  formatDate: (dateString: string) => string;
}

export const DetectionImgGrid = ({
  items,
  getBadgeClass,
  formatDate,
}: DetectionImgGridProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
    {items.map((detection) => (
      <Link
        key={detection.detectionID}
        href={`/dashboard/detections/${detection.detectionID}`}
        className="group"
      >
        <Card className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="aspect-square relative bg-muted">
            
            {/* Image View */}
            {detection.inputImageURL ? (
              <ExternalImage
                src={detection.inputImageURL}
                alt={detection.detectionID}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground">No image</span>
              </div>
            )}

            {/* Verification Status Badge */}
            <div className="absolute top-2 right-2">
              <Badge
                variant="secondary"
                className={`text-white backdrop-blur-sm ${getBadgeClass(
                  detection.curVeriStatus
                )}`}
              >
                {detection.curVeriStatus}
              </Badge>
            </div>


          </div>
          <CardContent className="p-4">
            <h3 className="font-medium truncate group-hover:text-primary">
              {detection.scientificName}
            </h3>
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin
                  className={`h-3.5 w-3.5 mr-1 ${
                    detection.imageLocation && detection.imageLocation !== 'Unknown'
                      ? 'text-green-500'
                      : 'text-blue-500'
                  }`}
                />
                <span className="truncate">
                  {detection.imageLocation && detection.imageLocation !== 'Unknown'
                    ? detection.imageLocation
                    : detection.userLocation}
                </span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                <span className="truncate">{formatDate(detection.timestamp)}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5 mr-1" />
                <span className="truncate">{detection.userName}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Brain className="h-3.5 w-3.5 mr-1" />
                <span className="truncate">{detection.aiModel}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    ))}
  </div>
);