const jwt = require('jsonwebtoken');
const User = require('../models/user');
const getRedisClient = require('../config/redis');

const userMiddleware = async (req, res, next) => {
  try {
    const { token } = req.cookies;
    if (!token) {
      throw new Error("Token is not present");
    }

    const payload = jwt.verify(token, process.env.JWT_KEY);
    const { _id } = payload;

    if (!_id) {
      throw new Error("Invalid Token");
    }

    const result = await User.findById(_id);
    if (!result) {
      throw new Error("User doesn't exist");
    }

    const redisClient = getRedisClient();
    const isBlocked = await redisClient.exists(`token:${token}`);

    if (isBlocked === 1) {
      throw new Error("Invalid Token");
    }

    result.count = result.problemSolved?.length || 0;
    req.result = result;

    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    res.status(401).json({ message: err.message });
  }
};

module.exports = userMiddleware;
