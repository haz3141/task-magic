/**
 * Server-side Todo types and utilities.
 * Uses mongodb ObjectId - must only be imported in server contexts.
 */

import { ObjectId } from "mongodb";
import { DEFAULT_BOARD_ID } from "../shared/types/board";
import { Priority, TaskVisibility, TodoClient } from "../shared/types/todo";

export interface Todo {
    _id: ObjectId;
    boardId: string;
    text: string;
    done: boolean;
    focus: boolean;
    priority: Priority;
    visibility: TaskVisibility;
    ownerActorId: string | null;
    assigneeActorId: string | null;
    order?: number;
    createdAt: Date;
    updatedAt: Date;
    doneAt: Date | null;
    dueDate?: Date | null;
}

// Handle missing fields gracefully for existing documents (backward compatibility)
export function todoToClient(todo: Partial<Todo> & { _id: ObjectId; text: string; done: boolean; createdAt: Date; updatedAt: Date; doneAt: Date | null }): TodoClient {
    return {
        _id: todo._id.toHexString(),
        boardId: todo.boardId ?? DEFAULT_BOARD_ID,
        text: todo.text,
        done: todo.done,
        focus: todo.focus ?? false,
        priority: todo.priority ?? 'normal',
        visibility: todo.visibility ?? 'shared',
        ownerActorId: todo.ownerActorId ?? null,
        assigneeActorId: todo.assigneeActorId ?? null,
        order: todo.order,
        createdAt: todo.createdAt.toISOString(),
        updatedAt: todo.updatedAt.toISOString(),
        doneAt: todo.doneAt ? todo.doneAt.toISOString() : null,
        dueDate: todo.dueDate ? todo.dueDate.toISOString().slice(0, 10) : todo.dueDate ?? null,
    };
}
