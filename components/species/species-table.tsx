"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, Eye, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { SpeciesResult } from "@/app/dashboard/species/page"
import { SpeciesDetail } from "@/components/species/species-detail"

const rankOptions = [
  { value: "ALL", label: "All Ranks" },
  { value: "KINGDOM", label: "Kingdom" },
  { value: "PHYLUM", label: "Phylum" },
  { value: "CLASS", label: "Class" },
  { value: "ORDER", label: "Order" },
  { value: "FAMILY", label: "Family" },
  { value: "GENUS", label: "Genus" },
  { value: "SPECIES", label: "Species" },
]

export const columns: ColumnDef<SpeciesResult>[] = [
  {
    accessorKey: "scientificName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Scientific Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => (
      <div>
        <div className="font-medium italic">{row.getValue("scientificName")}</div>
        {row.original.commonName && (
          <div className="text-sm text-muted-foreground">
            {row.original.commonName}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "kingdom",
    header: "Kingdom",
    cell: ({ row }) => {
      const value = row.getValue("kingdom") as string
      return value ? (
        <Badge variant="outline" className="capitalize">
          {value.toLowerCase()}
        </Badge>
      ) : null
    },
    filterFn: "equals",
  },
  {
    accessorKey: "rank",
    header: "Rank",
    cell: ({ row }) => {
      const value = row.getValue("rank") as string
      return value ? (
        <Badge variant="secondary" className="capitalize">
          {value.toLowerCase()}
        </Badge>
      ) : null
    },
    filterFn: "equals",
  },
  {
    accessorKey: "family",
    header: "Family",
    cell: ({ row }) => {
      const value = row.getValue("family") as string
      return value ? (
        <Badge variant="outline" className="capitalize">
          {value.toLowerCase()}
        </Badge>
      ) : null
    },
  },
  {
    accessorKey: "genus",
    header: "Genus",
    cell: ({ row }) => {
      const value = row.getValue("genus") as string
      return value ? <span className="italic">{value}</span> : null
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const species = row.original

      return (
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] sm:max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Species Details</DialogTitle>
            </DialogHeader>
            <SpeciesDetail species={species} />
          </DialogContent>
        </Dialog>
      )
    },
  },
]

interface SpeciesTableProps {
  data: SpeciesResult[]
  isLoading?: boolean
}

export function SpeciesTable({ data, isLoading = false }: SpeciesTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <Input
            placeholder="Filter scientific names..."
            value={(table.getColumn("scientificName")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("scientificName")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <Select
            value={(table.getColumn("rank")?.getFilterValue() as string) ?? "ALL"}
            onValueChange={(value) => 
              table.getColumn("rank")?.setFilterValue(value === "ALL" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Rank" />
            </SelectTrigger>
            <SelectContent>
              {rankOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading species data...
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
