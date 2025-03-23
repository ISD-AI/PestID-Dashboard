"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  // Define nav items with their paths and labels
  const navItems = [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/species", label: "Species Search" },
    { href: "/dashboard/detections", label: "Detections" },
    { href: "/dashboard/analysis", label: "Analysis Tools" },
    { href: "/dashboard/datasets", label: "ISD Species Dataset" },
  ]

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {navItems.map((item) => {
        // Check if the current path matches this nav item
        const isActive = pathname === item.href || 
                        (item.href !== "/dashboard" && pathname?.startsWith(item.href))
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              isActive 
                ? "text-primary font-semibold" 
                : "text-muted-foreground"
            )}
          >
            {item.label}
          </Link>
        )
      })}
  
    </nav>
  )
}
