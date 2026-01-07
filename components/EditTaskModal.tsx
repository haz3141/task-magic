"use client";

import { useState } from "react";

interface EditTaskModalProps {
    initialText: string;
    onCancel: () => void;
    onSave: (text: string) => void;
}

export function EditTaskModal({ initialText, onCancel, onSave }: EditTaskModalProps) {
    const [text, setText] = useState(initialText);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={onCancel}
            onKeyDown={(e) => {
                if (e.key === "Escape") {
                    onCancel();
                }
            }}
        >
            <div
                className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                    Edit task
                </h2>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && text.trim()) {
                            onSave(text);
                        }
                    }}
                    maxLength={200}
                    autoFocus
                    className="w-full px-3 py-2 text-base rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                />
                <div className="flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={() => onSave(text)}
                        disabled={!text.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}
