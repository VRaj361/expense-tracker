/**
 * Escapes special regex characters in user input to prevent ReDoS attacks
 * and NoSQL injection via $regex.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Strips potential NoSQL injection operators from an object.
 * Removes keys starting with $ from user-supplied data.
 */
export function sanitizeInput(obj: any): any {
  if (typeof obj !== 'object' || obj === null) return obj;

  if (Array.isArray(obj)) return obj.map(sanitizeInput);

  const clean: any = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$')) continue;
    clean[key] = sanitizeInput(obj[key]);
  }
  return clean;
}

/**
 * Sanitizes a string for safe HTML output (prevents XSS).
 */
export function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validates that a string is a valid MongoDB ObjectId.
 */
export function isValidObjectId(id: string): boolean {
  return /^[a-fA-F0-9]{24}$/.test(id);
}

/**
 * Allowed file extensions for uploads.
 */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_IMPORT_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
