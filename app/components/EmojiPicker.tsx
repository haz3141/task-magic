"use client";

// Common emoji choices for quick selection
export const EMOJI_OPTIONS = ["😊", "🚀", "⭐", "🌟", "💪", "🎯", "🔥", "💡", "🌈", "🎨", "🏠", "❤️"];

interface EmojiPickerProps {
    selected?: string;
    onSelect: (emoji: string) => void;
    disabledEmojis?: string[];
    compact?: boolean; // For use in submenu
}

/**
 * Reusable emoji picker grid.
 * - Used in ActorSetupModal (with disabled state for uniqueness)
 * - Used in assignment submenu (compact mode)
 */
export function EmojiPicker({ selected, onSelect, disabledEmojis = [], compact = false }: EmojiPickerProps) {
    const gridClass = compact
        ? "grid grid-cols-4 gap-1"
        : "grid grid-cols-6 gap-2";

    const buttonClass = compact
        ? "w-8 h-8 text-lg"
        : "w-10 h-10 text-xl";

    return (
        <div className={gridClass}>
            {EMOJI_OPTIONS.map((emoji) => {
                const isDisabled = disabledEmojis.includes(emoji);
                const isSelected = emoji === selected;

                return (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => !isDisabled && onSelect(emoji)}
                        disabled={isDisabled}
                        className={`${buttonClass} rounded-lg flex items-center justify-center transition-all ${isDisabled
                                ? "opacity-30 cursor-not-allowed bg-zinc-100 dark:bg-zinc-700"
                                : isSelected
                                    ? "bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500"
                                    : "bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                            }`}
                        aria-label={isDisabled ? `${emoji} (in use)` : `Select ${emoji}`}
                        aria-pressed={isSelected}
                        aria-disabled={isDisabled}
                    >
                        {emoji}
                    </button>
                );
            })}
        </div>
    );
}
