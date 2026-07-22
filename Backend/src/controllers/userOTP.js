const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const redisClient = require('../config/redis');
const sendOTPEmail = require('../services/emailService');

// Cookie options: secure only in production so local HTTP dev works
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 60 * 60 * 1000,
};

const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const emailId = email?.toLowerCase();

    // Basic validation
    if (!emailId || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const client = redisClient();
    const pendingKey = `pendingUser:${emailId}`;
    const otpKey = `otp:${emailId}`;

    const pendingUserJson = await client.get(pendingKey);
    const hashedOtp = await client.get(otpKey);

    if (!pendingUserJson || !hashedOtp) {
      return res.status(400).json({
        message: "OTP expired. Please register again.",
      });
    }

    const pendingUser = JSON.parse(pendingUserJson);

    //  Compare OTP securely
    const isMatch = await bcrypt.compare(otp.trim(), hashedOtp);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    //  Create verified user in MongoDB
    const user = await User.create({
      firstName: pendingUser.firstName,
      emailId: pendingUser.emailId,
      password: pendingUser.password,
      isVerified: true,
      role: "user"
    });

    //  Delete Redis keys
    await client.del([pendingKey, otpKey]);

    //  Generate JWT AFTER verification
    const token = jwt.sign(
      {
        _id: user._id,
        emailId: user.emailId,
        role: user.role,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    //  Set secure cookie
    res.cookie("token", token, cookieOptions);

    //  Success response
    res.status(200).json({
      message: "Email verified successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId,
        role: user.role,
        summary: user.summary,
        age: user.age,
        count: user.problemSolved?.length || 0,
      },
    });

  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};

const resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const emailId = email?.toLowerCase();

    // 1. Validation
    if (!emailId) {
      return res.status(400).json({ message: "Email is required" });
    }

    // 2. Check if already verified in MongoDB
    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return res.status(400).json({ message: "User already verified. Please login." });
    }

    // 3. Find pending user in Redis
    const client = redisClient();
    const pendingKey = `pendingUser:${emailId}`;
    const otpKey = `otp:${emailId}`;

    const pendingUserJson = await client.get(pendingKey);
    if (!pendingUserJson) {
      return res.status(404).json({ message: "Registration session expired. Please register again." });
    }

    // 4. Generate New OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // 5. Update OTP in Redis
    await client.setEx(otpKey, 300, hashedOtp);

    // 6. Send Email
    const pendingUser = JSON.parse(pendingUserJson);
    await sendOTPEmail(pendingUser.emailId, otp);

    res.status(200).json({
      message: "New OTP sent to your email."
    });

  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { resendOTP, verifyOTP };