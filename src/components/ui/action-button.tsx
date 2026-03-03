"use client";

import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ActionButtonProps {
  icon: LucideIcon;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "ghost" | "outline" | "default" | "destructive";
  size?: "sm" | "default" | "icon";
  className?: string;
}

export function ActionButton({
  icon: Icon,
  tooltip,
  onClick,
  disabled = false,
  variant = "ghost",
  size = "icon",
  className = "h-8 w-8",
}: ActionButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={onClick}
          disabled={disabled}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
