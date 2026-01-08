"use client";

interface ConfirmDeleteModalProps {
    onCancel: () => void;
    onConfirm: () => void;
}

export function ConfirmDeleteModal({ onCancel, onConfirm }: ConfirmDeleteModalProps) {
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
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
                    Delete task?
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                    This action cannot be undone.
                </p>
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
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}
