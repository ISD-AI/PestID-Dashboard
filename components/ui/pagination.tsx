// components/ui/pagination.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface PaginationProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Pagination({ className, ...props }: PaginationProps) {
  return (
    <div className={cn("flex items-center justify-center space-x-2", className)} {...props} />
  );
}