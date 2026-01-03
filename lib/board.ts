import { ObjectId, Db } from "mongodb";

/**
 * Board represents a whiteboard. Today only one exists; later many can exist.
 */

export type BoardVisibility = 'shared' | 'private';
export type BoardMemberRole = 'owner' | 'member';

export interface Board {
    _id: ObjectId;
    id: string;              // Stable string ID for references
    name: string;
    ownerActorId: string | null;
    visibility: BoardVisibility;
    createdAt: Date;
}

export interface BoardMember {
    _id: ObjectId;
    boardId: string;
    actorId: string;
    role: BoardMemberRole;
}

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

/**
 * Initialize the default board if it doesn't exist.
 * This should be called on app startup / first API request.
 */
export async function initDefaultBoard(db: Db): Promise<Board> {
    const collection = db.collection<Board>("boards");

    // Check if default board exists
    const existing = await collection.findOne({ id: DEFAULT_BOARD_ID });
    if (existing) {
        return existing;
    }

    // Create default board
    const now = new Date();
    const defaultBoard: Omit<Board, "_id"> = {
        id: DEFAULT_BOARD_ID,
        name: DEFAULT_BOARD_NAME,
        ownerActorId: null,
        visibility: 'shared',
        createdAt: now,
    };

    const result = await collection.insertOne(defaultBoard as Board);
    return { _id: result.insertedId, ...defaultBoard };
}

// Convert Board to BoardClient
export function boardToClient(board: Board): BoardClient {
    return {
        id: board.id,
        name: board.name,
        ownerActorId: board.ownerActorId,
        visibility: board.visibility,
        createdAt: board.createdAt.toISOString(),
    };
}
