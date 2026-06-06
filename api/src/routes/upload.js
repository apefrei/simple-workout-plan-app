import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.use(requireAuth)

const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || '/app/uploads')
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/gif', '.gif'],
  ['image/webp', '.webp'],
])

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(UPLOADS_DIR, req.userId)
    fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (_req, file, cb) => {
    const ext = ALLOWED_MIME.get(file.mimetype) || '.jpg'
    cb(null, `${Date.now()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed'))
    }
  },

})

// POST /api/upload — returns a public URL for the uploaded file
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

  const relativePath = `${req.userId}/${req.file.filename}`
  const publicUrl = `${process.env.API_PUBLIC_URL || ''}/api/uploads/${relativePath}`
  res.json({ url: publicUrl })
})

// DELETE /api/upload — deletes a file by its relative path
router.delete('/', (req, res) => {
  const { filePath } = req.body
  if (!filePath) return res.status(400).json({ error: 'filePath required' })

  // Resolve and verify the path stays within the user's own subdirectory
  const userDir = path.join(UPLOADS_DIR, req.userId)
  const fullPath = path.resolve(userDir, filePath.replace(/^[^/]+\//, ''))
  if (!fullPath.startsWith(userDir + path.sep) && fullPath !== userDir) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
    res.json({ success: true })
  } catch (err) {
    console.error('delete upload:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
