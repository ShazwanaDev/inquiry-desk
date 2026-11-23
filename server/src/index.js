import 'dotenv/config';
import { app } from './app.js';

// Fail fast: refuse to start without a secret, instead of failing strangely later
if (!process.env.JWT_SECRET) {
  console.error('✖ JWT_SECRET is missing in server/.env');
  process.exit(1);
}

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`✔ API running on http://localhost:${port}`);
});