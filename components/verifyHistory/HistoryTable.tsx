// components/verification/VerificationHistoryTable.tsx
// Update to use "Load More" pattern instead of pagination

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from '@/components/detections/data-table';
import { VerificationHistoryDetail } from '@/types/verification';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, AlertTriangle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface VerificationHistoryTableProps {
  historyRecords: VerificationHistoryDetail[];
  onSelectRecord: (record: VerificationHistoryDetail) => void;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

export function VerificationHistoryTable({
  historyRecords,
  onSelectRecord,
  loading,
  hasMore,
  onLoadMore,
}: VerificationHistoryTableProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPp');
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-500/80 text-white border-none flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/80 text-white border-none flex items-center gap-1">
            <XCircle className="w-3 h-3" /> Rejected
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/80 text-black border-none flex items-center gap-1">
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-500/80 text-white border-none flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {status}
          </Badge>
        );
    }
  };

  const columns: ColumnDef<VerificationHistoryDetail>[] = [
    {
      accessorKey: "predID",
      header: "Document ID",
      cell: ({ row }) => (
        <Link 
          href={`/dashboard/detections/${row.original.predID}`}
          className="font-mono text-xs text-primary hover:text-primary/80 hover:underline"
        >
          {row.original.predID.substring(0, 8)}...
        </Link>
      ),
    },
    {
      accessorKey: "currentStatus",
      header: "Current Status",
      cell: ({ row }) => getStatusBadge(row.original.currentStatus),
    },
    {
      accessorKey: "previousStatus",
      header: "Previous Status",
      cell: ({ row }) => getStatusBadge(row.original.previousStatus),
    },
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => (
        <span className="capitalize">{row.original.category || "N/A"}</span>
      ),
    },
    {
      accessorKey: "suggestedName",
      header: "Suggested Name",
      cell: ({ row }) => (
        <span className="italic truncate max-w-[150px] block">{row.original.suggestedName || "None"}</span>
      ),
    },
    {
      accessorKey: "needsExpertReview",
      header: "Expert Review",
      cell: ({ row }) => (
        <Badge variant={row.original.needsExpertReview ? "destructive" : "secondary"} className="border-none">
          {row.original.needsExpertReview ? "Required" : "Not Needed"}
        </Badge>
      ),
    },
    {
      accessorKey: "changedBy",
      header: "Verified By",
      cell: ({ row }) => row.original.changedBy,
    },
    {
      accessorKey: "changedAt",
      header: "Date/Time",
      cell: ({ row }) => formatDate(row.original.changedAt),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1 hover:bg-primary/10"
          onClick={() => onSelectRecord(row.original)}
        >
          <Eye className="h-3.5 w-3.5" />
          <span>View</span>
        </Button>
      ),
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Verification History</CardTitle>
        <CardDescription>
          View and manage past verification activities
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-md border-0">
          <DataTable 
            columns={columns} 
            data={historyRecords}
          />
          {hasMore && (
            <div className="flex justify-center p-4 border-t">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <svg
                    className="animate-spin h-5 w-5 text-primary"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <Button onClick={onLoadMore} variant="secondary">
                  Load More History
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}