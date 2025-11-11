import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: ReactNode;
}

/**
 * Reusable button component with consistent styling.
 * Supports primary and secondary variants with proper disabled states.
 */
export const Button = ({
  variant = "secondary",
  children,
  disabled,
  className = "",
  ...props
}: ButtonProps) => {
  const baseStyles = "px-6 py-2 rounded-[20px] text-center border-2 transition-all";

  const variantStyles = disabled
    ? "border-gray-200 text-gray-400 cursor-not-allowed"
    : variant === "primary"
    ? "border-primary text-primary hover:bg-primary/70 hover:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 hover:border-primary/70 hover:cursor-pointer"
    : "border-secondary text-secondary hover:bg-secondary/70 hover:text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-secondary/50 hover:border-secondary/70 hover:cursor-pointer";

  return (
    <button
      disabled={disabled}
      aria-disabled={disabled}
      className={`${baseStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
