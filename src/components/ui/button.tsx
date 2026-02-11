import { cva } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-latte-blue/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-latte-surface0 bg-latte-surface0 text-latte-text shadow-sm hover:bg-latte-surface1/85 active:bg-latte-surface1",
        outline:
          "border border-latte-surface0 bg-latte-mantle text-latte-text shadow-sm hover:bg-latte-crust",
        ghost:
          "border border-transparent text-latte-subtext0 hover:border-latte-surface0 hover:bg-latte-crust hover:text-latte-text",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-8 px-3 text-xs",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "icon";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
