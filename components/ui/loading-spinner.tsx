import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingAnimationProps {
  className?: string;
}

export function LoadingAnimation({ className }: LoadingAnimationProps) {
  return (
    <Loader2 className={cn("h-4 w-4 animate-spin", className)} />
  );
}
