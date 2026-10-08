import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { connectDB } from './config/db';
import authRoutes from './modules/auth/routes';
import meetingsRoutes from './modules/meetings/routes';
import { settingsRouter } from './modules/settings/routes';
import { globalLimiter } from './middleware/rateLimiter';

export const app = express();

connectDB();

app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Apply global rate limiting to all /api routes except auth/chat which have their own
app.use('/api', globalLimiter);

app.use('/api/auth', authRoutes); // Ensure auth routes use authLimiter internally or we apply it here
app.use('/api/meetings', meetingsRoutes);
app.use('/api/settings', settingsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});
