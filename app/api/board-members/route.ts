import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server/db/mongodb";
import { DEFAULT_BOARD_ID } from "@/lib/shared/types/board";

interface BoardMemberDoc {
    boardId: string;
    actorId: string;
    emoji: string;
    name: string;
    createdAt: Date;
}

// GET /api/board-members - Get all board member emojis for the default board
export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection<BoardMemberDoc>("boardMembers");

        const members = await collection.find({ boardId: DEFAULT_BOARD_ID }).toArray();

        return NextResponse.json({
            members: members.map(m => ({
                actorId: m.actorId,
                emoji: m.emoji,
                name: m.name,
            }))
        });
    } catch (error) {
        console.error("GET /api/board-members error:", error);
        return NextResponse.json({ error: "Failed to fetch board members" }, { status: 500 });
    }
}

// POST /api/board-members - Register a new actor as a board member
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { actorId, emoji, name } = body;

        if (!actorId || typeof actorId !== 'string') {
            return NextResponse.json({ error: "actorId is required" }, { status: 400 });
        }
        if (!emoji || typeof emoji !== 'string') {
            return NextResponse.json({ error: "emoji is required" }, { status: 400 });
        }
        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: "name is required" }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection<BoardMemberDoc>("boardMembers");

        // Check if emoji is already in use for this board
        const existingEmoji = await collection.findOne({
            boardId: DEFAULT_BOARD_ID,
            emoji: emoji,
        });

        if (existingEmoji) {
            return NextResponse.json({ error: "Emoji already in use" }, { status: 409 });
        }

        // Check if actor is already a member
        const existingMember = await collection.findOne({
            boardId: DEFAULT_BOARD_ID,
            actorId: actorId,
        });

        if (existingMember) {
            return NextResponse.json({ error: "Actor already a board member" }, { status: 409 });
        }

        // Create new board member
        const newMember: BoardMemberDoc = {
            boardId: DEFAULT_BOARD_ID,
            actorId,
            emoji,
            name: name.trim(),
            createdAt: new Date(),
        };

        await collection.insertOne(newMember);

        return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
        console.error("POST /api/board-members error:", error);
        return NextResponse.json({ error: "Failed to register board member" }, { status: 500 });
    }
}
