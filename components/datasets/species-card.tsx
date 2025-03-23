import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SpeciesDataset } from "@/lib/firebase/querySpecies";

interface SpeciesCardProps {
  species: SpeciesDataset;
}

export function SpeciesCard({ species }: SpeciesCardProps) {
  const getDangerBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "high":
        return "bg-red-500 hover:bg-red-600";
      case "medium":
        return "bg-orange-500 hover:bg-orange-600";
      case "low":
        return "bg-yellow-500 hover:bg-yellow-600";
      default:
        return "bg-green-500 hover:bg-green-600";
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square w-full overflow-hidden">
        <img
          src={species.imageURL}
          alt={species.commonName}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <CardHeader className="p-4">
        <CardTitle className="line-clamp-1 text-lg">{species.commonName}</CardTitle>
        <p className="text-sm italic text-muted-foreground line-clamp-1">
          {species.scientificName}
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        <div className="flex flex-wrap gap-2">
          {species.isPest === "Yes" && (
            <Badge variant="destructive">Pest</Badge>
          )}
          {species.isEndangered === "Yes" && (
            <Badge variant="outline" className="border-red-500 text-red-500">
              Endangered
            </Badge>
          )}
          {species.isVulnerable === "Yes" && (
            <Badge variant="outline" className="border-yellow-500 text-yellow-500">
              Vulnerable
            </Badge>
          )}
          {species.dangerLevel !== "none" && (
            <Badge className={getDangerBadgeColor(species.dangerLevel)}>
              {species.dangerLevel.charAt(0).toUpperCase() + species.dangerLevel.slice(1)} Risk
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-muted-foreground">Order:</p>
            <p className="font-medium">{species.order}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Family:</p>
            <p className="font-medium">{species.family}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between text-sm">
        <div>
          <span className="text-muted-foreground">Images: </span>
          <span className="font-medium">{formatNumber(species.images)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Instances: </span>
          <span className="font-medium">{formatNumber(species.instances)}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
