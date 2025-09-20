import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // Button Primary - Actions principales
        primary: "bg-teal-600 text-white hover:bg-teal-700 transition-fast",
        // Button Secondary - Actions secondaires
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 transition-fast",
        // Button Outline - Actions moins importantes (Annuler)
        outline: "border border-slate-300 bg-transparent text-slate-900 hover:bg-teal-50 hover:border-teal-600 hover:text-teal-700 transition-fast",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const ButtonOnboarding = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
ButtonOnboarding.displayName = "ButtonOnboarding";

export { ButtonOnboarding, buttonVariants };