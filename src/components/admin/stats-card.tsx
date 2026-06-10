import { type LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: string;
  className?: string;
  accent?: boolean;
}

export function StatsCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  accent = false,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "border-zinc-800 bg-zinc-900/80 text-zinc-100",
        accent && "border-[#16A34A]/40",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">{title}</CardTitle>
        <div
          className={cn(
            "rounded-lg p-2",
            accent ? "bg-[#16A34A]/20 text-[#16A34A]" : "bg-zinc-800 text-zinc-300"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        {description && (
          <p className="mt-1 text-xs text-zinc-500">{description}</p>
        )}
        {trend && (
          <p className="mt-1 text-xs text-[#16A34A]">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}
