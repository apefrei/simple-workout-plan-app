import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from './db.js'
import authRoutes from './routes/auth.js'
import routinesRoutes from './routes/routines.js'
import exercisesRoutes from './routes/exercises.js'
import workoutLogsRoutes from './routes/workoutLogs.js'
import uploadRoutes from './routes/upload.js'

dotenv.config()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = process.env.UPLOADS_DIR || '/app/uploads'

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is not set. Authentication will not work correctly.')
}

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet())
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || ['http://localhost:3000'],
  credentials: false,
}))
app.use(express.json({ limit: '100kb' }))

// Serve uploaded files
app.use('/api/uploads', express.static(UPLOADS_DIR))

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

// Broad limiter applied to all data routes (authenticated users, generous cap).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
})

// Routes — auth has a stricter limiter; all other API routes share apiLimiter.
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/routines', apiLimiter, routinesRoutes)
app.use('/api/exercises', apiLimiter, exercisesRoutes)
app.use('/api/workout-logs', apiLimiter, workoutLogsRoutes)
app.use('/api/upload', apiLimiter, uploadRoutes)

app.get('/health', apiLimiter, async (_req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'healthy', database: 'connected' })
  } catch {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' })
  }
})

app.get('/api', (_req, res) => {
  res.json({
    name: 'Workout Planner API',
    version: '1.0.0',
    endpoints: ['/health', '/api/auth', '/api/routines', '/api/exercises', '/api/workout-logs', '/api/upload'],
  })
})

process.on('SIGTERM', async () => {
  await pool.end()
  process.exit(0)
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`)
})
