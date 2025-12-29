"use client";

import { useState, useEffect, FormEvent } from "react";
import { TodoClient } from "@/lib/types";

export default function Home() {
  const [todos, setTodos] = useState<TodoClient[]>([]);
  const [newText, setNewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(true);

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

  const openTodos = todos.filter((t) => !t.done);
  const doneTodos = todos.filter((t) => t.done);
  const visibleTodos = showDone ? todos : openTodos;

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
            {/* Todo list */}
            <ul className="space-y-2 mb-6">
              {visibleTodos.length === 0 ? (
                <li className="text-center py-8 text-zinc-400">
                  {showDone ? "No todos yet" : "No open todos"}
                </li>
              ) : (
                visibleTodos.map((todo) => (
                  <li
                    key={todo._id}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 group"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggle(todo._id, todo.done)}
                      className="flex-shrink-0 w-6 h-6 rounded border-2 border-zinc-300 dark:border-zinc-600 flex items-center justify-center hover:border-blue-500 transition-colors touch-manipulation"
                      style={{ minWidth: "44px", minHeight: "44px" }}
                      aria-label={todo.done ? "Mark as not done" : "Mark as done"}
                    >
                      {todo.done && (
                        <svg
                          className="w-4 h-4 text-blue-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>
                    <span
                      className={`flex-1 text-base ${todo.done
                          ? "text-zinc-400 line-through"
                          : "text-zinc-900 dark:text-zinc-100"
                        }`}
                    >
                      {todo.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDelete(todo._id)}
                      className="flex-shrink-0 p-2 text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 touch-manipulation"
                      style={{ minWidth: "44px", minHeight: "44px" }}
                      aria-label="Delete todo"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </li>
                ))
              )}
            </ul>

            {/* Footer */}
            <div className="flex items-center justify-between text-sm text-zinc-500 dark:text-zinc-400 pt-4 border-t border-zinc-200 dark:border-zinc-700">
              <div>
                {openTodos.length} open{doneTodos.length > 0 && `, ${doneTodos.length} done`}
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
