import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-3 whitespace-nowrap rounded-lg font-bold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl",
        outline: "border-2 border-primary bg-background text-foreground hover:bg-secondary",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        mood: "bg-background border-2 border-border hover:border-primary hover:bg-secondary shadow-md flex-col gap-2 aspect-square",
        health: "bg-background border-2 border-border hover:border-primary hover:bg-secondary shadow-md",
      },
      size: {
        default: "h-16 px-8 py-4 text-senior-base [&_svg]:size-8",
        sm: "h-12 px-6 py-3 text-senior-sm [&_svg]:size-6",
        lg: "h-20 px-10 py-5 text-senior-lg [&_svg]:size-10",
        xl: "h-24 px-12 py-6 text-senior-xl [&_svg]:size-12",
        icon: "h-16 w-16 [&_svg]:size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
