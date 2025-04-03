import { Metadata } from "next"
import { DashboardHeader } from "@/components/dashboard/header"
import { DashboardShell } from "@/components/dashboard/shell"
import OpenRouterTestingTool from "@/components/analysis/model-testing/openrouter-testing-tool"

export const metadata: Metadata = {
  title: "Analysis Tools - Dashboard",
  description: "AI Model Testing and Analysis Tools",
}

export default function AnalysisPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Analysis Tools"
        text="Test and compare species identification across multiple AI models."
      />
      <div className="grid gap-6">
        <OpenRouterTestingTool />
      </div>
    </DashboardShell>
  )
}
