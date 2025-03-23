const GBIF_API = 'https://api.gbif.org/v1'

export interface GBIFSpecies {
  key: number
  nubKey?: number
  nameKey?: number
  taxonID?: string
  sourceTaxonKey?: number
  kingdom?: string
  phylum?: string
  class?: string
  order?: string
  family?: string
  genus?: string
  species?: string
  kingdomKey?: number
  phylumKey?: number
  classKey?: number
  orderKey?: number
  familyKey?: number
  genusKey?: number
  speciesKey?: number
  scientificName: string
  canonicalName?: string
  vernacularName?: string
  authorship?: string
  nameType?: string
  rank?: string
  origin?: string
  taxonomicStatus?: string
  nomenclaturalStatus?: string
  threatStatus?: string
  numDescendants?: number
  lastCrawled?: string
  lastInterpreted?: string
  issues?: string[]
  synonym?: boolean
  parentKey?: number
  parent?: string
  basionymKey?: number
  basionym?: string
  acceptedKey?: number
  accepted?: string
  accordingTo?: string
  extinct?: boolean
  temporal?: string
  marine?: boolean
  freshwater?: boolean
  terrestrial?: boolean
  habitat?: string
  publishedIn?: string
  references?: string
  remarks?: string
  iucnRedListCategory?: string
}

export interface GBIFResponse<T> {
  offset: number
  limit: number
  endOfRecords: boolean
  count: number
  results: T[]
}

export async function searchSpecies(params: {
  q?: string
  rank?: string
  highertaxonKey?: number
  status?: string
  isExtinct?: boolean
  habitat?: string
  threat?: string
  nameType?: string
  datasetKey?: string
  nomenclaturalStatus?: string
  limit?: number
  offset?: number
  facet?: string[]
  facetMincount?: number
  facetMultiselect?: boolean
  hl?: boolean
  type?: string
}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v.toString()))
      } else {
        searchParams.append(key, value.toString())
      }
    }
  })

  const response = await fetch(
    `${GBIF_API}/species/search?${searchParams.toString()}`
  )
  if (!response.ok) {
    throw new Error('Failed to fetch species')
  }
  return response.json() as Promise<GBIFResponse<GBIFSpecies>>
}

export async function getSpeciesChildren(key: number, params?: {
  limit?: number
  offset?: number
  language?: string
}) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
  }

  const response = await fetch(
    `${GBIF_API}/species/${key}/children?${searchParams.toString()}`
  )
  if (!response.ok) {
    throw new Error('Failed to fetch species children')
  }
  return response.json() as Promise<GBIFResponse<GBIFSpecies>>
}

export async function getSpeciesDetails(key: number) {
  const response = await fetch(`${GBIF_API}/species/${key}`)
  if (!response.ok) {
    const data = await response.json()
    // If this is a synonym, get the accepted species details
    if (data.synonym && data.acceptedKey) {
      return getSpeciesDetails(data.acceptedKey)
    }
    throw new Error(`Failed to fetch species details: ${data.message || response.statusText}`)
  }
  const data = await response.json()
  // If this is a synonym, get the accepted species details
  if (data.synonym && data.acceptedKey) {
    return getSpeciesDetails(data.acceptedKey)
  }
  return data
}

export async function getSpeciesProfiles(key: number) {
  const response = await fetch(`${GBIF_API}/species/${key}/speciesProfiles`)
  if (!response.ok) {
    throw new Error('Failed to fetch species profiles')
  }
  return await response.json()
}

export async function suggestSpecies(params: {
  q: string
  datasetKey?: string
  rank?: string
  limit?: number
}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString())
    }
  })

  const response = await fetch(
    `${GBIF_API}/species/suggest?${searchParams.toString()}`
  )
  if (!response.ok) {
    throw new Error('Failed to fetch species suggestions')
  }
  return response.json() as Promise<GBIFSpecies[]>
}

export async function getSpeciesVernacularNames(key: number) {
  const response = await fetch(`${GBIF_API}/species/${key}/vernacularNames`)
  if (!response.ok) {
    throw new Error('Failed to fetch vernacular names')
  }
  return response.json() as Promise<GBIFResponse<{ vernacularName: string; language: string; preferred: boolean }>>
}

export async function getSpeciesDistributions(key: number) {
  const response = await fetch(`${GBIF_API}/species/${key}/distributions`)
  if (!response.ok) {
    throw new Error('Failed to fetch distributions')
  }
  return response.json() as Promise<GBIFResponse<{ country: string; locality: string; establishmentMeans?: string; status?: string }>>
}

export interface GBIFMedia {
  type: string
  format: string
  identifier: string
  title?: string
  description?: string
  source?: string
  audience?: string
  created?: string
  creator?: string
  publisher?: string
  license?: string
  rightsHolder?: string
}

export interface GBIFMediaResponse {
  type: string
  format: string
  identifier: string
  license?: string
  creator?: string
  title?: string
}

export async function getSpeciesMedia(key: number) {
  const response = await fetch(`${GBIF_API}/species/${key}/media`)
  if (!response.ok) {
    throw new Error('Failed to fetch media')
  }
  return response.json() as Promise<GBIFResponse<GBIFMediaResponse>>
}

export async function getSpeciesOccurrenceMedia(key: number, limit: number = 50) {
  const response = await fetch(
    `${GBIF_API}/occurrence/search?taxonKey=${key}&mediaType=StillImage&limit=${limit}`
  )
  if (!response.ok) {
    throw new Error('Failed to fetch occurrence media')
  }
  const data = await response.json()
  return data.results
    .filter((occurrence: any) => 
      occurrence.media?.[0]?.identifier && 
      (occurrence.media[0].identifier.startsWith('http://') || 
       occurrence.media[0].identifier.startsWith('https://'))
    )
    .map((occurrence: any) => ({
      type: occurrence.media[0].type || 'StillImage',
      format: occurrence.media[0].format || 'image/jpeg',
      identifier: occurrence.media[0].identifier,
      title: occurrence.media[0].title || occurrence.scientificName,
      creator: occurrence.recordedBy,
      license: occurrence.license,
      source: occurrence.references
    }))
}

export async function getAllSpeciesMedia(key: number) {
  try {
    const [speciesMedia, occurrenceMedia] = await Promise.all([
      getSpeciesMedia(key),
      getSpeciesOccurrenceMedia(key)
    ])

    return {
      offset: 0,
      limit: speciesMedia.limit + 50,
      endOfRecords: true,
      count: (speciesMedia.results?.length || 0) + (occurrenceMedia?.length || 0),
      results: [...(speciesMedia.results || []), ...(occurrenceMedia || [])]
    }
  } catch (error) {
    console.error('Error fetching media:', error)
    return {
      offset: 0,
      limit: 0,
      endOfRecords: true,
      count: 0,
      results: []
    }
  }
}

export interface GBIFOccurrenceStats {
  facets: Array<{
    field: string
    counts: Array<{
      name: string
      count: number
    }>
  }>
}

// Map of country codes to names
const COUNTRY_CODES: { [key: string]: string } = {
  'NL': 'Netherlands',
  'ZA': 'South Africa',
  'BE': 'Belgium',
  'DE': 'Germany',
  'US': 'United States',
  'GB': 'United Kingdom',
  'ES': 'Spain',
  'KE': 'Kenya',
  'FR': 'France',
  'DK': 'Denmark',
  // Add more as needed
}

export async function getSpeciesOccurrenceStats(key: number) {
  // First check if this is a synonym
  const details = await getSpeciesDetails(key)
  const taxonKey = details.acceptedKey || key

  // Now get the facets
  const response = await fetch(
    `${GBIF_API}/occurrence/search?taxonKey=${taxonKey}&facet=YEAR&facet=MONTH&facet=COUNTRY&limit=0`
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch occurrence stats: ${response.statusText}`)
  }
  const data = await response.json()
  
  // Transform the response to match our expected format
  const transformedFacets = (data.facets || []).map((facet: any) => ({
    field: facet.field.toLowerCase(),
    counts: facet.counts.map((count: any) => ({
      name: facet.field === 'COUNTRY' ? (COUNTRY_CODES[count.name] || count.name) : count.name,
      count: count.count
    }))
  }))

  return {
    ...data,
    facets: transformedFacets
  }
}

export interface GBIFOccurrenceLocation {
  key: number
  decimalLatitude: number
  decimalLongitude: number
  locality?: string
  eventDate?: string
  habitat?: string
  countryCode?: string
  stateProvince?: string
  county?: string
  municipality?: string
  year?: number
  month?: number
  day?: number
}

export interface GBIFOccurrenceResponse<T> {
  offset: number
  limit: number
  endOfRecords: boolean
  count: number
  results: T[]
}

export interface GBIFOccurrenceSearchParams {
  taxonKey?: number
  q?: string
  basisOfRecord?: string
  country?: string
  publishingCountry?: string
  hasCoordinate?: boolean
  geometry?: string
  year?: string
  month?: string
  eventDate?: string
  institutionCode?: string
  collectionCode?: string
  catalogNumber?: string
  recordNumber?: string
  recordedBy?: string
  identifiedBy?: string
  scientificName?: string
  locality?: string
  decimalLatitude?: number
  decimalLongitude?: number
  elevation?: number
  depth?: number
  establishmentMeans?: string
  protocol?: string
  license?: string
  organismId?: string
  limit?: number
  offset?: number
}

export async function searchOccurrences(params: GBIFOccurrenceSearchParams) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, value.toString())
    }
  })

  const response = await fetch(
    `${GBIF_API}/occurrence/search?${searchParams.toString()}`
  )
  if (!response.ok) {
    throw new Error('Failed to fetch occurrences')
  }
  return response.json() as Promise<GBIFOccurrenceResponse<GBIFOccurrenceLocation>>
}

export async function getSpeciesOccurrenceLocations(key: number, limit: number = 100) {
  // First check if this is a synonym
  const details = await getSpeciesDetails(key)
  const taxonKey = details.acceptedKey || key

  const response = await fetch(
    `${GBIF_API}/occurrence/search?taxonKey=${taxonKey}&limit=${limit}&hasCoordinate=true`
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch occurrence locations: ${response.statusText}`)
  }
  const data = await response.json()
  return data.results as GBIFOccurrenceLocation[]
}

export interface GBIFSpeciesProfile {
  taxonKey: number
  habitat?: string
  threatStatus?: string
  temporal?: string
  size?: string
  mass?: string
  lifeForm?: string
  extinct?: boolean
  marine?: boolean
  terrestrial?: boolean
  freshwater?: boolean
}

export interface GBIFDistribution {
  taxonKey: number
  locationId?: string
  locality?: string
  country?: string
  establishmentMeans?: string
  occurrenceStatus?: string
  temporal?: string
  threatStatus?: string
  source?: string
}

export interface GBIFMedia {
  taxonKey: number
  type: string
  format: string
  identifier: string
  title?: string
  description?: string
  source?: string
  audience?: string
  created?: string
  creator?: string
  publisher?: string
  license?: string
  rightsHolder?: string
}

// Root taxonomic keys for the GBIF backbone taxonomy
export const GBIF_BACKBONE_KEYS = {
  ANIMALIA: 1,
  ARCHAEA: 7,
  BACTERIA: 2,
  CHROMISTA: 3,
  FUNGI: 5,
  PLANTAE: 6,
  PROTOZOA: 4,
  VIRUSES: 8,
  INCERTAE_SEDIS: 9,
}
