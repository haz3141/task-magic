"use client";

import { useState, useEffect, FormEvent } from "react";
import { EmojiPicker, EMOJI_OPTIONS } from "./EmojiPicker";

interface ActorSetupModalProps {
    onComplete: (name: string, emoji: string) => void;
}

interface BoardMember {
    actorId: string;
    emoji: string;
    name: string;
}

/**
 * One-time modal for actor setup.
 * Fetches used emojis to enforce uniqueness.
 * Collects name and emoji, registers as board member, then calls onComplete.
 * Not dismissible without completing setup.
 */
export function ActorSetupModal({ onComplete }: ActorSetupModalProps) {
    const [name, setName] = useState("");
    const [emoji, setEmoji] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [usedEmojis, setUsedEmojis] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch used emojis on mount
    useEffect(() => {
        async function fetchUsedEmojis() {
            try {
                const res = await fetch("/api/board-members");
                if (res.ok) {
                    const data = await res.json();
                    const emojis = (data.members as BoardMember[]).map(m => m.emoji);
                    setUsedEmojis(emojis);

                    // Auto-select first available emoji
                    const firstAvailable = EMOJI_OPTIONS.find(e => !emojis.includes(e));
                    if (firstAvailable) {
                        setEmoji(firstAvailable);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch board members:", e);
            } finally {
                setIsLoading(false);
            }
        }
        fetchUsedEmojis();
    }, []);

    async function handleSubmit(e: FormEvent) {
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
        if (!emoji) {
            setError("Please select an avatar");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Generate actor ID before registering
            const actorId = crypto.randomUUID();

            // Register as board member
            const res = await fetch("/api/board-members", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ actorId, emoji, name: trimmedName }),
            });

            if (!res.ok) {
                const data = await res.json();
                if (data.error === "Emoji already in use") {
                    setUsedEmojis(prev => [...prev, emoji]);
                    setEmoji(null);
                    setError("That avatar was just taken! Please pick another.");
                    setIsSubmitting(false);
                    return;
                }
                throw new Error(data.error || "Failed to register");
            }

            // Complete setup with generated ID
            onComplete(trimmedName, emoji);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setIsSubmitting(false);
        }
    }

    const availableEmojis = EMOJI_OPTIONS.filter(e => !usedEmojis.includes(e));
    const hasAvailableEmoji = availableEmojis.length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-center">
                    Welcome! 👋
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 text-center">
                    Let&apos;s personalize your board
                </p>

                {isLoading ? (
                    <div className="text-center py-8 text-zinc-500">Loading...</div>
                ) : (
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
                                Pick an avatar {usedEmojis.length > 0 && <span className="text-zinc-400 font-normal">(grayed = taken)</span>}
                            </label>
                            <EmojiPicker
                                selected={emoji ?? undefined}
                                onSelect={setEmoji}
                                disabledEmojis={usedEmojis}
                            />
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
                            disabled={isSubmitting || !hasAvailableEmoji}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
                        >
                            {isSubmitting ? "Setting up..." : "Continue"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

