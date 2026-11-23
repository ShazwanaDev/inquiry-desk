import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { HttpError } from '../errors.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

// POST /api/auth/login  -> check email + password, return a token
router.post('/login', async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    throw new HttpError(400, 'Email and password are required');
  }

  const { rows } = await pool.query(
    'SELECT id, name, email, role, password_hash FROM users WHERE email = $1',
    [email]
  );
  const user = rows[0];

  // Same message whether the email or the password is wrong,
  // so attackers can't find out which emails exist.
  const passwordOk = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!passwordOk) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const token = jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '8h' } // badge is valid for one work day
  );

  // Never send password_hash back!
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// GET /api/auth/me  -> "who am I?" (protected: needs a valid token)
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;