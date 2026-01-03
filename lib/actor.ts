/**
 * Actor represents an identity. Today it is device-local; later it becomes an authenticated user.
 */

export interface Actor {
    id: string;          // UUID
    name: string;
    emoji: string;
    createdAt: string;   // ISO date string
}

// Client-safe version (same structure, but explicit for API consistency)
export interface ActorClient {
    id: string;
    name: string;
    emoji: string;
}

// localStorage key for actor identity
export const ACTOR_STORAGE_KEY = 'whiteboard.actor';

// Generate a stable UUID
export function generateActorId(): string {
    return crypto.randomUUID();
}

// Convert Actor to ActorClient
export function actorToClient(actor: Actor): ActorClient {
    return {
        id: actor.id,
        name: actor.name,
        emoji: actor.emoji,
    };
}
