import { ObjectId } from "mongodb";

export type Priority = 'high' | 'normal' | 'low';

export interface Todo {
    _id: ObjectId;
    text: string;
    done: boolean;
    focus: boolean;
    priority: Priority;
    createdAt: Date;
    updatedAt: Date;
    doneAt: Date | null;
}

// Client-safe version with string id
export interface TodoClient {
    _id: string;
    text: string;
    done: boolean;
    focus: boolean;
    priority: Priority;
    createdAt: string;
    updatedAt: string;
    doneAt: string | null;
}

// Handle missing fields gracefully for existing documents
export function todoToClient(todo: Partial<Todo> & { _id: ObjectId; text: string; done: boolean; createdAt: Date; updatedAt: Date; doneAt: Date | null }): TodoClient {
    return {
        _id: todo._id.toHexString(),
        text: todo.text,
        done: todo.done,
        focus: todo.focus ?? false,
        priority: todo.priority ?? 'normal',
        createdAt: todo.createdAt.toISOString(),
        updatedAt: todo.updatedAt.toISOString(),
        doneAt: todo.doneAt ? todo.doneAt.toISOString() : null,
    };
}
