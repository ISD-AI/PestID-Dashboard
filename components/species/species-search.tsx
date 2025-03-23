"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { SpeciesResult } from "@/app/dashboard/species/page"
import { searchSpecies, type GBIFSpecies } from "@/lib/gbif/gbif"

const formSchema = z.object({
  searchTerm: z.string().optional(),
  kingdom: z.string().optional(),
  rank: z.string().optional(),
  habitat: z.string().optional(),
  threat: z.string().optional(),
  isExtinct: z.string().optional(),
  observationDateFrom: z.string().optional(),
  observationDateTo: z.string().optional(),
})

interface SpeciesSearchProps {
  onSearch: (results: SpeciesResult[]) => void
}

export function SpeciesSearch({ onSearch }: SpeciesSearchProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      searchTerm: "",
      kingdom: "",
      rank: "",
      habitat: "",
      threat: "",
      isExtinct: "",
      observationDateFrom: "",
      observationDateTo: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const params: Record<string, any> = {
        q: values.searchTerm,
        limit: 50,
      }

      if (values.kingdom) {
        params.highertaxonKey = values.kingdom
      }
      if (values.rank) {
        params.rank = values.rank.toUpperCase()
      }
      if (values.habitat) {
        params.habitat = values.habitat
      }
      if (values.threat) {
        params.threat = values.threat
      }
      if (values.isExtinct) {
        params.isExtinct = values.isExtinct === 'true'
      }

      const response = await searchSpecies(params)
      
      const results: SpeciesResult[] = response.results.map((species: GBIFSpecies) => ({
        id: species.key.toString(),
        scientificName: species.scientificName,
        commonName: species.vernacularName || "",
        kingdom: species.kingdom || "",
        phylum: species.phylum || "",
        class: species.class || "",
        order: species.order || "",
        family: species.family || "",
        genus: species.genus || "",
        species: species.species || "",
        observationCount: 0, // Would need another API call
        lastObserved: species.lastInterpreted || "",
      }))

      onSearch(results)
    } catch (error) {
      console.error('Failed to search species:', error)
      // You might want to show an error message to the user here
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="searchTerm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Search Term</FormLabel>
                <FormControl>
                  <Input placeholder="Scientific or common name" {...field} />
                </FormControl>
                <FormDescription>
                  Search by scientific name or common name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="kingdom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kingdom</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select kingdom" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Animalia</SelectItem>
                    <SelectItem value="6">Plantae</SelectItem>
                    <SelectItem value="5">Fungi</SelectItem>
                    <SelectItem value="2">Bacteria</SelectItem>
                    <SelectItem value="3">Chromista</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rank"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Taxonomic Rank</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rank" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PHYLUM">Phylum</SelectItem>
                    <SelectItem value="CLASS">Class</SelectItem>
                    <SelectItem value="ORDER">Order</SelectItem>
                    <SelectItem value="FAMILY">Family</SelectItem>
                    <SelectItem value="GENUS">Genus</SelectItem>
                    <SelectItem value="SPECIES">Species</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="habitat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Habitat</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select habitat" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="terrestrial">Terrestrial</SelectItem>
                    <SelectItem value="marine">Marine</SelectItem>
                    <SelectItem value="freshwater">Freshwater</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="threat"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Threat Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select threat status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="EXTINCT">Extinct</SelectItem>
                    <SelectItem value="ENDANGERED">Endangered</SelectItem>
                    <SelectItem value="VULNERABLE">Vulnerable</SelectItem>
                    <SelectItem value="NEAR_THREATENED">Near Threatened</SelectItem>
                    <SelectItem value="LEAST_CONCERN">Least Concern</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isExtinct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Extinction Status</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="true">Extinct</SelectItem>
                    <SelectItem value="false">Not Extinct</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit">Search Species</Button>
      </form>
    </Form>
  )
}
