import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { pool } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

function generateToken(userId, email) {
  return jwt.sign(
    { sub: userId, email, role: 'authenticated' },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: '8h' },
  )
}

async function verifyCaptcha(captchaToken) {
  if (!process.env.TURNSTILE_SECRET_KEY || !captchaToken) return true
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.TURNSTILE_SECRET_KEY, response: captchaToken }),
  })
  const data = await res.json()
  return data.success === true
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, captchaToken } = req.body
  if (!email || !password || typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Email and password (8–128 chars) required' })
  }

  if (!(await verifyCaptcha(captchaToken))) {
    return res.status(400).json({ error: 'Captcha validation failed' })
  }

  const emailTrimmed = email.trim()
  const emailNormalized = emailTrimmed.toLowerCase()

  try {
    const hashedPassword = await bcrypt.hash(password, 12)
    const result = await pool.query(
      'INSERT INTO users (email, email_normalized, encrypted_password) VALUES ($1, $2, $3) RETURNING id, email, created_at',
      [emailTrimmed, emailNormalized, hashedPassword],
    )
    const user = result.rows[0]
    const token = generateToken(user.id, user.email)
    res.status(201).json({ user: { id: user.id, email: user.email }, token })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' })
    }
    console.error('signup error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/signin
router.post('/signin', async (req, res) => {
  const { email, password, captchaToken } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  if (!(await verifyCaptcha(captchaToken))) {
    return res.status(400).json({ error: 'Captcha validation failed' })
  }

  const emailNormalized = email.trim().toLowerCase()

  try {
    const result = await pool.query(
      'SELECT id, email, encrypted_password FROM users WHERE email_normalized = $1',
      [emailNormalized],
    )
    const user = result.rows[0]
    if (!user || !(await bcrypt.compare(password, user.encrypted_password))) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = generateToken(user.id, user.email)
    res.json({ user: { id: user.id, email: user.email }, token })
  } catch (err) {
    console.error('signin error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/auth/me — returns a fresh token for the authenticated user
router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email FROM users WHERE id = $1', [req.userId])
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' })
    }
    const user = result.rows[0]
    const token = generateToken(user.id, user.email)
    res.json({ user: { id: user.id, email: user.email }, token })
  } catch (err) {
    console.error('me error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/signout — stateless; client discards the token
router.post('/signout', (_req, res) => {
  res.json({ success: true })
})

export default router
