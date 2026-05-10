const express  = require('express');
const dotenv   = require('dotenv');
const cors     = require('cors');
const path     = require('path');
const connectDB = require('./config/db');

// ── Load env ──────────────────────────────────────────────
dotenv.config({ path: path.join(__dirname, '../.env') });

// ── DB ────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Security ──────────────────────────────────────────────
// Restrict CORS to same origin in production; open in dev
const isDev = process.env.NODE_ENV !== 'production';
app.use(cors({
  origin: isDev ? '*' : (process.env.CLIENT_URL || false),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

// Remove X-Powered-By header (avoid fingerprinting)
app.disable('x-powered-by');

// ── Body parsers ──────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// ── Static frontend ───────────────────────────────────────
app.use(express.static(path.join(__dirname, '../public')));

// ── API Routes ────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/posts',         require('./routes/posts'));
app.use('/api/notifications', require('./routes/notifications'));

// Health check
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', uptime: process.uptime() })
);

// ── SPA catch-alls ────────────────────────────────────────
app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '../public/splash.html'))
);

// Any HTML page request → serve that file if it exists, else login
app.get('*.html', (req, res) => {
  const filePath = path.join(__dirname, '../public', req.path);
  res.sendFile(filePath, (err) => {
    if (err) res.sendFile(path.join(__dirname, '../public/index.html'));
  });
});

// Fallback for non-API, non-file routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// ── Global error handler ──────────────────────────────────
// Catches any unhandled errors in route handlers
app.use((err, req, res, next) => {  // eslint-disable-line no-unused-vars
  console.error('Unhandled error:', err.message);
  const status = err.status || 500;
  res.status(status).json({
    message: isDev ? err.message : 'An unexpected error occurred.',
  });
});

// ── Handle unhandled promise rejections (prevent crash) ───
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

// ── Start ─────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
