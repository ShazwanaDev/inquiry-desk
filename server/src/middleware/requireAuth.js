import jwt from 'jsonwebtoken';
import { HttpError } from '../errors.js';

// Runs BEFORE protected routes. Lets the request through only with a valid token.
export function requireAuth(req, res, next) {
  const header = req.get('Authorization') ?? '';
  const [scheme, token] = header.split(' '); // "Bearer abc123" -> ["Bearer", "abc123"]

  if (scheme !== 'Bearer' || !token) {
    throw new HttpError(401, 'Please sign in to continue');
  }

  let payload;
  try {
    // Checks the signature AND the expiry time
    payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw new HttpError(401, 'Your session has expired. Please sign in again');
  }

  // Remember who is making this request, for the next functions to use
  req.user = { id: payload.id, name: payload.name, role: payload.role };
  next(); // pass the request on to the actual route
}