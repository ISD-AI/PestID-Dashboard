import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorDisplayProps {
  error: string;
  debug?: any;
}

export function ErrorDisplay({ error, debug }: ErrorDisplayProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
      {debug && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm">Show Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-800 text-white rounded text-xs overflow-auto">
            {JSON.stringify(debug, null, 2)}
          </pre>
        </details>
      )}
    </Alert>
  );
}
