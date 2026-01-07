"use client";

import React from "react";

interface SectionProps {
    title: string;
    count: number;
    collapsed: boolean;
    onToggleCollapse: () => void;
    emptyMessage: string;
    children: React.ReactNode;
    isFocusSection?: boolean;
}

export function Section({
    title,
    count,
    collapsed,
    onToggleCollapse,
    emptyMessage,
    children,
    isFocusSection,
}: SectionProps) {
    const hasItems = count > 0;

    return (
        <div className="mb-4">
            <button
                type="button"
                onClick={onToggleCollapse}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors touch-manipulation"
                style={{ minHeight: "44px" }}
                aria-expanded={!collapsed}
                aria-label={`${title} section, ${count} items`}
            >
                <div className="flex items-center gap-2">
                    <svg
                        className={`w-4 h-4 text-zinc-500 transition-transform ${collapsed ? "" : "rotate-90"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className={`font-medium ${isFocusSection ? "text-amber-600 dark:text-amber-400" : "text-zinc-700 dark:text-zinc-300"}`}>
                        {title}
                    </span>
                </div>
                <span className="text-xs bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full">
                    {count}
                </span>
            </button>

            {!collapsed && (
                <ul className="mt-2 space-y-2">
                    {hasItems ? (
                        children
                    ) : (
                        <li className="text-center py-4 text-zinc-400 text-sm">{emptyMessage}</li>
                    )}
                </ul>
            )}
        </div>
    );
}
