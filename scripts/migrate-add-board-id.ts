/**
 * Migration script: Add boardId, visibility, and actor fields to existing todos
 * 
 * Run with:
 *   source .env.local && npx tsx scripts/migrate-add-board-id.ts
 * 
 * Or set environment variables directly:
 *   MONGODB_URI="your-uri" npx tsx scripts/migrate-add-board-id.ts
 * 
 * This script:
 * - Sets boardId: 'home' on all todos that don't have it
 * - Sets visibility: 'shared' on all todos that don't have it
 * - Sets ownerActorId: null on all todos that don't have it
 * - Sets assigneeActorId: null on all todos that don't have it
 */

import { MongoClient } from "mongodb";

const DEFAULT_BOARD_ID = "home";

async function migrate() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || "whiteboard";

    if (!uri) {
        console.error("Error: MONGODB_URI environment variable is not set");
        console.error("Make sure .env.local exists with MONGODB_URI defined");
        process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    const client = await MongoClient.connect(uri);
    const db = client.db(dbName);
    const collection = db.collection("todos");

    try {
        // Find todos missing boardId
        const todosWithoutBoardId = await collection.countDocuments({
            boardId: { $exists: false }
        });

        console.log(`Found ${todosWithoutBoardId} todos without boardId`);

        if (todosWithoutBoardId > 0) {
            // Update all todos missing the new fields
            const result = await collection.updateMany(
                { boardId: { $exists: false } },
                {
                    $set: {
                        boardId: DEFAULT_BOARD_ID,
                        visibility: "shared",
                        ownerActorId: null,
                        assigneeActorId: null,
                    }
                }
            );

            console.log(`Updated ${result.modifiedCount} todos with new fields`);
        }

        // Also update any todos that have boardId but missing other fields
        const todosWithoutVisibility = await collection.countDocuments({
            boardId: { $exists: true },
            visibility: { $exists: false }
        });

        if (todosWithoutVisibility > 0) {
            const result = await collection.updateMany(
                {
                    boardId: { $exists: true },
                    visibility: { $exists: false }
                },
                {
                    $set: {
                        visibility: "shared",
                        ownerActorId: null,
                        assigneeActorId: null,
                    }
                }
            );
            console.log(`Updated ${result.modifiedCount} additional todos with visibility fields`);
        }

        console.log("Migration complete!");

        // Show summary
        const totalTodos = await collection.countDocuments({});
        const todosWithNewFields = await collection.countDocuments({
            boardId: { $exists: true },
            visibility: { $exists: true }
        });

        console.log(`\nSummary:`);
        console.log(`  Total todos: ${totalTodos}`);
        console.log(`  Todos with new fields: ${todosWithNewFields}`);

    } finally {
        await client.close();
        console.log("Connection closed");
    }
}

migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
