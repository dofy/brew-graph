import {
  Package,
  Box,
  Heart,
  ExternalLink,
  Terminal,
  AlertTriangle,
  FileText,
  Tag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/common/CopyButton";
import { useFavoriteStore } from "@/stores/useFavoriteStore";
import type { PackageType } from "@/types";
import { cn } from "@/lib/utils";

export function PackageHeader({
  name,
  type,
  subtitle,
  homepage,
  deprecated,
  disabled,
  favorite,
}: {
  name: string;
  type: PackageType;
  subtitle?: string | null;
  homepage: string;
  deprecated: boolean;
  disabled: boolean;
  favorite: boolean;
}) {
  const { toggleFavorite } = useFavoriteStore();
  const Icon = type === "formula" ? Package : Box;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <Icon className="h-8 w-8 text-primary shrink-0 mt-1" />
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{name}</h1>
            {deprecated && (
              <Badge
                variant="outline"
                className="text-yellow-600 border-yellow-600"
              >
                Deprecated
              </Badge>
            )}
            {disabled && <Badge variant="destructive">Disabled</Badge>}
          </div>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => toggleFavorite(name, type)}
          title="Favorite (F)"
        >
          <Heart
            className={cn(
              "h-4 w-4",
              favorite ? "fill-red-500 text-red-500" : ""
            )}
          />
        </Button>
        <Button variant="outline" asChild title="Open homepage (O)">
          <a href={homepage} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Homepage
          </a>
        </Button>
      </div>
    </div>
  );
}

export function InstallCommandCard({ command }: { command: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5" />
          Install Command
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
          <code className="flex-1 break-all">{command}</code>
          <CopyButton text={command} />
        </div>
      </CardContent>
    </Card>
  );
}

export function DescriptionCard({ desc }: { desc: string | null | undefined }) {
  if (!desc) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Description
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="leading-relaxed">{desc}</p>
      </CardContent>
    </Card>
  );
}

export function CaveatsCard({
  caveats,
}: {
  caveats: string | null | undefined;
}) {
  if (!caveats) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          Caveats
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto">
          {caveats}
        </pre>
      </CardContent>
    </Card>
  );
}

export function TagsCard({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Tags
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
