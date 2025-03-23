"use client"

import { UserButton as ClerkUserButton } from "@clerk/nextjs"

interface UserButtonProps {
  className?: string
}

export function UserButton({ className }: UserButtonProps) {
  return (
    <div className={className}>
      <ClerkUserButton 
        afterSignOutUrl="/"
        appearance={{
          elements: {
            userButtonAvatarBox: "h-8 w-8"
          }
        }}
      />
    </div>
  )
}
