import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "accent"
    | "ghost"
    | "link"
    | "custom"
    | "custom-green"
    | "custom-white";
  size?: "default" | "sm" | "lg" | "icon";
}

export function getButtonClassName({
  variant = "default",
  size = "default",
  className,
}: {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "accent"
    | "ghost"
    | "link"
    | "custom"
    | "custom-green"
    | "custom-white";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
} = {}) {
  if (variant === "custom" || variant === "custom-green" || variant === "custom-white") {
    return cn(
      "btn-custom",
      {
        "btn-custom-gold": variant === "custom",
        "btn-custom-green": variant === "custom-green",
        "btn-custom-white": variant === "custom-white",
      },
      "focus-ring",
      className
    );
  }

  return cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-colors cursor-pointer",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50",
    {
      "bg-primary text-primary-foreground shadow-sm hover:bg-primary-dark active:bg-primary-dark":
        variant === "default",
      "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90":
        variant === "secondary",
      "bg-accent text-accent-foreground shadow-sm hover:bg-accent/90": variant === "accent",
      "border-2 border-primary bg-transparent hover:bg-primary hover:text-white text-primary":
        variant === "outline",
      "hover:bg-muted text-foreground": variant === "ghost",
      "text-primary underline-offset-4 hover:underline p-0 h-auto": variant === "link",
    },
    {
      "min-h-[44px] px-6 py-2.5": size === "default",
      "min-h-[38px] px-4 py-1.5 text-xs": size === "sm",
      "min-h-[50px] px-8 py-3 text-base": size === "lg",
      "min-h-[44px] min-w-[44px] p-0 rounded-full": size === "icon",
    },
    className
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    return (
      <button
        type={type}
        className={getButtonClassName({ variant, size, className })}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
