import { z } from 'zod';
import { HttpError } from './errors.js';
import { STATUSES } from './inquiryRules.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;   // something@something.something
const PHONE_PATTERN = /^\+?[0-9\s-]{7,15}$/;          // e.g. 0771234567 or +94 77 123 4567

// A required text field: trims spaces, must not be empty, has a max length
function requiredText(label, max) {
  return z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or less`);
}

export const createInquirySchema = z.object({
  customerName: requiredText('Customer name', 100),
  contact: requiredText('Contact', 120).refine(
    (value) => EMAIL_PATTERN.test(value) || PHONE_PATTERN.test(value),
    'Enter a valid email address or phone number'
  ),
  subject: requiredText('Subject', 150),
  description: requiredText('Description', 2000),
});

export const statusChangeSchema = z.object({
  status: z.enum(STATUSES, { error: 'Status must be New, In Progress or Resolved' }),
  version: z.number({ error: 'Version is required' }).int().positive(),
});

// Checks req.body against a schema.
// Bad data -> 400 with a message PER FIELD, so the form can show each error next to its input.
export function parseBody(schema, body) {
  const result = schema.safeParse(body ?? {});
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] ?? 'form';
      fields[field] ??= issue.message; // keep the first message per field
    }
    throw new HttpError(400, 'Please fix the highlighted fields', { fields });
  }
  return result.data; // cleaned data (trimmed text)
}

// "/api/inquiries/abc" or "/api/inquiries/-5" -> 400 instead of a database error
export function parseId(raw) {
  if (!/^\d+$/.test(raw)) {
    throw new HttpError(400, 'Invalid inquiry ID');
  }
  const id = Number(raw);
  if (id < 1 || id > 2147483647) { // biggest number a PostgreSQL INTEGER can hold
    throw new HttpError(400, 'Invalid inquiry ID');
  }
  return id;
}