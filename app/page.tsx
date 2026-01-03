"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { TodoClient, TaskVisibility } from "@/lib/types";
import { useActor } from "@/lib/useActor";
import { ActorSetupModal } from "./components/ActorSetupModal";

interface BoardMember {
  actorId: string;
  emoji: string;
  name: string;
}

const STORAGE_KEYS = {
  focusCollapsed: "whiteboard.sectionCollapsed.focus",
  laterCollapsed: "whiteboard.sectionCollapsed.later",
  doneCollapsed: "whiteboard.sectionCollapsed.done",
};

export default function Home() {
  const { actor, isLoading: actorLoading, needsSetup, createActor } = useActor();
  const [todos, setTodos] = useState<TodoClient[]>([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusCollapsed, setFocusCollapsed] = useState(false);
  const [laterCollapsed, setLaterCollapsed] = useState(false);
  const [doneCollapsed, setDoneCollapsed] = useState(true);
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);

  // Load collapsed state from localStorage
  useEffect(() => {
    const storedFocusCollapsed = localStorage.getItem(STORAGE_KEYS.focusCollapsed);
    const storedLaterCollapsed = localStorage.getItem(STORAGE_KEYS.laterCollapsed);
    const storedDoneCollapsed = localStorage.getItem(STORAGE_KEYS.doneCollapsed);

    if (storedFocusCollapsed !== null) {
      setFocusCollapsed(storedFocusCollapsed === "true");
    }
    if (storedLaterCollapsed !== null) {
      setLaterCollapsed(storedLaterCollapsed === "true");
    }
    if (storedDoneCollapsed !== null) {
      setDoneCollapsed(storedDoneCollapsed === "true");
    }
  }, []);

  // Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.focusCollapsed, String(focusCollapsed));
  }, [focusCollapsed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.laterCollapsed, String(laterCollapsed));
  }, [laterCollapsed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.doneCollapsed, String(doneCollapsed));
  }, [doneCollapsed]);

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
    fetchBoardMembers();
  }, []);

  async function fetchTodos() {
    try {
      const res = await fetch("/api/todos");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTodos(data.todos);
      setError(null);
    } catch {
      setError("Failed to load todos");
    } finally {
      setLoading(false);
    }
  }

  async function fetchBoardMembers() {
    try {
      const res = await fetch("/api/board-members");
      if (res.ok) {
        const data = await res.json();
        setBoardMembers(data.members);
      }
    } catch (e) {
      console.error("Failed to fetch board members:", e);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;

    // Optimistic add with temp id
    const tempId = `temp-${Date.now()}`;
    const optimisticTodo: TodoClient = {
      _id: tempId,
      boardId: "home",
      text,
      done: false,
      focus: false,
      priority: "normal",
      visibility: "shared",
      ownerActorId: actor?.id ?? null,
      assigneeActorId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      doneAt: null,
    };

    setTodos((prev) => [optimisticTodo, ...prev]);
    setNewText("");

    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, ownerActorId: actor?.id ?? null }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add");
      }

      const data = await res.json();
      // Replace temp todo with real one
      setTodos((prev) =>
        prev.map((t) => (t._id === tempId ? data.todo : t))
      );
      setError(null);
    } catch (err) {
      // Remove optimistic todo on error
      setTodos((prev) => prev.filter((t) => t._id !== tempId));
      setError(err instanceof Error ? err.message : "Failed to add todo");
    }
  }

  async function handleToggle(id: string, currentDone: boolean) {
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) =>
        t._id === id
          ? {
            ...t,
            done: !currentDone,
            doneAt: !currentDone ? new Date().toISOString() : null,
            updatedAt: new Date().toISOString(),
          }
          : t
      )
    );

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !currentDone }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      // Re-sort after toggle by refetching
      await fetchTodos();
      setError(null);
    } catch {
      // Revert on error
      setTodos((prev) =>
        prev.map((t) =>
          t._id === id
            ? { ...t, done: currentDone, doneAt: currentDone ? t.doneAt : null }
            : t
        )
      );
      setError("Failed to update todo");
    }
  }

  async function handleToggleFocus(id: string, currentFocus: boolean) {
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) =>
        t._id === id
          ? {
            ...t,
            focus: !currentFocus,
            updatedAt: new Date().toISOString(),
          }
          : t
      )
    );

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focus: !currentFocus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      setError(null);
    } catch {
      // Revert on error
      setTodos((prev) =>
        prev.map((t) =>
          t._id === id
            ? { ...t, focus: currentFocus }
            : t
        )
      );
      setError("Failed to update focus");
    }
  }

  async function handleDelete(id: string) {
    // Optimistic delete
    const prevTodos = todos;
    setTodos((prev) => prev.filter((t) => t._id !== id));

    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }
      setError(null);
    } catch {
      // Revert on error
      setTodos(prevTodos);
      setError("Failed to delete todo");
    }
  }

  async function handleAssign(id: string, assigneeActorId: string | null) {
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) =>
        t._id === id
          ? { ...t, assigneeActorId, updatedAt: new Date().toISOString() }
          : t
      )
    );
    setMenuOpenForId(null);

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeActorId }),
      });

      if (!res.ok) {
        throw new Error("Failed to assign");
      }
      setError(null);
    } catch {
      // Revert on error
      await fetchTodos();
      setError("Failed to assign task");
    }
  }

  async function handleToggleVisibility(id: string, currentVisibility: TaskVisibility) {
    const newVisibility: TaskVisibility = currentVisibility === 'shared' ? 'private' : 'shared';

    // Optimistic update
    setTodos((prev) =>
      prev.map((t) =>
        t._id === id
          ? {
            ...t,
            visibility: newVisibility,
            // Clear assignee when making private
            assigneeActorId: newVisibility === 'private' ? null : t.assigneeActorId,
            updatedAt: new Date().toISOString()
          }
          : t
      )
    );
    setMenuOpenForId(null);

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visibility: newVisibility,
          // Clear assignee when making private
          assigneeActorId: newVisibility === 'private' ? null : undefined
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update visibility");
      }
      setError(null);
    } catch {
      // Revert on error
      await fetchTodos();
      setError("Failed to update task visibility");
    }
  }

  // Filter out private tasks not owned by current actor
  const visibleTodos = todos.filter((t) => {
    if (t.visibility === 'private' && t.ownerActorId !== actor?.id) {
      return false;
    }
    return true;
  });

  // Split and sort visible todos
  const focusTodos = visibleTodos
    .filter((t) => !t.done && t.focus)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const laterTodos = visibleTodos
    .filter((t) => !t.done && !t.focus)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const doneTodos = visibleTodos
    .filter((t) => t.done)
    .sort((a, b) => {
      const aTime = a.doneAt ? new Date(a.doneAt).getTime() : new Date(a.updatedAt).getTime();
      const bTime = b.doneAt ? new Date(b.doneAt).getTime() : new Date(b.updatedAt).getTime();
      return bTime - aTime;
    });

  const openCount = focusTodos.length + laterTodos.length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
      {/* Actor setup modal - shown once on first visit */}
      {needsSetup && !actorLoading && (
        <ActorSetupModal onComplete={createActor} />
      )}

      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 text-center">
          Whiteboard Todos
        </h1>

        {/* Add form */}
        <form onSubmit={handleAdd} className="mb-6">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Add a todo..."
            maxLength={200}
            className="w-full px-4 py-3 text-lg rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </form>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="text-center py-12 text-zinc-500">Loading...</div>
        ) : (
          <>
            {/* Focus / Now Section */}
            <Section
              title="Focus / Now"
              count={focusTodos.length}
              collapsed={focusCollapsed}
              onToggleCollapse={() => setFocusCollapsed(!focusCollapsed)}
              emptyMessage="No focus items. Star a task to keep it at the top."
              isFocusSection
            >
              {focusTodos.map((todo) => (
                <TodoItem
                  key={todo._id}
                  todo={todo}
                  actor={actor}
                  boardMembers={boardMembers}
                  onToggle={handleToggle}
                  onToggleFocus={handleToggleFocus}
                  onDelete={handleDelete}
                  onAssign={handleAssign}
                  onToggleVisibility={handleToggleVisibility}
                  isFocusSection
                  menuOpenForId={menuOpenForId}
                  setMenuOpenForId={setMenuOpenForId}
                />
              ))}
            </Section>

            {/* Later / Parking Lot Section */}
            <Section
              title="Later / Parking Lot"
              count={laterTodos.length}
              collapsed={laterCollapsed}
              onToggleCollapse={() => setLaterCollapsed(!laterCollapsed)}
              emptyMessage="No items in parking lot."
            >
              {laterTodos.map((todo) => (
                <TodoItem
                  key={todo._id}
                  todo={todo}
                  actor={actor}
                  boardMembers={boardMembers}
                  onToggle={handleToggle}
                  onToggleFocus={handleToggleFocus}
                  onDelete={handleDelete}
                  onAssign={handleAssign}
                  onToggleVisibility={handleToggleVisibility}
                  menuOpenForId={menuOpenForId}
                  setMenuOpenForId={setMenuOpenForId}
                />
              ))}
            </Section>

            {/* Done Section */}
            <Section
              title="Done"
              count={doneTodos.length}
              collapsed={doneCollapsed}
              onToggleCollapse={() => setDoneCollapsed(!doneCollapsed)}
              emptyMessage="No completed items."
            >
              {doneTodos.map((todo) => (
                <TodoItem
                  key={todo._id}
                  todo={todo}
                  actor={actor}
                  boardMembers={boardMembers}
                  onToggle={handleToggle}
                  onToggleFocus={handleToggleFocus}
                  onDelete={handleDelete}
                  onAssign={handleAssign}
                  onToggleVisibility={handleToggleVisibility}
                  menuOpenForId={menuOpenForId}
                  setMenuOpenForId={setMenuOpenForId}
                />
              ))}
            </Section>

            {/* Footer */}
            <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <div>
                {openCount} open{doneTodos.length > 0 && `, ${doneTodos.length} done`}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Section component for collapsible groups
interface SectionProps {
  title: string;
  count: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  emptyMessage: string;
  children: React.ReactNode;
  isFocusSection?: boolean;
}

function Section({ title, count, collapsed, onToggleCollapse, emptyMessage, children, isFocusSection }: SectionProps) {
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

// TodoItem component
interface TodoItemProps {
  todo: TodoClient;
  actor: { id: string; emoji: string } | null;
  boardMembers: BoardMember[];
  onToggle: (id: string, done: boolean) => void;
  onToggleFocus: (id: string, focus: boolean) => void;
  onDelete: (id: string) => void;
  onAssign: (id: string, assigneeActorId: string | null) => void;
  onToggleVisibility: (id: string, visibility: TaskVisibility) => void;
  isFocusSection?: boolean;
  menuOpenForId: string | null;
  setMenuOpenForId: (id: string | null) => void;
}

function TodoItem({
  todo,
  actor,
  boardMembers,
  onToggle,
  onToggleFocus,
  onDelete,
  onAssign,
  onToggleVisibility,
  isFocusSection,
  menuOpenForId,
  setMenuOpenForId
}: TodoItemProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isMenuOpen = menuOpenForId === todo._id;
  const [showAssignPicker, setShowAssignPicker] = useState(false);

  // Find assignee's emoji
  const assigneeEmoji = todo.assigneeActorId
    ? boardMembers.find(m => m.actorId === todo.assigneeActorId)?.emoji
    : null;

  const isPrivate = todo.visibility === 'private';
  const isOwner = todo.ownerActorId === actor?.id;

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
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenuOpenForId(null);
        setShowAssignPicker(false);
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

      {/* Text */}
      <span
        className={`flex-1 text-base ${todo.done ? "text-zinc-400 line-through" : "text-zinc-900 dark:text-zinc-100"
          }`}
      >
        {todo.text}
      </span>

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

      {/* Overflow menu button */}
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

      {/* Dropdown menu */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 z-10 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 min-w-[160px]"
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

          {/* Assignment actions - only for shared tasks */}
          {!todo.done && !isPrivate && (
            <>
              {showAssignPicker ? (
                <div className="px-2 py-2 border-t border-zinc-200 dark:border-zinc-700">
                  <div className="text-xs text-zinc-500 mb-2 px-1">Assign to:</div>
                  <div className="grid grid-cols-4 gap-1">
                    {boardMembers.map((member) => (
                      <button
                        key={member.actorId}
                        type="button"
                        onClick={() => onAssign(todo._id, member.actorId)}
                        className={`w-8 h-8 text-lg rounded-lg flex items-center justify-center transition-all ${todo.assigneeActorId === member.actorId
                          ? "bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500"
                          : "bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600"
                          }`}
                        aria-label={`Assign to ${member.name}`}
                        title={member.name}
                      >
                        {member.emoji}
                      </button>
                    ))}
                  </div>
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

          {/* Delete action */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Delete this task?")) {
                onDelete(todo._id);
              }
              setMenuOpenForId(null);
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

