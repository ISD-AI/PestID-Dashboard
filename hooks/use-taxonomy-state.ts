import { useState, useCallback } from "react"
import { getSpeciesChildren } from "@/lib/gbif/gbif"

export interface TaxonNode {
  key: number
  name: string
  rank: string
  childCount: number
  children?: TaxonNode[]
  isLoading?: boolean
  isExpanded?: boolean
  parent?: TaxonNode
  depth: number
}

interface TaxonomyState {
  nodes: TaxonNode[]
  expandedKeys: Set<number>
  selectedKey: number | null
  loadingKeys: Set<number>
}

export function useTaxonomyState(initialNodes: Omit<TaxonNode, "depth">[]) {
  const [state, setState] = useState<TaxonomyState>({
    nodes: initialNodes.map(node => ({ ...node, depth: 0 })),
    expandedKeys: new Set<number>(),
    selectedKey: null,
    loadingKeys: new Set<number>(),
  })

  const updateNodeInTree = useCallback((nodes: TaxonNode[], key: number, updates: Partial<TaxonNode>): TaxonNode[] => {
    return nodes.map(node => {
      if (node.key === key) {
        return { ...node, ...updates }
      }
      if (node.children) {
        return {
          ...node,
          children: updateNodeInTree(node.children, key, updates)
        }
      }
      return node
    })
  }, [])

  const findNode = useCallback((key: number): TaxonNode | null => {
    const stack: TaxonNode[] = [...state.nodes]
    while (stack.length > 0) {
      const node = stack.pop()!
      if (node.key === key) return node
      if (node.children) stack.push(...node.children)
    }
    return null
  }, [state.nodes])

  const getNodePath = useCallback((key: number): TaxonNode[] => {
    const node = findNode(key)
    if (!node) return []
    
    const path: TaxonNode[] = [node]
    let current = node
    while (current.parent) {
      path.unshift(current.parent)
      current = current.parent
    }
    return path
  }, [findNode])

  const updateNode = useCallback((key: number, updates: Partial<TaxonNode>) => {
    setState(prev => ({
      ...prev,
      nodes: updateNodeInTree(prev.nodes, key, updates)
    }))
  }, [updateNodeInTree])

  const toggleExpanded = useCallback(async (key: number) => {
    const node = findNode(key)
    if (!node) return

    if (!node.children && !state.loadingKeys.has(key) && node.childCount > 0) {
      // Start loading
      setState(prev => ({
        ...prev,
        loadingKeys: new Set([...prev.loadingKeys, key])
      }))

      try {
        const response = await getSpeciesChildren(key, { limit: 50 })
        const children = response.results.map(child => ({
          key: child.key,
          name: child.canonicalName || child.scientificName,
          rank: child.rank?.toLowerCase() || "unknown",
          childCount: child.numDescendants || 0,
          parent: node,
          depth: node.depth + 1,
        }))

        setState(prev => {
          const newLoadingKeys = new Set(prev.loadingKeys)
          newLoadingKeys.delete(key)
          
          return {
            ...prev,
            nodes: updateNodeInTree(prev.nodes, key, {
              children,
              isExpanded: true
            }),
            expandedKeys: new Set([...prev.expandedKeys, key]),
            loadingKeys: newLoadingKeys,
          }
        })
      } catch (error) {
        console.error('Failed to fetch children:', error)
        setState(prev => {
          const newLoadingKeys = new Set(prev.loadingKeys)
          newLoadingKeys.delete(key)
          return { ...prev, loadingKeys: newLoadingKeys }
        })
      }
    } else if (node.children) {
      setState(prev => {
        const newExpandedKeys = new Set(prev.expandedKeys)
        const isCurrentlyExpanded = prev.expandedKeys.has(key)
        
        if (isCurrentlyExpanded) {
          newExpandedKeys.delete(key)
        } else {
          newExpandedKeys.add(key)
        }
        
        return {
          ...prev,
          expandedKeys: newExpandedKeys,
          nodes: updateNodeInTree(prev.nodes, key, {
            isExpanded: !isCurrentlyExpanded
          }),
        }
      })
    }
  }, [findNode, state.loadingKeys, updateNodeInTree])

  const selectNode = useCallback((key: number) => {
    setState(prev => ({ ...prev, selectedKey: key }))
  }, [])

  const expandToNode = useCallback(async (key: number) => {
    const path = getNodePath(key)
    for (const node of path) {
      if (node.childCount > 0 && !state.expandedKeys.has(node.key)) {
        await toggleExpanded(node.key)
      }
    }
  }, [getNodePath, state.expandedKeys, toggleExpanded])

  return {
    nodes: state.nodes,
    expandedKeys: state.expandedKeys,
    selectedKey: state.selectedKey,
    loadingKeys: state.loadingKeys,
    findNode,
    getNodePath,
    toggleExpanded,
    selectNode,
    expandToNode,
  }
}
