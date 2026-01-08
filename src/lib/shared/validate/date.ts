/**
 * Client-safe date validation utility.
 * No mongodb dependencies.
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validates that a value is a valid YYYY-MM-DD date string.
 */
export function validateDueDate(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    if (!DATE_REGEX.test(value)) return false;
    // Verify it parses to a valid date
    const d = new Date(value + 'T00:00:00');
    return !isNaN(d.getTime());
}
