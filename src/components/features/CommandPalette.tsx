"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Combobox, Transition } from "@headlessui/react";
import { Search, Command, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import {
    History,
    Settings,
    User,
    BookOpen,
    LayoutDashboard,
    CreditCard,
    LogOut
} from "lucide-react";

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const router = useRouter();

    // Toggle with Ctrl+K or Cmd+K
    useEffect(() => {
        const onKeydown = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen((open) => !open);
            }
        };
        window.addEventListener("keydown", onKeydown);
        return () => window.removeEventListener("keydown", onKeydown);
    }, []);

    const commands = [
        { id: "home", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { id: "courses", label: "Courses", href: "/courses", icon: BookOpen },
        { id: "profile", label: "Profile", href: "/profile", icon: User },
        { id: "settings", label: "Settings", href: "/settings", icon: Settings },
        { id: "billing", label: "Enrollments & Billing", href: "/admin/enrollments", icon: CreditCard },
    ];

    const filteredCommands = query === ""
        ? commands
        : commands.filter((command) =>
            command.label.toLowerCase().includes(query.toLowerCase())
        );

    const onSelect = (href: string) => {
        router.push(href);
        setIsOpen(false);
        setQuery("");
    };

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog onClose={setIsOpen} className="relative z-50">
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6 md:p-20">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="mx-auto max-w-xl transform divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white dark:bg-card shadow-2xl ring-1 ring-black/5 transition-all">
                            <Combobox onChange={(command: any) => onSelect(command.href)}>
                                <div className="relative">
                                    <Search
                                        className="pointer-events-none absolute top-3.5 left-4 h-5 w-5 text-gray-400"
                                        aria-hidden="true"
                                    />
                                    <Combobox.Input
                                        className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                                        placeholder="Search commands... (e.g., 'Courses')"
                                        onChange={(event) => setQuery(event.target.value)}
                                    />
                                </div>

                                {filteredCommands.length > 0 && (
                                    <Combobox.Options static className="max-h-96 scroll-py-3 overflow-y-auto p-3">
                                        {filteredCommands.map((command) => (
                                            <Combobox.Option
                                                key={command.id}
                                                value={command}
                                                className={({ active }) =>
                                                    `flex cursor-default select-none rounded-xl px-3 py-2 ${active ? 'bg-brand-blue/10 text-brand-blue' : 'text-gray-900 dark:text-gray-100'
                                                    }`
                                                }
                                            >
                                                {({ active }) => (
                                                    <>
                                                        <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${active ? 'bg-brand-blue text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>
                                                            <command.icon className="h-6 w-6" aria-hidden="true" />
                                                        </div>
                                                        <div className="ml-4 flex-auto">
                                                            <p className={`text-sm font-medium ${active ? 'text-brand-blue' : 'text-gray-900 dark:text-white'}`}>
                                                                {command.label}
                                                            </p>
                                                        </div>
                                                        {active && (
                                                            <ArrowRight className="h-5 w-5 text-brand-blue" />
                                                        )}
                                                    </>
                                                )}
                                            </Combobox.Option>
                                        ))}
                                    </Combobox.Options>
                                )}

                                {query !== "" && filteredCommands.length === 0 && (
                                    <p className="p-4 text-sm text-gray-500 text-center">No results found.</p>
                                )}

                                <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2.5 text-xs text-gray-500 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                                    <span>Use UP/DOWN to navigate</span>
                                    <span>ENTER to select</span>
                                </div>
                            </Combobox>
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    );
}
