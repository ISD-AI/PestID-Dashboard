import { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import { ModelTestingTool } from "@/components/analysis/model-testing/model-testing-tool"

export const metadata: Metadata = {
  title: "Analysis Tools - Dashboard",
  description: "AI Model Testing and Analysis Tools",
}

export default function AnalysisPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Analysis Tools"
        text="Test and analyze species using various AI models."
      />
      <div className="grid gap-6">
        <ModelTestingTool />
      </div>
    </DashboardShell>
  )
}
