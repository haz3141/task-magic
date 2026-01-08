/**
 * Server-side Board types and utilities.
 * Uses mongodb ObjectId/Db - must only be imported in server contexts.
 */

import { ObjectId, Db } from "mongodb";
import { BoardVisibility, BoardClient, DEFAULT_BOARD_ID, DEFAULT_BOARD_NAME } from "../shared/types/board";

export interface Board {
    _id: ObjectId;
    id: string;              // Stable string ID for references
    name: string;
    ownerActorId: string | null;
    visibility: BoardVisibility;
    createdAt: Date;
}

export interface BoardMemberDb {
    _id: ObjectId;
    boardId: string;
    actorId: string;
    role: 'owner' | 'member';
}

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
