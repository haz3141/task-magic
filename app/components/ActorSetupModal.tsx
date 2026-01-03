"use client";

import { useState, FormEvent } from "react";

// Common emoji choices for quick selection
const EMOJI_OPTIONS = ["😊", "🚀", "⭐", "🌟", "💪", "🎯", "🔥", "💡", "🌈", "🎨", "🏠", "❤️"];

interface ActorSetupModalProps {
    onComplete: (name: string, emoji: string) => void;
}

/**
 * One-time modal for actor setup.
 * Collects name and emoji, then calls onComplete.
 * Not dismissible without completing setup.
 */
export function ActorSetupModal({ onComplete }: ActorSetupModalProps) {
    const [name, setName] = useState("");
    const [emoji, setEmoji] = useState("😊");
    const [error, setError] = useState<string | null>(null);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        const trimmedName = name.trim();
        if (trimmedName.length === 0) {
            setError("Please enter your name");
            return;
        }
        if (trimmedName.length > 20) {
            setError("Name must be 20 characters or less");
            return;
        }

        onComplete(trimmedName, emoji);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-center">
                    Welcome! 👋
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 text-center">
                    Let&apos;s personalize your board
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name input */}
                    <div>
                        <label
                            htmlFor="actor-name"
                            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
                        >
                            Your name
                        </label>
                        <input
                            id="actor-name"
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError(null);
                            }}
                            placeholder="Enter your name"
                            maxLength={20}
                            autoFocus
                            className="w-full px-3 py-2 text-base rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Emoji selector */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                            Pick an avatar
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                            {EMOJI_OPTIONS.map((e) => (
                                <button
                                    key={e}
                                    type="button"
                                    onClick={() => setEmoji(e)}
                                    className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-all ${emoji === e
                                            ? "bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500"
                                            : "bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                                        }`}
                                    aria-label={`Select ${e}`}
                                    aria-pressed={emoji === e}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <p className="text-sm text-red-600 dark:text-red-400">
                            {error}
                        </p>
                    )}

                    {/* Submit button */}
                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
                    >
                        Continue
                    </button>
                </form>
            </div>
        </div>
    );
}
