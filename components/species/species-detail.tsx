"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import type { SpeciesResult } from "@/app/dashboard/species/page"
import { OverviewTab } from "./detail-tabs/overview-tab"
import { GeographicTab } from "./detail-tabs/geographic-tab"
import { OccurrenceTab } from "./detail-tabs/occurrence-tab"
import { MediaTab } from "./detail-tabs/media-tab"
import {
  getSpeciesDetails,
  getSpeciesVernacularNames,
  getSpeciesDistributions,
  getAllSpeciesMedia,
  getSpeciesOccurrenceStats,
  getSpeciesOccurrenceLocations,
} from "@/lib/gbif/gbif"
import type {
  GBIFSpecies,
  GBIFVernacularName,
  GBIFDistribution,
  GBIFMedia,
  GBIFOccurrenceLocation,
} from "@/lib/gbif/types"

interface SpeciesDetailProps {
  species: SpeciesResult
}

interface YearData {
  year: number
  count: number
}

interface MonthData {
  month: string
  count: number
}

interface CountryData {
  country: string
  count: number
  trend: number
}

interface GBIFFacetCount {
  name: string
  count: number
}

interface GBIFFacet {
  field: string
  counts: GBIFFacetCount[]
}

export function SpeciesDetail({ species }: SpeciesDetailProps) {
  const [details, setDetails] = useState<GBIFSpecies | null>(null)
  const [vernacularNames, setVernacularNames] = useState<GBIFVernacularName[]>([])
  const [distributions, setDistributions] = useState<GBIFDistribution[]>([])
  const [media, setMedia] = useState<GBIFMedia[]>([])
  const [occurrenceLocations, setOccurrenceLocations] = useState<GBIFOccurrenceLocation[]>([])
  const [yearlyStats, setYearlyStats] = useState<YearData[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthData[]>([])
  const [countryStats, setCountryStats] = useState<CountryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const speciesKey = parseInt(species.id)
        
        const [
          detailsData,
          vernacularData,
          distributionsData,
          mediaData,
          occurrenceStatsData,
          locationsData
        ] = await Promise.all([
          getSpeciesDetails(speciesKey),
          getSpeciesVernacularNames(speciesKey),
          getSpeciesDistributions(speciesKey),
          getAllSpeciesMedia(speciesKey),
          getSpeciesOccurrenceStats(speciesKey),
          getSpeciesOccurrenceLocations(speciesKey, 300)
        ])

        setDetails(detailsData)
        setVernacularNames(vernacularData.results || [])
        setDistributions(distributionsData.results || [])
        setMedia(mediaData.results || [])
        setOccurrenceLocations(locationsData || [])

        // Process occurrence stats
        const facets = occurrenceStatsData.facets ?? []
        
        // Process yearly stats
        const yearFacet = facets.find((f: GBIFFacet) => f.field === 'year')
        const yearCounts = yearFacet?.counts
        if (yearCounts && yearCounts.length > 0) {
          const yearlyData = yearCounts
            .map((c: GBIFFacetCount) => ({ year: parseInt(c.name), count: c.count }))
            .filter((data: YearData) => !isNaN(data.year))
            .sort((a: YearData, b: YearData) => a.year - b.year)
          if (yearlyData.length > 0) {
            setYearlyStats(yearlyData)
          }
        }

        // Process monthly stats
        const monthFacet = facets.find((f: GBIFFacet) => f.field === 'month')
        const monthCounts = monthFacet?.counts
        if (monthCounts && monthCounts.length > 0) {
          const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ]
          const monthlyData = monthCounts
            .map((c: GBIFFacetCount) => ({
              month: months[parseInt(c.name) - 1],
              count: c.count
            }))
            .filter((data: MonthData) => data.month)
          if (monthlyData.length > 0) {
            setMonthlyStats(monthlyData)
          }
        }

        // Process country stats
        const countryFacet = facets.find((f: GBIFFacet) => f.field === 'country')
        const countryCounts = countryFacet?.counts
        if (countryCounts && countryCounts.length > 0) {
          const countryData = countryCounts
            .filter((c: GBIFFacetCount) => c.name)
            .map((c: GBIFFacetCount) => ({
              country: c.name,
              count: c.count,
              trend: 0
            }))
            .sort((a: CountryData, b: CountryData) => b.count - a.count)
            .slice(0, 10)
          if (countryData.length > 0) {
            setCountryStats(countryData)
          }
        }
      } catch (error) {
        console.error('Error fetching species data:', error)
        // You might want to show an error message to the user here
      } finally {
        setLoading(false)
      }
    }

    if (species?.id) {
      fetchData()
    }
  }, [species])

  if (loading) {
    return <Skeleton className="w-full h-[600px]" />
  }

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="occurrences">Occurrences</TabsTrigger>
        <TabsTrigger value="geographic">Geographic Distribution</TabsTrigger>
        <TabsTrigger value="media">Media</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <OverviewTab
          details={details}
          vernacularNames={vernacularNames}
        />
      </TabsContent>

      <TabsContent value="occurrences" className="space-y-4">
        <OccurrenceTab
          occurrenceStats={yearlyStats}
          monthlyStats={monthlyStats}
          countryStats={countryStats}
        />
      </TabsContent>

      <TabsContent value="geographic" className="space-y-4">
        <GeographicTab
          distributions={distributions}
          locations={occurrenceLocations}
        />
      </TabsContent>

      <TabsContent value="media">
        <MediaTab media={media} />
      </TabsContent>
    </Tabs>
  )
}
