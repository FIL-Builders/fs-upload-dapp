"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const COPY_OPTIONS = [1, 2, 3, 4, 5];

interface CopiesSelectorProps {
  copies: number;
  onCopiesChange: (copies: number) => void;
  disabled?: boolean;
  /** Cap the offered options to the number of providers that can serve them. */
  max?: number;
  /** Muted note explaining the cap (e.g. provider availability). */
  hint?: string;
}

export function CopiesSelector({
  copies,
  onCopiesChange,
  disabled,
  max = COPY_OPTIONS.length,
  hint,
}: CopiesSelectorProps) {
  // One copy per distinct provider — never offer more than are available
  const limit = Math.max(1, Math.min(max, COPY_OPTIONS.length));
  const options = COPY_OPTIONS.filter((n) => n <= limit);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium shrink-0">Copies</Label>
        <div className="flex gap-1">
          {options.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onCopiesChange(n)}
              disabled={disabled}
              className={cn(
                "h-7 w-7 rounded-md text-sm font-medium transition-colors border",
                copies === n
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground",
                disabled && "opacity-50",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
