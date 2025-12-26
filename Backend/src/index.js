const express = require('express');
const app = express();
require('dotenv').config();

const main = require("./config/db");
const redisClient = require("./config/redis");
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/userAuth');
const problemRouter = require('./routes/problemCreator');
const submitRouter = require('./routes/submit');
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:5174',
    'https://vertex-code-ycpu.vercel.app'
  ],
  credentials: true
}));

app.get('/', (req, res) => {
  res.send('VertexCode API is running 🚀');
});


app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:;"
  );
  next();
});


app.use(express.json());
app.use(cookieParser());

app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);

// 🔴 NO app.listen()

// Initialize DB + Redis ONCE
let isConnected = false;

const initializeConnection = async () => {
  if (isConnected) return;
  try {
    await Promise.all([main(), redisClient.connect()]);
    console.log("DB + Redis connected");
    isConnected = true;
  } catch (err) {
    console.error("Connection error:", err);
  }
};

initializeConnection();

// ✅ Export app (MANDATORY for Vercel)
module.exports = app;
