import express from 'express';
import authRoutes from './routes/auth.js';
import inquiryRoutes from './routes/inquiries.js'; 
import { requireAuth } from './middleware/requireAuth.js'; 
import { HttpError } from './errors.js';

export const app = express();

app.use(express.json()); // read JSON request bodies into req.body

app.get('/api/health', (req, res) => res.json({ ok: true })); // "is the server alive?"
app.use('/api/auth', authRoutes);
app.use('/api/inquiries', requireAuth, inquiryRoutes);

// Any URL we don't know -> 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Central error handler: EVERY thrown error ends up here.
// Express knows it's an error handler because it has 4 parameters.
app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON' });
  }
  console.error(err); // real bug: log it for us...
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
  // ...but never send internal details (SQL, stack traces) to the user
});