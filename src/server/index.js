import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import tripRoutes        from './routes/trips.js';
import participantRoutes from './routes/participants.js';
import dashboardRoutes   from './routes/dashboard.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3001;

// CORS — allow all origins for simplicity in monolithic setup
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json({ limit: '1mb' }));

// Serve static files from dist/public (production build) - BEFORE API routes
const publicPath = join(__dirname, '..', '..', 'dist', 'public');
app.use(express.static(publicPath));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/trips',        tripRoutes);
app.use('/api/participants',  participantRoutes);

// Serve index.html for all non-API routes (SPA routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(join(publicPath, 'index.html'), (err) => {
    if (err) {
      // If dist doesn't exist, show helpful message
      res.status(404).json({ 
        error: 'Frontend not built', 
        message: 'Run "npm run build" to build the frontend' 
      });
    }
  });
});

// 404 and error handling for API routes
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`CampusSplit server running on http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
  console.log(`Frontend served from http://localhost:${PORT}`);
});

export default app;
