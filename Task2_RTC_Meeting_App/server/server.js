require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const { protect } = require('./middlewares/authMiddleware');
const { upload, UPLOAD_DIR } = require('./utils/uploadConfig');
const handleSockets = require('./sockets/socketHandler');

connectDB();

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(express.json());

const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({ origin: allowedOrigins, credentials: true }));

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'RTC Meet API is running' });
});

app.use('/api/auth', authRoutes);

app.post('/upload', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file was uploaded' });
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  res.status(201).json({
    message: 'File uploaded successfully',
    fileUrl,
    fileName: req.file.originalname,
  });
});

app.use((err, _req, res, _next) => {
  if (err.name === 'MulterError' || err.message?.includes('File type not allowed')) {
    return res.status(400).json({ error: err.message });
  }
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.use('/uploads', express.static(UPLOAD_DIR));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

handleSockets(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT} — ${process.env.NODE_ENV || 'development'} mode`);
});
