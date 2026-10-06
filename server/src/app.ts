import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { connectDB } from './config/db';
import authRoutes from './modules/auth/routes';
import meetingsRoutes from './modules/meetings/routes';

export const app = express();

connectDB();

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
