import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const auth = req.headers['authorization']
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const token = auth.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] })
    req.userId = payload.sub
    req.userEmail = payload.email
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
