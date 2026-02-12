import { cva } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-ui-blue/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-ui-surface0 bg-ui-surface0 text-ui-text shadow-sm hover:bg-ui-surface1/85 active:bg-ui-surface1",
        outline:
          "border border-ui-surface0 bg-ui-mantle text-ui-text shadow-sm hover:bg-ui-crust/45",
        ghost:
          "border border-transparent text-ui-subtext0 hover:border-ui-surface0 hover:bg-ui-crust hover:text-ui-text",
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
