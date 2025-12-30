import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Todo, todoToClient } from "@/lib/types";
import { validateText, validatePriority } from "@/lib/validate";

// GET /api/todos - List all todos sorted: open first (createdAt desc), then done (doneAt desc)
export async function GET() {
    try {
        const { db } = await connectToDatabase();
        const collection = db.collection<Todo>("todos");

        // Fetch all todos
        const todos = await collection.find({}).toArray();

        // Sort: open items first (newest first), done items after (newest-done first)
        const openTodos = todos
            .filter((t) => !t.done)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        const doneTodos = todos
            .filter((t) => t.done)
            .sort((a, b) => {
                const aTime = a.doneAt ? new Date(a.doneAt).getTime() : new Date(a.updatedAt).getTime();
                const bTime = b.doneAt ? new Date(b.doneAt).getTime() : new Date(b.updatedAt).getTime();
                return bTime - aTime;
            });

        const sortedTodos = [...openTodos, ...doneTodos];

        return NextResponse.json({ todos: sortedTodos.map(todoToClient) });
    } catch (error) {
        console.error("GET /api/todos error:", error);
        return NextResponse.json({ error: "Failed to fetch todos" }, { status: 500 });
    }
}

// POST /api/todos - Create a new todo
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validation = validateText(body.text);

        if (!validation.valid) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const { db } = await connectToDatabase();
        const collection = db.collection<Todo>("todos");

        const now = new Date();
        const newTodo: Omit<Todo, "_id"> = {
            text: validation.text,
            done: false,
            focus: typeof body.focus === 'boolean' ? body.focus : false,
            priority: validatePriority(body.priority) ? body.priority : 'normal',
            createdAt: now,
            updatedAt: now,
            doneAt: null,
        };

        const result = await collection.insertOne(newTodo as Todo);
        const todo: Todo = { _id: result.insertedId, ...newTodo };

        return NextResponse.json({ todo: todoToClient(todo) }, { status: 201 });
    } catch (error) {
        console.error("POST /api/todos error:", error);
        return NextResponse.json({ error: "Failed to create todo" }, { status: 500 });
    }
}
