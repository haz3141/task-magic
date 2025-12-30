import { ObjectId } from "mongodb";
import { Priority } from "./types";

const MAX_TEXT_LENGTH = 200;
const VALID_PRIORITIES: readonly Priority[] = ['high', 'normal', 'low'] as const;

export function validateText(text: unknown): { valid: true; text: string } | { valid: false; error: string } {
    if (typeof text !== "string") {
        return { valid: false, error: "Text must be a string" };
    }

    const trimmed = text.trim();

    if (trimmed.length === 0) {
        return { valid: false, error: "Text cannot be empty" };
    }

    if (trimmed.length > MAX_TEXT_LENGTH) {
        return { valid: false, error: `Text must be ${MAX_TEXT_LENGTH} characters or less` };
    }

    return { valid: true, text: trimmed };
}

export function isValidObjectId(id: string): boolean {
    return ObjectId.isValid(id) && new ObjectId(id).toHexString() === id;
}

export function validatePriority(priority: unknown): priority is Priority {
    return typeof priority === 'string' && VALID_PRIORITIES.includes(priority as Priority);
}

