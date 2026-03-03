"use client";

import { useClipboard } from "@/hooks";
import { Check, Copy } from "lucide-react";
import { truncate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CopyButtonProps {
  value: string;
  displayValue?: string;
  showTooltip?: boolean;
  size?: "sm" | "default";
}

export function CopyButton({
  value,
  displayValue,
  showTooltip = true,
  size = "default",
}: CopyButtonProps) {
  const { copied, copy } = useClipboard();

  const handleCopy = () => copy(value);

  const display = displayValue ?? truncate(value);
  const buttonSize = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className="flex items-center gap-1">
      {showTooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button onClick={handleCopy} className="font-mono text-sm hover:underline cursor-pointer">
              {display}
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-mono text-xs break-all">{value}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <button onClick={handleCopy} className="font-mono text-sm hover:underline cursor-pointer">
          {display}
        </button>
      )}
      <Button variant="ghost" size="icon" className={buttonSize} onClick={handleCopy}>
        {copied ? <Check className={`${iconSize} text-green-500`} /> : <Copy className={iconSize} />}
      </Button>
    </div>
  );
}
