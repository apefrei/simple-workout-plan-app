import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// GET /api/workout-logs?exerciseIds=id1,id2,...
router.get('/', async (req, res) => {
  const { exerciseIds, exerciseId } = req.query

  // Support both single exerciseId and comma-separated exerciseIds
  const ids = exerciseIds
    ? String(exerciseIds).split(',').filter(Boolean)
    : exerciseId
      ? [String(exerciseId)]
      : []

  if (ids.length === 0) {
    return res.status(400).json({ error: 'exerciseIds or exerciseId required' })
  }

  try {
    const placeholders = ids.map((_, i) => `$${i + 2}`).join(',')
    const { rows } = await pool.query(
      `SELECT * FROM workout_logs
       WHERE user_id = $1 AND exercise_id IN (${placeholders})
       ORDER BY logged_at DESC`,
      [req.userId, ...ids],
    )
    res.json(rows)
  } catch (err) {
    console.error('list workout logs:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/workout-logs
router.post('/', async (req, res) => {
  const { exercise_id, weight_kg, reps, comment, logged_at } = req.body
  if (!exercise_id || weight_kg == null || reps == null) {
    return res.status(400).json({ error: 'exercise_id, weight_kg, reps required' })
  }

  // Verify exercise exists (user's routines only — exercises belong to routines owned by user)
  const { rows: owned } = await pool.query(
    `SELECT e.id FROM exercises e
     JOIN routines r ON r.id = e.routine_id
     WHERE e.id = $1 AND r.user_id = $2`,
    [exercise_id, req.userId],
  )
  if (owned.length === 0) return res.status(403).json({ error: 'Forbidden' })

  try {
    const { rows } = await pool.query(
      `INSERT INTO workout_logs (user_id, exercise_id, weight_kg, reps, comment, logged_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, exercise_id, weight_kg, reps, comment ?? null, logged_at ?? new Date().toISOString()],
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('create workout log:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
