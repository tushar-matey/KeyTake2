import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';

export const app = express();

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
