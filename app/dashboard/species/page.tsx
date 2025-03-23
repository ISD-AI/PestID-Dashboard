"use client"

import { useState } from "react"
import { DashboardShell } from "@/components/dashboard/shell"
import { DashboardHeader } from "@/components/dashboard/header"
import { TaxonomyBrowser } from "@/components/species/taxonomy-browser"
import { SpeciesSearch } from "@/components/species/species-search"
import { SpeciesTable } from "@/components/species/species-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"

export interface SpeciesResult {
  id: string
  scientificName: string
  commonName: string
  kingdom: string
  phylum: string
  class: string
  order: string
  family: string
  genus: string
  species: string
  rank?: string
  observationCount: number
  lastObserved: string
}

export default function SpeciesPage() {
  const [results, setResults] = useState<SpeciesResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (newResults: SpeciesResult[]) => {
    setIsLoading(true)
    try {
      setResults(newResults)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSpeciesSelect = (species: SpeciesResult) => {
    setIsLoading(true)
    try {
      setResults([species])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardShell>
      <DashboardHeader
        heading="Species Search"
        text="Browse and search species using taxonomy tree or advanced filters."
      />
      <Tabs defaultValue="taxonomy" className="space-y-4">
        <TabsList>
          <TabsTrigger value="taxonomy">Taxonomy Browser</TabsTrigger>
          <TabsTrigger value="search">Advanced Search</TabsTrigger>
        </TabsList>
        <TabsContent value="taxonomy" className="space-y-4">
          <Card className="p-6">
            <TaxonomyBrowser onSpeciesSelect={handleSpeciesSelect} />
          </Card>
        </TabsContent>
        <TabsContent value="search" className="space-y-4">
          <Card className="p-6">
            <SpeciesSearch onSearch={handleSearch} />
          </Card>
        </TabsContent>
        {results.length > 0 && (
          <Card className="p-6">
            <SpeciesTable data={results} isLoading={isLoading} />
          </Card>
        )}
      </Tabs>
    </DashboardShell>
  )
}
