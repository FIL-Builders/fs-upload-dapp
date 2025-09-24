"use client";

import { useState } from "react";

/**
 * Unified Tooltip component with consistent theme colors and mobile-friendly design
 */
export const Tooltip = ({
  children,
  content,
  position = "top",
}: {
  children: React.ReactNode;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleToggle = () => setIsVisible(!isVisible);
  const handleClose = () => setIsVisible(false);

  const getPositionClasses = (position: string) => {
    switch (position) {
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 translate-y-2";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 -translate-x-2";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 translate-x-2";
      default: // top
        return "bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2";
    }
  };

  const getArrowClasses = (position: string) => {
    switch (position) {
      case "bottom":
        return "bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent";
      case "left":
        return "left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent";
      case "right":
        return "right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent";
      default: // top
        return "top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent";
    }
  };

  const getArrowColor = (position: string) => {
    switch (position) {
      case "bottom":
        return { borderBottomColor: "var(--background)" };
      case "left":
        return { borderLeftColor: "var(--background)" };
      case "right":
        return { borderRightColor: "var(--background)" };
      default: // top
        return { borderTopColor: "var(--background)" };
    }
  };

  return (
    <div className="relative inline-block">
      <div
        onClick={handleToggle}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help touch-manipulation"
        role="button"
        tabIndex={0}
        aria-label="Show more information"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
          if (e.key === "Escape") {
            handleClose();
          }
        }}
      >
        {children}
      </div>
      {isVisible && (
        <>
          {/* Mobile backdrop for touch to close */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={handleClose}
            aria-hidden="true"
          />
          <div
            className={`absolute z-50 px-3 py-2 text-sm rounded-lg shadow-lg transition-all duration-200 w-64 max-w-xs border ${getPositionClasses(
              position
            )}`}
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--border)",
              color: "var(--foreground)",
            }}
          >
            <div>{content}</div>
            {/* Mobile close button */}
            <button
              className="absolute top-1 right-1 w-5 h-5 md:hidden flex items-center justify-center text-xs leading-none"
              style={{ color: "var(--muted-foreground)" }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLElement;
                target.style.color = "var(--foreground)";
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLElement;
                target.style.color = "var(--muted-foreground)";
              }}
              onClick={handleClose}
              aria-label="Close tooltip"
            >
              ×
            </button>
            {/* Arrow */}
            <div
              className={`absolute w-0 h-0 ${getArrowClasses(position)}`}
              style={getArrowColor(position)}
            />
          </div>
        </>
      )}
    </div>
  );
};