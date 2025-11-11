import { SelectHTMLAttributes, ReactNode } from "react";

interface SelectOption {
  value: string;
  label: string | ReactNode;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  helperText?: string;
  onChange: (value: string) => void;
  value: string;
}

/**
 * Reusable select dropdown with consistent styling.
 * Supports label, placeholder, helper text, and disabled states.
 */
export const Select = ({
  options,
  placeholder = "Select an option",
  label,
  helperText,
  onChange,
  value,
  disabled,
  className = "",
  ...props
}: SelectProps) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-3 py-2 rounded-lg border transition-colors ${className}`}
        style={{
          backgroundColor: "var(--background)",
          borderColor: "var(--border)",
          color: "var(--foreground)",
        }}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && (
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {helperText}
        </p>
      )}
    </div>
  );
};
