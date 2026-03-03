"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const COPY_OPTIONS = [1, 2, 3, 4, 5];

interface CopiesSelectorProps {
  copies: number;
  onCopiesChange: (copies: number) => void;
  disabled?: boolean;
}

export function CopiesSelector({ copies, onCopiesChange, disabled }: CopiesSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Label className="text-sm font-medium shrink-0">Copies</Label>
        <div className="flex gap-1">
          {COPY_OPTIONS.map((n) => (
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
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
