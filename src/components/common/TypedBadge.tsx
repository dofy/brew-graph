import { Package, Box, Hash, GitBranch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BadgeType = "formula" | "cask" | "version" | "tag";

interface TypedBadgeProps {
  type: BadgeType;
  children: React.ReactNode;
  className?: string;
  showIcon?: boolean;
  title?: string;
}

const badgeConfig: Record<
  BadgeType,
  {
    icon: React.ElementType;
    bgClass: string;
    textClass: string;
    borderClass: string;
  }
> = {
  formula: {
    icon: Package,
    bgClass: "bg-blue-500/10 dark:bg-blue-500/20",
    textClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-500/30",
  },
  cask: {
    icon: Box,
    bgClass: "bg-emerald-500/10 dark:bg-emerald-500/20",
    textClass: "text-emerald-600 dark:text-emerald-400",
    borderClass: "border-emerald-500/30",
  },
  version: {
    icon: GitBranch,
    bgClass: "bg-amber-500/10 dark:bg-amber-500/20",
    textClass: "text-amber-600 dark:text-amber-400",
    borderClass: "border-amber-500/30",
  },
  tag: {
    icon: Hash,
    bgClass: "bg-violet-500/10 dark:bg-violet-500/20",
    textClass: "text-violet-600 dark:text-violet-400",
    borderClass: "border-violet-500/30",
  },
};

export function TypedBadge({
  type,
  children,
  className,
  showIcon = true,
  title,
}: TypedBadgeProps) {
  const config = badgeConfig[type];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-normal",
        config.bgClass,
        config.textClass,
        config.borderClass,
        className
      )}
      title={title}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {children}
    </Badge>
  );
}
