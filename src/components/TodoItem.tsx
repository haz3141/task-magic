"use client";

import { useState, useEffect, useRef } from "react";
import { TodoClient, TaskVisibility } from "@/lib/shared/types/todo";
import { BoardMember } from "@/lib/shared/types/board";

interface TodoItemProps {
    todo: TodoClient;
    actor: { id: string; emoji: string } | null;
    boardMembers: BoardMember[];
    onToggle: (id: string, done: boolean) => void;
    onToggleFocus: (id: string, focus: boolean) => void;
    onDelete: (id: string) => void;
    onRequestDelete: (id: string) => void;
    onEdit: (id: string, currentText: string) => void;
    onAssign: (id: string, assigneeActorId: string | null) => void;
    onToggleVisibility: (id: string, visibility: TaskVisibility) => void;
    onSetDueDate?: (id: string, dueDate: string | null) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
    isFocusSection?: boolean;
    originLabel?: 'Focus' | 'Later';
    menuOpenForId: string | null;
    setMenuOpenForId: (id: string | null) => void;
    todayStr?: string;
}

// Helper to format a date as YYYY-MM-DD
function formatDateStr(date: Date): string {
    return date.toISOString().slice(0, 10);
}

// Get tomorrow's date string
function getTomorrowStr(todayStr: string): string {
    const d = new Date(todayStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    return formatDateStr(d);
}

// Format date for display
function formatDateDisplay(dueDate: string, todayStr: string): string {
    if (dueDate === todayStr) return 'Today';
    const tomorrow = getTomorrowStr(todayStr);
    if (dueDate === tomorrow) return 'Tomorrow';
    // Format as Mon DD for other dates
    const d = new Date(dueDate + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function TodoItem({
    todo,
    actor,
    boardMembers,
    onToggle,
    onToggleFocus,
    onRequestDelete,
    onEdit,
    onAssign,
    onToggleVisibility,
    onSetDueDate,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
    isFocusSection,
    originLabel,
    menuOpenForId,
    setMenuOpenForId,
    todayStr,
}: TodoItemProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const isMenuOpen = menuOpenForId === todo._id;
    const [showAssignPicker, setShowAssignPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Find assignee's emoji
    const assigneeEmoji = todo.assigneeActorId
        ? boardMembers.find((m) => m.actorId === todo.assigneeActorId)?.emoji
        : null;

    const isPrivate = todo.visibility === "private";
    const isOwner = todo.ownerActorId === actor?.id;

    // Date calculations
    const effectiveTodayStr = todayStr ?? formatDateStr(new Date());
    const isOverdue = todo.dueDate && todo.dueDate < effectiveTodayStr && !todo.done;
    const isDueToday = todo.dueDate === effectiveTodayStr;

    // Close menu on outside click or Escape
    useEffect(() => {
        if (!isMenuOpen) {
            return;
        }

        function handlePointerDown(e: PointerEvent) {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target as Node)
            ) {
                setMenuOpenForId(null);
                setShowAssignPicker(false);
                setShowDatePicker(false);
            }
        }

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setMenuOpenForId(null);
                setShowAssignPicker(false);
                setShowDatePicker(false);
            }
        }

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMenuOpen, setMenuOpenForId]);

    return (
        <li
            className={`relative flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border ${isFocusSection
                ? "border-l-4 border-l-amber-400 dark:border-l-amber-500 border-t-zinc-200 border-r-zinc-200 border-b-zinc-200 dark:border-t-zinc-700 dark:border-r-zinc-700 dark:border-b-zinc-700"
                : "border-zinc-200 dark:border-zinc-700"
                }`}
        >
            {/* Done checkbox */}
            <button
                type="button"
                onClick={() => onToggle(todo._id, todo.done)}
                className="flex-shrink-0 w-6 h-6 rounded border-2 border-zinc-300 dark:border-zinc-600 flex items-center justify-center hover:border-blue-500 transition-colors touch-manipulation"
                style={{ minWidth: "44px", minHeight: "44px" }}
                aria-label={todo.done ? "Mark as not done" : "Mark as done"}
            >
                {todo.done && (
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                )}
            </button>

            {/* Text and badges container */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
                <span
                    className={`flex-1 text-base truncate ${todo.done ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-zinc-100"
                        }`}
                >
                    {todo.text}
                </span>

                {/* Origin label (for Today section) */}
                {originLabel && !todo.done && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 flex-shrink-0">
                        {originLabel}
                    </span>
                )}

                {/* Date badge */}
                {todo.dueDate && !todo.done && (
                    <span
                        className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${isOverdue
                            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                            : isDueToday
                                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                            }`}
                        aria-label={`Due ${formatDateDisplay(todo.dueDate, effectiveTodayStr)}`}
                    >
                        {formatDateDisplay(todo.dueDate, effectiveTodayStr)}
                    </span>
                )}
            </div>

            {/* Private indicator (display only) */}
            {isPrivate && isOwner && (
                <span className="text-zinc-400 text-sm flex-shrink-0" aria-label="Private">
                    🔒
                </span>
            )}

            {/* Assignee emoji indicator (display only) */}
            {assigneeEmoji && !todo.done && (
                <span className="text-sm flex-shrink-0" aria-label="Assigned">
                    {assigneeEmoji}
                </span>
            )}

            {/* Focus indicator (display only, not clickable) */}
            {todo.focus && !todo.done && (
                <span className="text-amber-500 text-sm flex-shrink-0" aria-label="Focused">
                    ★
                </span>
            )}

            {/* Overflow menu button - hidden for Today-derived view */}
            {!originLabel && (
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => setMenuOpenForId(isMenuOpen ? null : todo._id)}
                    className="flex-shrink-0 p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors touch-manipulation"
                    style={{ minWidth: "44px", minHeight: "44px" }}
                    aria-label="More actions"
                    aria-expanded={isMenuOpen}
                >
                    <span className="text-xl leading-none">⋯</span>
                </button>
            )}

            {/* Dropdown menu - hidden for Today-derived view */}
            {!originLabel && isMenuOpen && (
                <div
                    ref={menuRef}
                    className="absolute right-0 top-full mt-1 z-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 min-w-[160px] max-w-[calc(100vw-2rem)]"
                >
                    {/* Focus toggle */}
                    {!todo.done && (
                        <button
                            type="button"
                            onClick={() => {
                                onToggleFocus(todo._id, todo.focus);
                                setMenuOpenForId(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                            {todo.focus ? "Remove Focus" : "Add to Focus"}
                        </button>
                    )}

                    {/* Date actions - only for non-done tasks */}
                    {!todo.done && onSetDueDate && (
                        <>
                            {showDatePicker ? (
                                <div
                                    className="border-t border-zinc-200 dark:border-zinc-700"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="text-xs text-zinc-500 px-3 pt-2 pb-1">Set date:</div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSetDueDate(todo._id, effectiveTodayStr);
                                            setMenuOpenForId(null);
                                            setShowDatePicker(false);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        Today
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onSetDueDate(todo._id, getTomorrowStr(effectiveTodayStr));
                                            setMenuOpenForId(null);
                                            setShowDatePicker(false);
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                    >
                                        Tomorrow
                                    </button>
                                    <div className="px-3 py-2">
                                        <input
                                            type="date"
                                            className="w-full min-w-0 max-w-full box-border text-sm border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100"
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    onSetDueDate(todo._id, e.target.value);
                                                    setMenuOpenForId(null);
                                                    setShowDatePicker(false);
                                                }
                                            }}
                                        />
                                    </div>
                                    {todo.dueDate && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onSetDueDate(todo._id, null);
                                                setMenuOpenForId(null);
                                                setShowDatePicker(false);
                                            }}
                                            className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                        >
                                            Clear date
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowDatePicker(true)}
                                    className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    {todo.dueDate ? "Change date…" : "Set date…"}
                                </button>
                            )}
                        </>
                    )}

                    {/* Move up/down actions - only for non-done tasks */}
                    {!todo.done && canMoveUp && onMoveUp && (
                        <button
                            type="button"
                            onClick={onMoveUp}
                            className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Move up
                        </button>
                    )}
                    {!todo.done && canMoveDown && onMoveDown && (
                        <button
                            type="button"
                            onClick={onMoveDown}
                            className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Move down
                        </button>
                    )}

                    {/* Assignment actions - only for shared tasks */}
                    {!todo.done && !isPrivate && (
                        <>
                            {showAssignPicker ? (
                                <div className="border-t border-zinc-200 dark:border-zinc-700">
                                    <div className="text-xs text-zinc-500 px-3 pt-2 pb-1">Assign to:</div>
                                    {boardMembers.length === 0 ? (
                                        <div className="px-3 py-2 text-sm text-zinc-400">No members yet</div>
                                    ) : (
                                        boardMembers.map((member) => (
                                            <button
                                                key={member.actorId}
                                                type="button"
                                                onClick={() => onAssign(todo._id, member.actorId)}
                                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${todo.assigneeActorId === member.actorId
                                                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                                                    }`}
                                            >
                                                <span className="text-base">{member.emoji}</span>
                                                <span>{member.name || "Member"}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowAssignPicker(true)}
                                    className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Assign to…
                                </button>
                            )}

                            {/* Unassign action */}
                            {todo.assigneeActorId && !showAssignPicker && (
                                <button
                                    type="button"
                                    onClick={() => onAssign(todo._id, null)}
                                    className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                                >
                                    Unassign
                                </button>
                            )}
                        </>
                    )}

                    {/* Visibility toggle - only for owner or shared tasks */}
                    {!todo.done && (isOwner || !isPrivate) && (
                        <button
                            type="button"
                            onClick={() => onToggleVisibility(todo._id, todo.visibility)}
                            className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border-t border-zinc-200 dark:border-zinc-700"
                        >
                            {isPrivate ? "Make shared" : "Make private"}
                        </button>
                    )}

                    {/* Edit action */}
                    <button
                        type="button"
                        onClick={() => {
                            setMenuOpenForId(null);
                            onEdit(todo._id, todo.text);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border-t border-zinc-200 dark:border-zinc-700"
                    >
                        Edit
                    </button>

                    {/* Delete action */}
                    <button
                        type="button"
                        onClick={() => {
                            setMenuOpenForId(null);
                            onRequestDelete(todo._id);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors border-t border-zinc-200 dark:border-zinc-700"
                    >
                        Delete
                    </button>
                </div>
            )}
        </li>
    );
}
