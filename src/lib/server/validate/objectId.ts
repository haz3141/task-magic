/**
 * Server-side ObjectId validation.
 * Uses mongodb ObjectId - must only be imported in server contexts.
 */

import { ObjectId } from "mongodb";

export function isValidObjectId(id: string): boolean {
    return ObjectId.isValid(id) && new ObjectId(id).toHexString() === id;
}
