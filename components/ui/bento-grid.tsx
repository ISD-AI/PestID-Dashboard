import * as React from "react";
import { cn } from "@/lib/utils";

interface BentoGridProps extends React.HTMLAttributes<HTMLDivElement> {}

export function BentoGrid({ className, children, ...props }: BentoGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface BentoGridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  title?: string;
  description?: string;
}

export function BentoGridItem({
  className,
  children,
  ...props
}: BentoGridItemProps) {
  return (
    <div
      className={cn(
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
