"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { MainNav } from "@/components/nav";
import { UserButton } from "@/components/user-button";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

export function ConditionalHeader() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const showMainNav = isSignedIn && isDashboardRoute;

  // Don't show any header for public pages when not signed in
  if (!isSignedIn) {
    return null;
  }

  // Show full navigation for dashboard routes
  if (showMainNav) {
    return (
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <MainNav className="mx-6" />
          <div className="ml-auto flex items-center space-x-4">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </div>
    );
  }

  // Show simplified header for non-dashboard routes when signed in
  return (
    <div className="border-b">
      <div className="flex h-16 items-center px-4 justify-between">
        <Link href="/dashboard" className="font-medium">
          PestID Analytics
        </Link>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <UserButton />
        </div>
      </div>
    </div>
  );
}
