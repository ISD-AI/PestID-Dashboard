import { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { Overview } from "@/components/dashboard/overview"
import { RecentDetections } from "@/components/dashboard/recent-detection"
import { SpeciesChart } from "@/components/dashboard/species-chart"
import { SpeciesMap } from "@/components/dashboard/species-map"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "GBIF Species Analysis Dashboard",
}

export default function DashboardPage() {
  return (
    <>
      <DashboardShell>
        <DashboardHeader
          heading="Species Analysis Dashboard"
          text="Monitor and analyze GBIF species data across Australia."
        />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Overview />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
          <SpeciesChart className="col-span-4" />
          <SpeciesMap className="col-span-3" />
        </div>
        <div className="mt-4">
          <RecentDetections className="col-span-full" />
        </div>
      </DashboardShell>
    </>
  )
}
