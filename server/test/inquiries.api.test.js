import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db.js';

// Needs the seeded test data: run "npm run db:setup" first.
let nimalToken;
let ayeshaInquiryId;

before(async () => {
  // Log in as Nimal (staff)
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: 'nimal@example.com', password: 'Password123!' });
  assert.equal(login.status, 200);
  nimalToken = login.body.token;

  // Find an inquiry that belongs to Ayesha (not Nimal)
  const { rows } = await pool.query(
    `SELECT i.id FROM inquiries i JOIN users u ON u.id = i.owner_id
      WHERE u.email = 'ayesha@example.com' LIMIT 1`
  );
  ayeshaInquiryId = rows[0].id;
});

after(() => pool.end()); // close DB connections so the test run can finish

test('rejects requests without a token (401)', async () => {
  const res = await request(app).get('/api/inquiries');
  assert.equal(res.status, 401);
});

test("staff cannot open another staff member's inquiry by direct link (404)", async () => {
  const res = await request(app)
    .get(`/api/inquiries/${ayeshaInquiryId}`)
    .set('Authorization', `Bearer ${nimalToken}`);
  assert.equal(res.status, 404);
  assert.equal(res.body.error, 'Inquiry not found');
});

test('API rejects missing or invalid fields even without the UI (400)', async () => {
  const res = await request(app)
    .post('/api/inquiries')
    .set('Authorization', `Bearer ${nimalToken}`)
    .send({ customerName: '   ', contact: 'not-a-contact' });
  assert.equal(res.status, 400);
  assert.equal(res.body.details.fields.customerName, 'Customer name is required');
  assert.equal(res.body.details.fields.contact, 'Enter a valid email address or phone number');
  assert.ok(res.body.details.fields.subject); // subject missing -> has an error message
});