const express = require('express');
const app = express();
require('dotenv').config();

const connectDB = require('./config/db');
const getRedisClient = require('./config/redis');

const cookieParser = require('cookie-parser');
const cors = require('cors');

const authRouter = require('./routes/userAuth');
const problemRouter = require('./routes/problemCreator');
const submitRouter = require('./routes/submit');

app.use(cors({
  origin: [
    'http://localhost:5174',
    'https://vertex-code-api.vercel.app/'
  ],
  credentials: true
}));

// Health check
app.get('/', (req, res) => {
  res.send('VertexCode API is running 🚀');
});

// Security header (optional, safe)
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data:;"
  );
  next();
});

app.use(express.json());
app.use(cookieParser());

// 🔥 ENSURE DB + REDIS BEFORE ANY ROUTE
app.use(async (req, res, next) => {
  try {
    await connectDB();

    const redisClient = getRedisClient();
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    req.redis = redisClient; // optional: access in controllers
    next();
  } catch (err) {
    console.error('Startup error:', err);
    res.status(500).json({ message: 'Server initialization failed' });
  }
});

// ✅ ROUTES (NO /api)
app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);

// ❌ NO app.listen() on Vercel
module.exports = app;
