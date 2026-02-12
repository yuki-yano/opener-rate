import { cva } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "../../lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-ui-primary/30 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-ui-border1 bg-ui-border1 text-ui-text shadow-sm hover:bg-ui-border2/85 active:bg-ui-border2",
        outline:
          "border border-ui-border1 bg-ui-layer1 text-ui-text shadow-sm hover:bg-ui-layer2/45",
        ghost:
          "border border-transparent text-ui-text3 hover:border-ui-border1 hover:bg-ui-layer2 hover:text-ui-text",
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
