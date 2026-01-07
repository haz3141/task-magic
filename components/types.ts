// Shared types for UI components
// Re-exports from lib/types for convenience
export { type TodoClient, type TaskVisibility } from "@/lib/types";

// Board member interface (originally inline in app/page.tsx)
export interface BoardMember {
    actorId: string;
    emoji: string;
    name: string;
}
