import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Skeleton({ className, ...props }: SkeletonProps) {
    return (
        <div
            className={twMerge("animate-pulse rounded-md bg-gray-200/50 dark:bg-gray-700/50", className)}
            {...props}
        />
    );
}
