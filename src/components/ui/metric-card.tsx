import { Skeleton } from "@/components/ui/skeleton";

const variantStyles = {
  default: "bg-muted/50",
  success: "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900",
  warning: "bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900",
  danger: "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900",
} as const;

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  isLoading?: boolean;
  variant?: keyof typeof variantStyles;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  subValue,
  isLoading,
  variant = "default",
}: MetricCardProps) {
  return (
    <div className={`p-4 rounded-lg ${variantStyles[variant]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      {isLoading ? (
        <Skeleton className="h-7 w-24" />
      ) : (
        <>
          <p className="text-xl font-semibold">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground mt-0.5">{subValue}</p>}
        </>
      )}
    </div>
  );
}
