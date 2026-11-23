import { readFile } from 'node:fs/promises';
import bcrypt from 'bcryptjs';
import { pool } from '../src/db.js';

// Test-only password for the seeded accounts (written in the README)
const SEED_PASSWORD = 'Password123!';

async function main() {
  // 1. Run schema.sql to create the tables
  const schemaPath = new URL('../db/schema.sql', import.meta.url);
  const schema = await readFile(schemaPath, 'utf8');
  await pool.query(schema);
  console.log('✔ Tables created');

  // 2. Add test users (the password is hashed, never stored as plain text)
  const hash = await bcrypt.hash(SEED_PASSWORD, 10);
  await pool.query(
    `INSERT INTO users (name, email, password_hash, role) VALUES
       ('Nimal Perera',    'nimal@example.com',   $1, 'staff'),
       ('Ayesha Fernando', 'ayesha@example.com',  $1, 'staff'),
       ('Maya Silva',      'manager@example.com', $1, 'manager')`,
    [hash]
  );
  console.log('✔ Users added');

  // 3. Add a few sample inquiries so the list isn't empty
  await pool.query(
    `INSERT INTO inquiries (customer_name, contact, subject, description, status, owner_id) VALUES
       ('Kamal Jayasinghe', 'kamal@example.com', 'Delivery delay',
        'Order 1042 has not arrived after 5 days.', 'new',
        (SELECT id FROM users WHERE email = 'nimal@example.com')),
       ('Sara Ahmed', '0771234567', 'Wrong item received',
        'Received a blue mug instead of a black one.', 'in_progress',
        (SELECT id FROM users WHERE email = 'nimal@example.com')),
       ('Ravi Kumar', 'ravi@example.com', 'Refund request',
        'Wants a refund for a cancelled order.', 'resolved',
        (SELECT id FROM users WHERE email = 'ayesha@example.com'))`
  );
  console.log('✔ Sample inquiries added');
}

main()
  .catch((err) => {
    console.error('✖ Setup failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end()); // close connections so the script can exit