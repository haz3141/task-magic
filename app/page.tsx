"use client";

import { useState, useEffect, FormEvent } from "react";
import { TodoClient, TaskVisibility } from "@/lib/types";
import { useActor } from "@/lib/useActor";
import { ActorSetupModal } from "@/components/ActorSetupModal";
import { Section } from "@/components/Section";
import { TodoItem } from "@/components/TodoItem";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { EditTaskModal } from "@/components/EditTaskModal";
import { AddTodoForm } from "@/components/AddTodoForm";
import { ErrorBanner } from "@/components/ErrorBanner";
import { BoardMember } from "@/components/types";

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
  const [confirmDeleteTodoId, setConfirmDeleteTodoId] = useState<string | null>(null);
  const [editTodoId, setEditTodoId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

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

  async function handleUpdateText(id: string, newText: string) {
    const trimmed = newText.trim();
    if (!trimmed) {
      setError("Text cannot be empty");
      return;
    }
    if (trimmed.length > 200) {
      setError("Text must be 200 characters or less");
      return;
    }

    // Optimistic update
    setTodos((prev) =>
      prev.map((t) =>
        t._id === id
          ? { ...t, text: trimmed, updatedAt: new Date().toISOString() }
          : t
      )
    );
    setEditTodoId(null);
    setEditText("");

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }
      setError(null);
    } catch (err) {
      // Revert on error
      await fetchTodos();
      setError(err instanceof Error ? err.message : "Failed to update task text");
    }
  }

  // Handle move up/down within a section by swapping order values
  async function handleMove(id: string, direction: 'up' | 'down', sectionTodos: TodoClient[]) {
    const idx = sectionTodos.findIndex(t => t._id === id);
    if (idx === -1) return;

    const neighborIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (neighborIdx < 0 || neighborIdx >= sectionTodos.length) return;

    const task = sectionTodos[idx];
    const neighbor = sectionTodos[neighborIdx];

    // Get order values (fallback to createdAt timestamp if not set)
    const taskOrder = task.order ?? Date.parse(task.createdAt);
    const neighborOrder = neighbor.order ?? Date.parse(neighbor.createdAt);

    // Optimistic update: swap order values
    setTodos(prev => prev.map(t => {
      if (t._id === task._id) return { ...t, order: neighborOrder };
      if (t._id === neighbor._id) return { ...t, order: taskOrder };
      return t;
    }));
    setMenuOpenForId(null);

    // Persist both changes
    try {
      const [res1, res2] = await Promise.all([
        fetch(`/api/todos/${task._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: neighborOrder }),
        }),
        fetch(`/api/todos/${neighbor._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: taskOrder }),
        }),
      ]);

      if (!res1.ok || !res2.ok) {
        throw new Error('Failed to update order');
      }
      setError(null);
    } catch {
      // Revert on error by refetching
      await fetchTodos();
      setError('Failed to reorder task');
    }
  }

  // Handle form submission
  function handleFormSubmit() {
    const event = { preventDefault: () => { } } as FormEvent;
    handleAdd(event);
  }

  // Filter out private tasks not owned by current actor
  const visibleTodos = todos.filter((t) => {
    if (t.visibility === 'private' && t.ownerActorId !== actor?.id) {
      return false;
    }
    return true;
  });

  // Split and sort visible todos (by order ascending, with createdAt fallback)
  const focusTodos = visibleTodos
    .filter((t) => !t.done && t.focus)
    .sort((a, b) => {
      const aOrder = a.order ?? Date.parse(a.createdAt);
      const bOrder = b.order ?? Date.parse(b.createdAt);
      return aOrder - bOrder;
    });

  const laterTodos = visibleTodos
    .filter((t) => !t.done && !t.focus)
    .sort((a, b) => {
      const aOrder = a.order ?? Date.parse(a.createdAt);
      const bOrder = b.order ?? Date.parse(b.createdAt);
      return aOrder - bOrder;
    });

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
        <ActorSetupModal onComplete={(actorId, name, emoji) => {
          createActor(actorId, name, emoji);
          // Refresh board members so assignment menu is populated immediately
          fetchBoardMembers();
        }} />
      )}

      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 text-center">
          Whiteboard Todos
        </h1>

        {/* Add form */}
        <AddTodoForm
          value={newText}
          onChange={setNewText}
          onSubmit={handleFormSubmit}
        />

        {/* Error message */}
        {error && <ErrorBanner message={error} />}

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
              {focusTodos.map((todo, idx) => (
                <TodoItem
                  key={todo._id}
                  todo={todo}
                  actor={actor}
                  boardMembers={boardMembers}
                  onToggle={handleToggle}
                  onToggleFocus={handleToggleFocus}
                  onDelete={handleDelete}
                  onRequestDelete={setConfirmDeleteTodoId}
                  onEdit={(id, text) => { setEditTodoId(id); setEditText(text); }}
                  onAssign={handleAssign}
                  onToggleVisibility={handleToggleVisibility}
                  onMoveUp={() => handleMove(todo._id, 'up', focusTodos)}
                  onMoveDown={() => handleMove(todo._id, 'down', focusTodos)}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < focusTodos.length - 1}
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
              {laterTodos.map((todo, idx) => (
                <TodoItem
                  key={todo._id}
                  todo={todo}
                  actor={actor}
                  boardMembers={boardMembers}
                  onToggle={handleToggle}
                  onToggleFocus={handleToggleFocus}
                  onDelete={handleDelete}
                  onRequestDelete={setConfirmDeleteTodoId}
                  onEdit={(id, text) => { setEditTodoId(id); setEditText(text); }}
                  onAssign={handleAssign}
                  onToggleVisibility={handleToggleVisibility}
                  onMoveUp={() => handleMove(todo._id, 'up', laterTodos)}
                  onMoveDown={() => handleMove(todo._id, 'down', laterTodos)}
                  canMoveUp={idx > 0}
                  canMoveDown={idx < laterTodos.length - 1}
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
                  onRequestDelete={setConfirmDeleteTodoId}
                  onEdit={(id, text) => { setEditTodoId(id); setEditText(text); }}
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

      {/* Delete Confirmation Modal */}
      {confirmDeleteTodoId && (
        <ConfirmDeleteModal
          onCancel={() => setConfirmDeleteTodoId(null)}
          onConfirm={() => {
            handleDelete(confirmDeleteTodoId);
            setConfirmDeleteTodoId(null);
          }}
        />
      )}

      {/* Edit Task Modal */}
      {editTodoId && (
        <EditTaskModal
          initialText={editText}
          onCancel={() => { setEditTodoId(null); setEditText(""); }}
          onSave={(text) => handleUpdateText(editTodoId, text)}
        />
      )}
    </div>
  );
}
