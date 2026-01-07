import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectToDatabase } from "@/lib/server/db/mongodb";
import { Todo, todoToClient } from "@/lib/server/todos";
import { TaskVisibility } from "@/lib/shared/types/todo";
import { isValidObjectId } from "@/lib/server/validate/objectId";
import { validatePriority, validateText } from "@/lib/shared/validate/text";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// Valid visibility values
const VALID_VISIBILITIES: readonly TaskVisibility[] = ['shared', 'private'] as const;

function validateVisibility(value: unknown): value is TaskVisibility {
    return typeof value === 'string' && VALID_VISIBILITIES.includes(value as TaskVisibility);
}

// PATCH /api/todos/[id] - Update todo (done, focus, priority, visibility, assigneeActorId)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        if (!isValidObjectId(id)) {
            return NextResponse.json({ error: "Invalid todo ID" }, { status: 400 });
        }

        const body = await request.json();
        const now = new Date();

        // Build update object dynamically based on provided fields
        const updateData: Partial<Todo> = {
            updatedAt: now,
        };

        // Handle done field
        if (typeof body.done === "boolean") {
            updateData.done = body.done;
            updateData.doneAt = body.done ? now : null;
        }

        // Handle focus field
        if (typeof body.focus === "boolean") {
            updateData.focus = body.focus;
        }

        // Handle priority field
        if (body.priority !== undefined && validatePriority(body.priority)) {
            updateData.priority = body.priority;
        }

        // Handle visibility field
        if (body.visibility !== undefined && validateVisibility(body.visibility)) {
            updateData.visibility = body.visibility;
        }

        // Handle assigneeActorId field (can be string or null)
        if (body.assigneeActorId !== undefined) {
            if (body.assigneeActorId === null || typeof body.assigneeActorId === 'string') {
                updateData.assigneeActorId = body.assigneeActorId;
            }
        }

        // Handle order field
        if (typeof body.order === 'number') {
            updateData.order = body.order;
        }

        // Handle text field
        if (body.text !== undefined) {
            const validation = validateText(body.text);
            if (!validation.valid) {
                return NextResponse.json({ error: validation.error }, { status: 400 });
            }
            updateData.text = validation.text;
        }

        // Ensure at least one field is being updated besides updatedAt
        if (Object.keys(updateData).length === 1) {
            return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection<Todo>("todos");

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
