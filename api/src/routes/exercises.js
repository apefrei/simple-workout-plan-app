import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// Verify the user owns the routine that contains an exercise
async function userOwnsExercise(exerciseId, userId) {
  const { rows } = await pool.query(
    `SELECT e.id FROM exercises e
     JOIN routines r ON r.id = e.routine_id
     WHERE e.id = $1 AND r.user_id = $2`,
    [exerciseId, userId],
  )
  return rows.length > 0
}

// Verify the user owns the routine
async function userOwnsRoutine(routineId, userId) {
  const { rows } = await pool.query(
    'SELECT id FROM routines WHERE id = $1 AND user_id = $2',
    [routineId, userId],
  )
  return rows.length > 0
}

// GET /api/exercises?routineId=
router.get('/', async (req, res) => {
  const { routineId } = req.query
  if (!routineId) return res.status(400).json({ error: 'routineId required' })

  if (!(await userOwnsRoutine(routineId, req.userId))) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    const { rows } = await pool.query(
      'SELECT * FROM exercises WHERE routine_id = $1 ORDER BY sort_order ASC',
      [routineId],
    )
    res.json(rows)
  } catch (err) {
    console.error('list exercises:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/exercises
router.post('/', async (req, res) => {
  const { routine_id, name, muscle_group, machine_info, target_sets_reps, sort_order } = req.body
  if (!routine_id || !name?.trim() || !muscle_group) {
    return res.status(400).json({ error: 'routine_id, name, muscle_group required' })
  }

  if (!(await userOwnsRoutine(routine_id, req.userId))) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO exercises (routine_id, name, muscle_group, machine_info, target_sets_reps, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [routine_id, name.trim(), muscle_group, machine_info ?? null, target_sets_reps ?? null, sort_order ?? 0],
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('create exercise:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/exercises/reorder
router.post('/reorder', async (req, res) => {
  const { exerciseIds } = req.body
  if (!Array.isArray(exerciseIds) || exerciseIds.length === 0) {
    return res.status(400).json({ error: 'exerciseIds array required' })
  }
  if (exerciseIds.length > 500) {
    return res.status(400).json({ error: 'Too many exercise IDs' })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    for (let i = 0; i < exerciseIds.length; i++) {
      // Verify ownership for first entry (all should belong to same routine)
      await client.query(
        `UPDATE exercises e SET sort_order = $1
         FROM routines r
         WHERE e.id = $2 AND e.routine_id = r.id AND r.user_id = $3`,
        [i, exerciseIds[i], req.userId],
      )
    }
    await client.query('COMMIT')
    res.json({ success: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('reorder exercises:', err)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    client.release()
  }
})

// PATCH /api/exercises/:id
router.patch('/:id', async (req, res) => {
  if (!(await userOwnsExercise(req.params.id, req.userId))) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const allowed = ['name', 'muscle_group', 'machine_info', 'target_sets_reps', 'media_url', 'starting_weight_kg', 'sort_order']
  const updates = {}
  for (const key of allowed) {
    if (key in req.body) updates[key] = req.body[key]
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' })
  }

  const setClauses = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`)
  const values = [...Object.values(updates), req.params.id]

  try {
    const { rows } = await pool.query(
      `UPDATE exercises SET ${setClauses.join(', ')} WHERE id = $${values.length} RETURNING *`,
      values,
    )
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    console.error('update exercise:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/exercises/:id
router.delete('/:id', async (req, res) => {
  if (!(await userOwnsExercise(req.params.id, req.userId))) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    await pool.query('DELETE FROM exercises WHERE id = $1', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    console.error('delete exercise:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
