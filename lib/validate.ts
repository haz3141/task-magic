import { ObjectId } from "mongodb";

const MAX_TEXT_LENGTH = 200;

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
