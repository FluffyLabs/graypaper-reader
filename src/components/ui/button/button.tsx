import { Slot } from "@radix-ui/react-slot";
import * as React from "react";

import type { VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
import { buttonVariants } from "./variants";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  forcedColorScheme?: "light" | "dark";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, forcedColorScheme, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={twMerge(buttonVariants({ variant, size, className, forcedColorScheme }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";
