import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { GBIFMedia } from '@/lib/gbif/types'
import { Skeleton } from "@/components/ui/skeleton"

interface MediaTabProps {
  media: GBIFMedia[]
}

// Custom image component for external URLs
function ExternalImage({ src, alt, className, width, height, style }: { src: string; alt: string; className?: string; width?: number; height?: number; style?: React.CSSProperties }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <span className="text-sm text-muted-foreground">Failed to load image</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className={className}
          width={width}
          height={height}
          style={style}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setHasError(true)
          }}
          loading="lazy"
        />
      )}
    </div>
  )
}

export function MediaTab({ media = [] }: MediaTabProps) {
  const validMedia = media.filter(m => 
    m.identifier && 
    (m.identifier.startsWith('http://') || m.identifier.startsWith('https://'))
  )

  if (validMedia.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No media available for this species. This could mean either:
            <br />
            1. No images have been uploaded to GBIF for this species
            <br />
            2. The available images are not publicly accessible
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {validMedia.map((item, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="p-0">
            <div className="aspect-square relative">
              <ExternalImage
                src={item.identifier}
                alt={item.title || "Species image"}
                width={400}
                height={400}
                className="object-cover"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {item.title && (
              <p className="font-medium truncate">{item.title}</p>
            )}
            {item.creator && (
              <p className="text-sm text-muted-foreground">
                By: {item.creator}
              </p>
            )}
            {item.license && (
              <p className="text-xs text-muted-foreground mt-1">
                License: {item.license}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
