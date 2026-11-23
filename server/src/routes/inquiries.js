import { Router } from 'express';
import { pool } from '../db.js';
import { HttpError } from '../errors.js';
import { STATUSES, STATUS_LABELS, canChangeStatus } from '../inquiryRules.js';
import { createInquirySchema, statusChangeSchema, parseBody, parseId } from '../validation.js';

const router = Router();

// Columns we send to the frontend. "AS" renames snake_case -> camelCase for JavaScript.
const FIELDS = `
  i.id, i.customer_name AS "customerName", i.contact, i.subject, i.description,
  i.status, i.version, i.owner_id AS "ownerId", u.name AS "ownerName",
  i.created_at AS "createdAt", i.updated_at AS "updatedAt"`;

// THE ACCESS RULE, in one place: managers see everything, staff only their own.
// Returns null if the inquiry doesn't exist OR isn't theirs (both become 404).
async function findInquiry(id, user) {
  const { rows } = await pool.query(
    `SELECT ${FIELDS}
       FROM inquiries i JOIN users u ON u.id = i.owner_id
      WHERE i.id = $1 AND ($2::text = 'manager' OR i.owner_id = $3)`,
    [id, user.role, user.id]
  );
  return rows[0] ?? null;
}

// Turns the database's "duplicate" error into a friendly 409
function throwIfDuplicate(err) {
  if (err.code === '23505' && err.constraint === 'inquiries_open_duplicate_idx') {
    throw new HttpError(409, 'An open inquiry with this contact and subject already exists', {
      code: 'DUPLICATE',
    });
  }
}

// GET /api/inquiries?status=new&q=kamal
router.get('/', async (req, res) => {
  const params = [req.user.role, req.user.id];
  const conditions = [`($1::text = 'manager' OR i.owner_id = $2)`]; // access rule

  const { status, q } = req.query;
  if (status) {
    if (!STATUSES.includes(status)) {
      throw new HttpError(400, 'Unknown status filter');
    }
    params.push(status);
    conditions.push(`i.status = $${params.length}`);
  }

  const search = typeof q === 'string' ? q.trim() : '';
  if (search) {
    params.push(`%${search}%`); // % = "anything before/after"
    const n = params.length;
    conditions.push(`(i.customer_name ILIKE $${n} OR i.contact ILIKE $${n} OR i.subject ILIKE $${n})`);
  }

  const { rows } = await pool.query(
    `SELECT ${FIELDS}
       FROM inquiries i JOIN users u ON u.id = i.owner_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY i.updated_at DESC
      LIMIT 200`,
    params
  );
  res.json({ inquiries: rows });
});

// POST /api/inquiries
router.post('/', async (req, res) => {
  const data = parseBody(createInquirySchema, req.body);

  try {
    const { rows } = await pool.query(
      `INSERT INTO inquiries (customer_name, contact, subject, description, owner_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [data.customerName, data.contact, data.subject, data.description, req.user.id]
    );
    const inquiry = await findInquiry(rows[0].id, req.user);
    res.status(201).json({ inquiry });
  } catch (err) {
    throwIfDuplicate(err);
    throw err; // any other error -> central error handler (500)
  }
});

// GET /api/inquiries/:id
router.get('/:id', async (req, res) => {
  const inquiry = await findInquiry(parseId(req.params.id), req.user);
  if (!inquiry) {
    throw new HttpError(404, 'Inquiry not found');
  }
  res.json({ inquiry });
});

// PATCH /api/inquiries/:id/status   body: { "status": "in_progress", "version": 1 }
router.patch('/:id/status', async (req, res) => {
  const id = parseId(req.params.id);
  const { status, version } = parseBody(statusChangeSchema, req.body);

  const current = await findInquiry(id, req.user);
  if (!current) {
    throw new HttpError(404, 'Inquiry not found');
  }

  // Two tabs: the page is showing an old version
  if (current.version !== version) {
    throw new HttpError(409, 'This inquiry was updated elsewhere. Showing the latest version.', {
      code: 'STALE',
      inquiry: current,
    });
  }

  if (!canChangeStatus(current.status, status)) {
    throw new HttpError(
      422,
      `Cannot change status from ${STATUS_LABELS[current.status]} to ${STATUS_LABELS[status]}`
    );
  }

  try {
    // "AND version = $3" makes this safe even if two saves happen at the same moment:
    // only the first one matches; the second updates 0 rows.
    const result = await pool.query(
      `UPDATE inquiries
          SET status = $1, version = version + 1, updated_at = NOW()
        WHERE id = $2 AND version = $3`,
      [status, id, version]
    );
    if (result.rowCount === 0) {
      throw new HttpError(409, 'This inquiry was updated elsewhere. Showing the latest version.', {
        code: 'STALE',
        inquiry: await findInquiry(id, req.user),
      });
    }
  } catch (err) {
    throwIfDuplicate(err); // reopening could clash with a newer open duplicate
    throw err;
  }

  res.json({ inquiry: await findInquiry(id, req.user) });
});

export default router;