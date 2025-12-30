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
    'http://localhost:5173',
    'https://app-vertex-code.vercel.app'
  ],
  credentials: true
}));

// Health check
app.get('/', (req, res) => {
  res.send('VertexCode API is running ');
});


app.use(express.json());
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
