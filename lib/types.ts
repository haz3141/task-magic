import { ObjectId } from "mongodb";

export interface Todo {
    _id: ObjectId;
    text: string;
    done: boolean;
    createdAt: Date;
    updatedAt: Date;
    doneAt: Date | null;
}

// Client-safe version with string id
export interface TodoClient {
    _id: string;
    text: string;
    done: boolean;
    createdAt: string;
    updatedAt: string;
    doneAt: string | null;
}

export function todoToClient(todo: Todo): TodoClient {
    return {
        _id: todo._id.toHexString(),
        text: todo.text,
        done: todo.done,
        createdAt: todo.createdAt.toISOString(),
        updatedAt: todo.updatedAt.toISOString(),
        doneAt: todo.doneAt ? todo.doneAt.toISOString() : null,
    };
}
