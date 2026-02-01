"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from "react";

export function Breadcrumbs() {
    const pathname = usePathname();
    const paths = pathname.split("/").filter(Boolean);

    if (paths.length === 0 || (paths.length === 1 && paths[0] === "dashboard")) {
        return null;
    }

    return (
        <nav className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4 animate-in fade-in slide-in-from-left-2">
            <Link
                href="/dashboard"
                className="flex items-center hover:text-brand-blue transition-colors"
            >
                <Home size={16} />
            </Link>

            {paths.map((path, index) => {
                const href = `/${paths.slice(0, index + 1).join("/")}`;
                const isLast = index === paths.length - 1;
                const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

                return (
                    <Fragment key={path}>
                        <ChevronRight size={14} className="mx-2 text-gray-300" />
                        {isLast ? (
                            <span className="font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                                {label}
                            </span>
                        ) : (
                            <Link
                                href={href}
                                className="hover:text-brand-blue transition-colors truncate max-w-[100px]"
                            >
                                {label}
                            </Link>
                        )}
                    </Fragment>
                );
            })}
        </nav>
    );
}
