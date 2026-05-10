// server/middleware/upload.js
// Handles image and video file uploads via Multer
// Files are stored in public/uploads/ so the frontend can serve them directly

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ── Storage config ─────────────────────────────────────────
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // e.g.  media-1715300000000-abc123.jpg
    var uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e6);
    var ext = path.extname(file.originalname).toLowerCase();
    cb(null, 'media-' + uniqueSuffix + ext);
  },
});

// ── File type filter ───────────────────────────────────────
var ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'video/mp4', 'video/webm', 'video/quicktime',
];

function fileFilter(req, file, cb) {
  if (ALLOWED_MIME.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpg, png, gif, webp) and videos (mp4, webm, mov) are allowed.'), false);
  }
}

// ── Export configured multer instance ──────────────────────
// Max 50 MB per file; single field named "media"
var upload = multer({
  storage:  storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

module.exports = upload;
