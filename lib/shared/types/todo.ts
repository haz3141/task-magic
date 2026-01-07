/**
 * Client-safe Todo types.
 * These types have NO mongodb dependencies and are safe to import in client components.
 */

export type Priority = 'high' | 'normal' | 'low';
export type TaskVisibility = 'shared' | 'private';

// Client-safe version with string id
export interface TodoClient {
    _id: string;
    boardId: string;
    text: string;
    done: boolean;
    focus: boolean;
    priority: Priority;
    visibility: TaskVisibility;
    ownerActorId: string | null;
    assigneeActorId: string | null;
    order?: number;
    createdAt: string;
    updatedAt: string;
    doneAt: string | null;
}
