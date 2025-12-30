"use client";

import { useState, useEffect, FormEvent } from "react";
import { TodoClient } from "@/lib/types";

const STORAGE_KEYS = {
  focusCollapsed: "whiteboard.sectionCollapsed.focus",
  laterCollapsed: "whiteboard.sectionCollapsed.later",
};

export default function Home() {
  const [todos, setTodos] = useState<TodoClient[]>([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(true);
  const [focusCollapsed, setFocusCollapsed] = useState(false);
  const [laterCollapsed, setLaterCollapsed] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    const storedFocusCollapsed = localStorage.getItem(STORAGE_KEYS.focusCollapsed);
    const storedLaterCollapsed = localStorage.getItem(STORAGE_KEYS.laterCollapsed);
    if (storedFocusCollapsed !== null) {
      setFocusCollapsed(storedFocusCollapsed === "true");
    }
    if (storedLaterCollapsed !== null) {
      setLaterCollapsed(storedLaterCollapsed === "true");
    }
  }, []);

  // Persist collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.focusCollapsed, String(focusCollapsed));
  }, [focusCollapsed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.laterCollapsed, String(laterCollapsed));
  }, [laterCollapsed]);

  // Fetch todos on mount
  useEffect(() => {
    fetchTodos();
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

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;

    // Optimistic add with temp id
    const tempId = `temp-${Date.now()}`;
    const optimisticTodo: TodoClient = {
      _id: tempId,
      text,
      done: false,
      focus: false,
      priority: "normal",
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
        body: JSON.stringify({ text }),
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

  // Split and sort todos
  const focusTodos = todos
    .filter((t) => !t.done && t.focus)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const laterTodos = todos
    .filter((t) => !t.done && !t.focus)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const doneTodos = todos
    .filter((t) => t.done)
    .sort((a, b) => {
      const aTime = a.doneAt ? new Date(a.doneAt).getTime() : new Date(a.updatedAt).getTime();
      const bTime = b.doneAt ? new Date(b.doneAt).getTime() : new Date(b.updatedAt).getTime();
      return bTime - aTime;
    });

  const openCount = focusTodos.length + laterTodos.length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-8 px-4">
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
                  onToggle={handleToggle}
                  onToggleFocus={handleToggleFocus}
                  onDelete={handleDelete}
                  isFocusSection
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
                  onToggle={handleToggle}
                  onToggleFocus={handleToggleFocus}
                  onDelete={handleDelete}
                />
              ))}
            </Section>

            {/* Done Section */}
            {showDone && doneTodos.length > 0 && (
              <ul className="space-y-2 mb-6">
                {doneTodos.map((todo) => (
                  <TodoItem
                    key={todo._id}
                    todo={todo}
                    onToggle={handleToggle}
                    onToggleFocus={handleToggleFocus}
                    onDelete={handleDelete}
                  />
                ))}
              </ul>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <div>
                {openCount} open{doneTodos.length > 0 && `, ${doneTodos.length} done`}
              </div>
              {doneTodos.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDone(!showDone)}
                  className="px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors touch-manipulation"
                  style={{ minHeight: "44px" }}
                >
                  {showDone ? "Hide done" : "Show done"}
                </button>
              )}
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
  onToggle: (id: string, done: boolean) => void;
  onToggleFocus: (id: string, focus: boolean) => void;
  onDelete: (id: string) => void;
  isFocusSection?: boolean;
}

function TodoItem({ todo, onToggle, onToggleFocus, onDelete, isFocusSection }: TodoItemProps) {
  return (
    <li
      className={`flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border group ${isFocusSection
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

      {/* Focus toggle (star) - only for open todos */}
      {!todo.done && (
        <button
          type="button"
          onClick={() => onToggleFocus(todo._id, todo.focus)}
          className={`flex-shrink-0 p-2 transition-colors touch-manipulation ${todo.focus
            ? "text-amber-500 hover:text-amber-600"
            : "text-zinc-400/50 md:text-zinc-300 hover:text-amber-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
            }`}
          style={{ minWidth: "44px", minHeight: "44px" }}
          aria-label={todo.focus ? "Remove from focus" : "Add to focus"}
        >
          <svg className="w-5 h-5" fill={todo.focus ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        </button>
      )}

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onDelete(todo._id)}
        className="flex-shrink-0 p-2 text-zinc-400/50 md:text-zinc-400 hover:text-red-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 touch-manipulation"
        style={{ minWidth: "44px", minHeight: "44px" }}
        aria-label="Delete todo"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </li>
  );
}
