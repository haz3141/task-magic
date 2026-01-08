"use client";

import { FormEvent } from "react";

interface AddTodoFormProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
}

export function AddTodoForm({ value, onChange, onSubmit }: AddTodoFormProps) {
    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        onSubmit();
    }

    return (
        <form onSubmit={handleSubmit} className="mb-6">
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Add a todo..."
                maxLength={200}
                className="w-full px-4 py-3 text-lg rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
        </form>
    );
}
