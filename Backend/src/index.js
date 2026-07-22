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

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS: ' + origin));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Health check
app.get('/', (req, res) => {
  res.send('VertexCode API is running ');
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//  ENSURE DB + REDIS CONNECTED BEFORE ANY ROUTE
app.use(async (req, res, next) => {
  try {
    await connectDB();

    const redisClient = getRedisClient();
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }

    next();
  } catch (err) {
    console.error('Startup error:', err);
    res.status(500).json({ message: 'Server initialization failed' });
  }
});

app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);

module.exports = app;
