import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/mongodb";
import { Todo, todoToClient } from "@/lib/types";
import { isValidObjectId } from "@/lib/validate";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PATCH /api/todos/[id] - Toggle done status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid todo ID" }, { status: 400 });
        }

        const body = await request.json();

        if (typeof body.done !== "boolean") {
            return NextResponse.json({ error: "done must be a boolean" }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection<Todo>("todos");

        const now = new Date();
        const updateData: Partial<Todo> = {
            done: body.done,
            updatedAt: now,
            doneAt: body.done ? now : null,
        };

        const result = await collection.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: updateData },
            { returnDocument: "after" }
        );

        if (!result) {
            return NextResponse.json({ error: "Todo not found" }, { status: 404 });
        }

        return NextResponse.json({ todo: todoToClient(result) });
    } catch (error) {
        console.error("PATCH /api/todos/[id] error:", error);
        return NextResponse.json({ error: "Failed to update todo" }, { status: 500 });
    }
}

// DELETE /api/todos/[id] - Delete a todo
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid todo ID" }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection<Todo>("todos");

        const result = await collection.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json({ error: "Todo not found" }, { status: 404 });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("DELETE /api/todos/[id] error:", error);
        return NextResponse.json({ error: "Failed to delete todo" }, { status: 500 });
    }
}
