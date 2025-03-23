// components/verification/SpeciesInfoCard.tsx
import { PaginatedDetection } from '@/types/detection';
import { Card, CardContent } from '@/components/ui/card';
import { User, Calendar, MapPin, Brain } from 'lucide-react';

interface SpeciesInfoCardProps {
  detection: PaginatedDetection;
  formatDate: (dateString: string) => string;
}

export function SpeciesInfoCard({ detection, formatDate }: SpeciesInfoCardProps) {
  return (
    <Card>
      <CardContent className="pt-6 pb-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold">Species: {detection?.scientificName}</h3>
            <p className="text-muted-foreground">AI Detection Result</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start space-x-2">
              <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Reported By</p>
                <p className="text-sm">{detection?.userName}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p className="text-sm">{formatDate(detection?.timestamp || '')}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Image Location</p>
                <p className="text-sm">{detection?.imageLocation}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">User Location</p>
                <p className="text-sm">{detection?.userLocation}</p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <Brain className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">AI Model</p>
                <p className="text-sm">{detection?.aiModel}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 col-span-2">
              <div>
                <p className="font-medium">Pixtral Output</p>
                <p className="text-gray-600">{detection?.funFacts}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}