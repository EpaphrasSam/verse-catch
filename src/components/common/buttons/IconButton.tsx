import { ButtonHTMLAttributes, ElementType } from "react";
import { cn } from "@/lib/utils";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ElementType;
  variant?: "primary" | "danger";
}

export const IconButton = ({
  children,
  icon: Icon,
  variant = "primary",
  className,
  disabled,
  ...props
}: IconButtonProps) => {
  return (
    <button
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full",
        "font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-offset-2",
        variant === "primary" &&
          "bg-black text-white hover:bg-gray-800 focus:ring-gray-500",
        variant === "danger" &&
          "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled}
      {...props}
    >
      <Icon className="w-5 h-5" />
      {children}
    </button>
  );
};
