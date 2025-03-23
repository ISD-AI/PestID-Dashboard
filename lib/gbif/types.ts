export interface GBIFSpecies {
  key: number
  scientificName: string
  canonicalName: string
  authorship?: string
  vernacularNames?: GBIFVernacularName[]
  taxonomicStatus?: string
  rank?: string
  kingdom?: string
  phylum?: string
  class?: string
  order?: string
  family?: string
  genus?: string
  species?: string
  parentKey?: number
  parent?: string
  extinct?: boolean
  threatStatus?: string
  habitatPreferences?: string[]
}

export interface GBIFVernacularName {
  vernacularName: string
  language: string
  preferred?: boolean
  source?: string
}

export interface GBIFOccurrenceLocation {
  key: number
  decimalLatitude: number
  decimalLongitude: number
  locality?: string
  eventDate?: string
  habitat?: string
  country?: string
  countryCode?: string
  stateProvince?: string
  recordedBy?: string
}

export interface GBIFMedia {
  type: string
  format?: string
  identifier: string
  references?: string
  title?: string
  description?: string
  license?: string
  creator?: string
  publisher?: string
  created?: string
}

export interface GBIFDistribution {
  country: string
  locality?: string
  establishmentMeans?: string
  lifeStage?: string
  occurrenceStatus?: string
  threatStatus?: string
  source?: string
}
