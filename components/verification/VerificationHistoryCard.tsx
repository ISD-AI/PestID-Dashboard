// components/verification/VerificationHistoryCard.tsx
import { Card, CardContent } from '@/components/ui/card';
import { VerificationHistory } from '@/types/verification';
import { History } from 'lucide-react';

interface VerificationHistoryCardProps {
  verificationHistory: VerificationHistory[];
  formatDate: (dateString: string) => string;
}

export function VerificationHistoryCard({
  verificationHistory,
  formatDate,
}: VerificationHistoryCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <History className="h-5 w-5 mr-2" /> Verification History
        </h3>
        {verificationHistory.length > 0 ? (
          <div className="space-y-4 max-h-[200px] overflow-y-auto">
            {verificationHistory.map((entry) => (
              <div key={entry.id} className="flex items-start space-x-3 p-2 rounded-lg border">
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {entry.previousStatus} → {entry.newStatus}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Changed by {entry.changedBy} on {formatDate(entry.changedAt)}
                  </p>
                  <p className="text-xs text-gray-600">Reason: {entry.reason}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No previous history for this detection.</p>
        )}
      </CardContent>
    </Card>
  );
}