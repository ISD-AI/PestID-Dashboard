// columns.tsx
'use client';

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from 'next/link';
import { PaginatedDetection } from '@/types/detection';

export type Detection = PaginatedDetection; // Use PaginatedDetection instead of MapDetection

export const columns: ColumnDef<Detection>[] = [
  {
    accessorKey: "detectionID",
    header: "ID",
    cell: ({ row }) => (
      <Link 
        href={`/dashboard/detections/${row.original.detectionID}`}
        className="text-blue-600 hover:text-blue-800"
      >
        {row.original.detectionID}
      </Link>
    ),
  },
  {
    accessorKey: "scientificName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Species
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "userName",
    header: "Reported By",
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "imageLocation",
    header: "Image Location",
  },
  {
    accessorKey: "userLocation",
    header: "User Location",
  },
  {
    accessorKey: "aiModel",
    header: "Model",
  },
  {
    accessorKey: "curVeriStatus",
    header: "Verification Status",
    cell: ({ row }) => {
      const status = row.original.curVeriStatus;
      const getButtonProps = (status: string) => {
        switch (status) {
          case 'verified':
            return {
              variant: 'secondary' as const,
              className: 'bg-green-500 text-white hover:bg-green-600 rounded-full px-4 py-2',
              icon: <CheckCircle2 className="mr-2 h-4 w-4" />,
            };
          case 'rejected':
            return {
              variant: 'secondary' as const,
              className: 'bg-red-500 text-white hover:bg-red-600 rounded-full px-4 py-2',
              icon: <XCircle className="mr-2 h-4 w-4" />,
            };
          case 'pending':
          default:
            return {
              variant: 'secondary' as const,
              className: 'bg-yellow-300 text-black hover:bg-gray-400 rounded-full px-4 py-2',
              icon: <Clock className="mr-2 h-4 w-4" />,
            };
        }
      };
      const buttonProps = getButtonProps(status);
      return (
        <Button {...buttonProps} disabled>
          {buttonProps.icon}
          {(status || '').charAt(0).toUpperCase() + (status || '').slice(1)}
        </Button>
      );
    },
  },
];