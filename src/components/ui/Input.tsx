import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            className={twMerge(
              "block w-full rounded-xl border border-border bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-foreground outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary focus:bg-card focus:ring-4 focus:ring-blue-500/10 dark:focus:ring-blue-500/20",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
              icon && "pr-10",
              className
            )}
            {...props}
          />
          {icon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
