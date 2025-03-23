import { BarChart, PieChart } from "@/components/ui/charts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "@/components/datasets/stats-card";
import { SpeciesDataset } from "@/lib/firebase/querySpecies";

interface DatasetOverviewProps {
  data: SpeciesDataset[];
  stats: {
    totalSpecies: number;
    totalImages: number;
    totalInstances: number;
    pestSpecies: number;
    endangeredSpecies: number;
    vulnerableSpecies: number;
    orderCounts: Record<string, number>;
    familyCounts: Record<string, number>;
    dangerLevelCounts: Record<string, number>;
  };
}

export function DatasetOverview({stats }: DatasetOverviewProps) {
  // Format numbers with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  // Prepare data for order distribution chart
  const orderChartData = Object.entries(stats.orderCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Prepare data for danger level pie chart
  const dangerLevelChartData = Object.entries(stats.dangerLevelCounts)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }))
    .filter(item => item.name !== "None");

  // Add "None" category at the end if it exists
  if (stats.dangerLevelCounts.none) {
    dangerLevelChartData.push({
      name: "None",
      value: stats.dangerLevelCounts.none,
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      {/* Top row - Key stats */}
      <StatsCard
        title="Total Species"
        value={formatNumber(stats.totalSpecies)}
        className="lg:col-span-1"
      />
      <StatsCard
        title="Total Images"
        value={formatNumber(stats.totalImages)}
        className="lg:col-span-1"
      />
      <StatsCard
        title="Total Instances"
        value={formatNumber(stats.totalInstances)}
        className="lg:col-span-1"
      />
      <StatsCard
        title="Pest Species"
        value={formatNumber(stats.pestSpecies)}
        description={`${Math.round((stats.pestSpecies / stats.totalSpecies) * 100)}% of total`}
        className="lg:col-span-1"
      />
      <StatsCard
        title="Endangered Species"
        value={formatNumber(stats.endangeredSpecies)}
        description={`${Math.round((stats.endangeredSpecies / stats.totalSpecies) * 100)}% of total`}
        className="lg:col-span-1"
      />
      <StatsCard
        title="Vulnerable Species"
        value={formatNumber(stats.vulnerableSpecies)}
        description={`${Math.round((stats.vulnerableSpecies / stats.totalSpecies) * 100)}% of total`}
        className="lg:col-span-1"
      />
      <StatsCard
        title="Families"
        value={Object.keys(stats.familyCounts).length}
        className="lg:col-span-1"
      />

      {/* Middle row - Order distribution */}
      <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle>Order Distribution</CardTitle>
          <CardDescription>Top 5 taxonomic orders in the dataset</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart
            data={orderChartData}
            xAxis="name"
            yAxis="value"
            height={300}
          />
        </CardContent>
      </Card>

      {/* Middle row - Danger level distribution */}
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>Risk Level Distribution</CardTitle>
          <CardDescription>Species by danger level</CardDescription>
        </CardHeader>
        <CardContent>
          <PieChart
            data={dangerLevelChartData}
            category="name"
            value="value"
            height={300}
          />
        </CardContent>
      </Card>
    </div>
  );
}
