import { Card } from '@/components/ui/card';
import { AnalysisResult, StreamingState } from '@/types/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface ResultDisplayProps {
  result: AnalysisResult;
  streamingState: StreamingState;
}

export function ResultDisplay({ result, streamingState }: ResultDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Streaming Status */}
      <Card className="p-4 bg-blue-50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-blue-800">Analysis Progress</h3>
          <Badge variant={streamingState.status === 'complete' ? 'default' : 'secondary'}>
            {streamingState.status === 'initial-detection' ? 'Detecting Objects' :
             streamingState.status === 'refining' ? 'Refining Analysis' :
             'Complete'}
          </Badge>
        </div>
        <p className="text-sm text-blue-700">{streamingState.message}</p>
      </Card>

      {/* Results */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Detection Results</h3>
            <Badge variant="outline">
              {result.detections.length} Detections
            </Badge>
          </div>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {result.detections.map((detection, index) => (
                <Card key={index} className={cn(
                  "p-4 border-l-4",
                  index === streamingState.currentDetectionIndex && streamingState.status === 'refining'
                    ? "border-l-blue-500 bg-blue-50"
                    : "border-l-gray-200"
                )}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Detection {index + 1}</h4>
                      <Badge variant="outline">
                        {Math.round(detection.taxonomy.confidence * 100)}% Confidence
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-500">Family:</div>
                      <div className="font-medium">{detection.taxonomy.family}</div>
                      
                      <div className="text-gray-500">Genus:</div>
                      <div className="font-medium">{detection.taxonomy.genus}</div>
                      
                      <div className="text-gray-500">Species:</div>
                      <div className="font-medium">{detection.taxonomy.species}</div>
                    </div>

                    {detection.possible_species.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm text-gray-500 mb-1">Candidate Species:</div>
                        <div className="flex flex-wrap gap-1">
                          {detection.possible_species.map((species, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {species}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {detection.taxonomy.reasoning && (
                      <div className="mt-2">
                        <div className="text-sm text-gray-500 mb-1">Reasoning:</div>
                        <div className="text-sm bg-gray-50 p-2 rounded">
                          {detection.taxonomy.reasoning}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}
