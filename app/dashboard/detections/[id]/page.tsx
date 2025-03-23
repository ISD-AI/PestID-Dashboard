'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetectionMap } from '@/components/detections/detection-map';
import { MapPin, Calendar, User, Brain, Maximize2 } from 'lucide-react';
import { MapDetection } from '@/types/detection'; // Use MapDetection type
import * as React from 'react';
import { ImageModal } from '@/components/ui/image-modal';
import { format } from 'date-fns';
import { ExternalImage } from '@/components/ui/external-image';
import { DashboardShell } from '@/components/dashboard/shell';
import { DashboardHeader } from '@/components/dashboard/header';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DetectionDetailPage({ params }: PageProps) {
  const { id } = React.use(params) as { id: string };
  const [detection, setDetection] = useState<MapDetection | null>(null); // Use MapDetection type
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  useEffect(() => {
    const fetchDetection = async () => {
      try {
        const response = await fetch(`/api/fbdetection/${id}`);
        if (!response.ok) throw new Error('Detection not found');
        const data = await response.json();
        if (data.success) {
          const { detection, metadata } = data.data;
          const uiDetection: MapDetection = {
            detectionID: detection.detectionID,
            confScore: detection.confScore || 0,
            curVeriStatus: detection.curVeriStatus || 'pending',
            inputImageURL: detection.inputImageURL || '',
            predImageURL: detection.predImageURL || '',
            pestType: detection.pestType || '',
            timestamp: detection.timestamp,
            userId: detection.userId || '',
            imageLat: metadata?.imageLat || 0,
            imageLong: metadata?.imageLong || 0,
            userLat: metadata?.userLat || 0,
            userLong: metadata?.userLong || 0,
            userName: detection.userName,
            dateTime: detection.dateTime || new Date(detection.timestamp).toLocaleString(),
            imageLocation: metadata ? [metadata.imageCity, metadata.imageRegion, metadata.imageCountry]
              .filter(Boolean)
              .join(', ') || 'Unknown' : 'Unknown',
            userLocation: metadata ? [metadata.userCity, metadata.userRegion, metadata.userCountry]
              .filter(Boolean)
              .join(', ') || 'Unknown' : 'Unknown',
            scientificName: metadata?.scientificName || 'Unknown',
            funFacts: detection?.funFacts || '',
            aiModel: detection.aiModel,
            isUserLocation: !metadata?.imageLat || metadata?.imageLat === 0,
          };
          setDetection(uiDetection);

        } else {
          throw new Error(data.error);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch detection');
      } finally {
        setLoading(false);
      }
    };

    fetchDetection();
  }, [id]);

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (error || !detection) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600">{error || 'Detection not found'}</p>
        </div>
      </DashboardShell>
    );
  }

  // Safe date formatting with validation
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, 'PPpp');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formattedDate = formatDate(detection.timestamp);

  return (
    <>
      <DashboardShell>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <DashboardHeader
              heading={`Detection ${detection.detectionID}`}
              text={`Verification Status: ${detection.curVeriStatus}`}
            />
            {/* <div className="flex space-x-4">
              <CheckCircle className="mr-2 h-4 w-4" />
              Verify
            </div> */}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detection Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <User className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Reported By</p>
                        <p className="text-gray-600">{detection.userName}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">User Location</p>
                        <p className="text-gray-600">{detection.userLocation}</p>
                        {/* <p className="text-sm text-gray-400">
                          {detection.imageLat.toFixed(6)}, {detection.imageLong.toFixed(6)}
                        </p> */}
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Brain className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Detection Model</p>
                        <p className="text-gray-600">{detection.aiModel}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Brain className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Scientific Name</p>
                        <p className="text-gray-600">{detection.scientificName}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Date</p>
                        <p className="text-gray-600">{formattedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <p className="font-medium">Image Location</p>
                        <p className="text-gray-600">{detection.imageLocation}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 col-span-2">
                      <div>
                        <p className="font-medium">Pixtral Output</p>
                        <p className="text-gray-600">{detection.funFacts}</p>
                      </div>
                    </div>

                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="h-[400px]">
                  {!isImageModalOpen && (
                    <DetectionMap 
                      detections={[detection]} 
                      showFilterToggle={false}
                      initialFilterVisibility={false}
                      mapHeight="350px"
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detection Image</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-video group cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
                    <ExternalImage
                      src={detection.predImageURL ? detection.predImageURL : detection.inputImageURL}
                      alt='No Image'
                      className="rounded-lg transition-transform group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                      <Maximize2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      </DashboardShell>

      {isImageModalOpen && (
        <ImageModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          imageUrl={detection.predImageURL ? detection.predImageURL : detection.inputImageURL}
          altText="No Image"
        />
      )}
    </>
  );
}