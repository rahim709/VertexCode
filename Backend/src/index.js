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

const allowedOrigins = [
  "http://localhost:5173",
  "https://vertex-code-henna.vercel.appp"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);

// Connect database + redis when serverless loads
(async () => {
  try {
    await Promise.all([main(), redisClient.connect()]);
    console.log("DB Connected Successfully");
  } catch (err) {
    console.log("Error " + err);
  }
})();

// ❌ No app.listen()
// ✔ Export the app for Vercel serverless
module.exports = app;
