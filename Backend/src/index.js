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
const paymentRouter = require('./routes/payment');
const { stripeWebhook } = require('./controllers/paymentController');

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

const isAllowedOrigin = (origin) => {
  if (!origin) return true; 
  if (allowedOrigins.includes(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  return false;
};

app.use(cors({
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.get('/', (req, res) => {
  res.send('VertexCode API is running ');
});

// Stripe webhook needs raw body — must be before express.json()
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
app.use('/api/payments', paymentRouter);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error'
  });
});

module.exports = app;