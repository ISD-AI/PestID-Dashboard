import { Card } from '@/components/ui/card';
import { AnalysisResult, StreamingState } from '@/types/types';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

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
            <h3 className="text-lg font-semibold">Analysis Results</h3>
            {result.model && (
              <Badge variant="outline">
                Model: {result.model}
              </Badge>
            )}
          </div>

          <ScrollArea className="h-[400px] pr-4">
            {result.responseText ? (
              <div className="p-4 bg-muted/20 rounded-md prose prose-sm max-w-none markdown-content">
                {/* Try to detect if the response is a valid markdown/text or an error object */}
                {typeof result.responseText === 'string' && 
                 !result.responseText.startsWith('{') && 
                 !result.responseText.startsWith('[') ? (
                  <ReactMarkdown>
                    {result.responseText}
                  </ReactMarkdown>
                ) : (
                  <div className="bg-red-50 p-4 rounded-md border border-red-200">
                    <h3 className="text-red-800 text-sm font-medium mb-2">Error Response</h3>
                    <div className="overflow-auto max-h-[300px] text-xs">
                      <pre className="whitespace-pre-wrap break-all">
                        {typeof result.responseText === 'string' 
                          ? result.responseText 
                          : JSON.stringify(result.responseText, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-muted/20 rounded-md text-center text-muted-foreground">
                No analysis results available
              </div>
            )}
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}
