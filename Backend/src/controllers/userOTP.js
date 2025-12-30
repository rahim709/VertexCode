const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const sendOTPEmail = require('../services/emailService');

const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // Basic validation
    if (!userId || !otp) {
      return res.status(400).json({
        message: "UserId and OTP are required",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found or OTP expired",
      });
    }

    //  Already verified
    if (user.isVerified) {
      return res.status(400).json({
        message: "User already verified. Please login.",
      });
    }

    // OTP expiry check → DELETE USER
    if (!user.verificationExpiry || user.verificationExpiry < Date.now()) {
      await User.findByIdAndDelete(user._id);
      return res.status(400).json({
        message: "OTP expired. Please register again.",
      });
    }

    //  Compare OTP securely
    const isMatch = await bcrypt.compare(otp.trim(), user.verificationCode);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    //  Mark verified & clean OTP fields
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpiry = undefined;
    await user.save();

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
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 1000,
    });

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
    const { userId } = req.body;

    // 1. Validation
    if (!userId) {
      return res.status(400).json({ message: "UserId is required" });
    }

    // 2. Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found. Please register again." });
    }

    // 3. Check if already verified
    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified. Please login." });
    }

    // 4. Generate New OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // 5. Update User Record
    user.verificationCode = hashedOtp;
    user.verificationExpiry = Date.now() + 5 * 60 * 1000; // Reset 5-minute window
    await user.save();

    // 6. Send Email
    await sendOTPEmail(user.emailId, otp);

    res.status(200).json({
      message: "New OTP sent to your email."
    });

  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { resendOTP, verifyOTP };