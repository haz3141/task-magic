/**
 * Client-safe Board types.
 * These types have NO mongodb dependencies and are safe to import in client components.
 */

export type BoardVisibility = 'shared' | 'private';
export type BoardMemberRole = 'owner' | 'member';

// Client-safe version
export interface BoardClient {
    id: string;
    name: string;
    ownerActorId: string | null;
    visibility: BoardVisibility;
    createdAt: string;
}

// Default board ID constant - used for the single "Home" board
export const DEFAULT_BOARD_ID = 'home';
export const DEFAULT_BOARD_NAME = 'Home';

// Board member for UI display (from API responses)
export interface BoardMember {
    actorId: string;
    emoji: string;
    name: string;
}
