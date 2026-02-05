import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-lg bg-base-200/40 px-3 py-2 text-sm placeholder:text-base-content/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 ring-offset-base-100",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
