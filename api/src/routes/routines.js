import { Router } from 'express'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

// GET /api/routines
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM routines WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId],
    )
    res.json(rows)
  } catch (err) {
    console.error('list routines:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/routines/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM routines WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId],
    )
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    console.error('get routine:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/routines
router.post('/', async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  try {
    const { rows } = await pool.query(
      'INSERT INTO routines (name, user_id) VALUES ($1, $2) RETURNING *',
      [name.trim(), req.userId],
    )
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('create routine:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/routines/:id
router.patch('/:id', async (req, res) => {
  const { name } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'Name required' })
  try {
    const { rows } = await pool.query(
      'UPDATE routines SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [name.trim(), req.params.id, req.userId],
    )
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    console.error('update routine:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/routines/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM routines WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId],
    )
    if (rowCount === 0) return res.status(404).json({ error: 'Not found' })
    res.json({ success: true })
  } catch (err) {
    console.error('delete routine:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
