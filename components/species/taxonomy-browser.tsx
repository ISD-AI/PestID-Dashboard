"use client"

import { ChevronRight, Loader2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { SpeciesResult } from "@/app/dashboard/species/page"
import { GBIF_BACKBONE_KEYS } from "@/lib/gbif/gbif"
import { useTaxonomyState, type TaxonNode } from "@/hooks/use-taxonomy-state"

const initialTaxonomy = [
  {
    key: GBIF_BACKBONE_KEYS.ANIMALIA,
    name: "Animalia",
    rank: "kingdom",
    childCount: 1,
  },
  {
    key: GBIF_BACKBONE_KEYS.PLANTAE,
    name: "Plantae",
    rank: "kingdom",
    childCount: 1,
  },
  {
    key: GBIF_BACKBONE_KEYS.FUNGI,
    name: "Fungi",
    rank: "kingdom",
    childCount: 1,
  },
  {
    key: GBIF_BACKBONE_KEYS.BACTERIA,
    name: "Bacteria",
    rank: "kingdom",
    childCount: 1,
  },
  {
    key: GBIF_BACKBONE_KEYS.CHROMISTA,
    name: "Chromista",
    rank: "kingdom",
    childCount: 1,
  },
]

const taxonomicRanks = [
  { value: "kingdom", label: "Kingdom" },
  { value: "phylum", label: "Phylum" },
  { value: "class", label: "Class" },
  { value: "order", label: "Order" },
  { value: "family", label: "Family" },
  { value: "genus", label: "Genus" },
  { value: "species", label: "Species" },
]

interface TaxonomyBrowserProps {
  onSpeciesSelect: (species: SpeciesResult) => void
}

export function TaxonomyBrowser({ onSpeciesSelect }: TaxonomyBrowserProps) {
  const {
    nodes,
    expandedKeys,
    selectedKey,
    loadingKeys,
    findNode,
    getNodePath,
    toggleExpanded,
    selectNode,
    expandToNode,
  } = useTaxonomyState(initialTaxonomy)

  const handleNodeSelect = (node: TaxonNode) => {
    selectNode(node.key)
    const path = getNodePath(node.key)
    
    const result: SpeciesResult = {
      id: node.key.toString(),
      scientificName: node.name,
      commonName: "",
      kingdom: "",
      phylum: "",
      class: "",
      order: "",
      family: "",
      genus: "",
      species: "",
      rank: node.rank.toUpperCase(),
      observationCount: 0,
      lastObserved: "",
    }

    // Fill in the taxonomic information from the path
    path.forEach(pathNode => {
      switch (pathNode.rank) {
        case "kingdom":
          result.kingdom = pathNode.name
          break
        case "phylum":
          result.phylum = pathNode.name
          break
        case "class":
          result.class = pathNode.name
          break
        case "order":
          result.order = pathNode.name
          break
        case "family":
          result.family = pathNode.name
          break
        case "genus":
          result.genus = pathNode.name
          break
        case "species":
          result.species = pathNode.name
          break
      }
    })

    onSpeciesSelect(result)
  }

  const getTooltipContent = (node: TaxonNode) => {
    const path = getNodePath(node.key)
    return (
      <div className="space-y-2">
        <div className="font-medium">Taxonomic Path:</div>
        <div className="flex flex-col gap-1">
          {path.map((pathNode) => (
            <div key={pathNode.key} className="flex items-center gap-2">
              <span className="capitalize text-muted-foreground">
                {pathNode.rank}:
              </span>
              <span className="italic">{pathNode.name}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getBreadcrumbs = (node: TaxonNode | null) => {
    if (!node) return null
    const path = getNodePath(node.key)
    return (
      <div className="flex flex-wrap items-center gap-1 text-sm">
        {path.map((pathNode, index) => (
          <div key={pathNode.key} className="flex items-center">
            {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            <Badge 
              variant={pathNode.key === node.key ? "default" : "outline"}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleNodeSelect(pathNode)}
            >
              {pathNode.name}
            </Badge>
          </div>
        ))}
      </div>
    )
  }

  const findNodesByRank = (rank: string): TaxonNode[] => {
    const results: TaxonNode[] = []
    const stack = [...nodes]
    
    while (stack.length > 0) {
      const node = stack.pop()!
      if (node.rank === rank) {
        results.push(node)
      }
      if (node.children) {
        stack.push(...node.children)
      }
    }
    
    return results
  }

  const renderNode = (node: TaxonNode) => {
    const isSelected = selectedKey === node.key
    const isExpanded = expandedKeys.has(node.key)
    const isLoading = loadingKeys.has(node.key)

    return (
      <div key={node.key} style={{ marginLeft: `${node.depth * 1.25}rem` }}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className={cn(
                  "flex items-center gap-2 py-1 cursor-pointer rounded px-2 transition-colors relative",
                  isSelected && "bg-primary/10 text-primary font-medium",
                  !isSelected && "hover:bg-muted",
                  node.depth > 0 && "before:absolute before:left-0 before:w-4 before:h-px before:bg-border before:-ml-4 before:top-1/2"
                )}
                onClick={() => handleNodeSelect(node)}
              >
                {node.childCount > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpanded(node.key)
                    }}
                  >
                    {isLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ChevronRight
                        className={cn(
                          "h-3 w-3 transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    )}
                  </Button>
                )}
                <span className="text-sm">
                  {node.name}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({node.rank})
                  </span>
                </span>
                {node.childCount > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {node.childCount}
                  </span>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {getTooltipContent(node)}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {node.children && isExpanded && (
          <div>
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">Taxonomy Tree</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Jump to Rank <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {taxonomicRanks.map((rank) => {
              const nodesAtRank = findNodesByRank(rank.value)
              if (nodesAtRank.length === 0) return null
              return (
                <DropdownMenuItem
                  key={rank.value}
                  onSelect={async () => {
                    // If there's only one node of this rank, select it
                    if (nodesAtRank.length === 1) {
                      await expandToNode(nodesAtRank[0].key)
                      handleNodeSelect(nodesAtRank[0])
                    }
                    // Otherwise, expand all parent nodes to show nodes of this rank
                    for (const node of nodesAtRank) {
                      await expandToNode(node.key)
                    }
                  }}
                >
                  {rank.label} ({nodesAtRank.length})
                </DropdownMenuItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {selectedKey && (
        <div className="rounded-md border bg-muted/50 p-2">
          {getBreadcrumbs(findNode(selectedKey))}
        </div>
      )}
      <ScrollArea className="h-[400px] rounded-md border">
        <div className="p-4">
          {nodes.map((node) => renderNode(node))}
        </div>
      </ScrollArea>
    </div>
  )
}
