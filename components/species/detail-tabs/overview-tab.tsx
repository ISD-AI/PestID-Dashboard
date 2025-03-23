import React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { GBIFSpecies, GBIFVernacularName } from '@/lib/gbif/types'

interface OverviewTabProps {
  details: GBIFSpecies | null
  vernacularNames: GBIFVernacularName[]
}

export function OverviewTab({ details, vernacularNames }: OverviewTabProps) {
  if (!details) return null

  // Create taxonomy tree data
  const taxonomyTree = [
    { level: 'Kingdom', value: details.kingdom },
    { level: 'Phylum', value: details.phylum },
    { level: 'Class', value: details.class },
    { level: 'Order', value: details.order },
    { level: 'Family', value: details.family },
    { level: 'Genus', value: details.genus },
    { level: 'Species', value: details.species }
  ].filter(item => item.value)

  return (
    <div className="space-y-6">
      {/* Scientific Information */}
      <Card>
        <CardHeader>
          <CardTitle>Scientific Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Scientific Name</h3>
              <p className="text-xl italic">{details.scientificName}</p>
              {details.authorship && (
                <p className="text-sm text-muted-foreground">{details.authorship}</p>
              )}
            </div>

            {details.taxonomicStatus && (
              <div>
                <h3 className="text-lg font-semibold mb-2">Taxonomic Status</h3>
                <Badge variant="secondary" className="capitalize">
                  {details.taxonomicStatus.toLowerCase()}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Taxonomy Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Taxonomic Classification</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {taxonomyTree.map((item, index) => (
              <div 
                key={item.level} 
                className="flex items-center"
                style={{ paddingLeft: `${index * 1.5}rem` }}
              >
                <div className="flex-1 flex justify-between items-center">
                  <span className="text-muted-foreground">{item.level}:</span>
                  <span className="italic">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Vernacular Names */}
      {vernacularNames.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Common Names</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vernacularNames.map((name, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="font-medium">{name.vernacularName}</div>
                    <div className="text-sm text-muted-foreground">
                      Language: {name.language}
                      {name.source && <div>Source: {name.source}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
