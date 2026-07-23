const express = require('express');
const User = require("../models/user");
const { validate, isStrongPassword } = require("../utils/validator");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const Submission = require('../models/submission');
const { sendOTPEmail, sendPasswordResetEmail } = require('../services/emailService');
const supabase = require('../config/supabase');

// Cookie options: secure only in production so local HTTP dev works
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 60 * 60 * 1000,
};

const uploadAvatarToSupabase = async (buffer, userId, mimetype) => {
  const ext = mimetype.split('/')[1] || 'png';
  const fileName = `avatar-${userId}-${Date.now()}.${ext}`;
  const filePath = `${userId}/${fileName}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, buffer, {
      contentType: mimetype,
      upsert: false
    });

  if (error) throw error;

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return data.publicUrl;
};

const extractSupabasePath = (avatarUrl) => {
  try {
    const url = new URL(avatarUrl);
    const pathParts = url.pathname.split('/storage/v1/object/public/avatars/');
    if (pathParts.length === 2) {
      return pathParts[1];
    }
  } catch (e) {
    console.error('Invalid avatar URL:', e.message);
  }
  return null;
};

const deleteAvatarFromSupabase = async (avatarUrl) => {
  const filePath = extractSupabasePath(avatarUrl);
  if (!filePath) return;

  const { error } = await supabase.storage
    .from('avatars')
    .remove([filePath]);

  if (error) {
    console.error('Failed to delete old avatar from Supabase:', error.message);
  }
};

const register = async (req, res) => {
  try {
    validate(req.body);

    const { firstName, emailId: rawEmail, password } = req.body;
    const emailId = rawEmail.toLowerCase();

    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists. Please login."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    const client = redisClient();
    const pendingKey = `pendingUser:${emailId}`;
    const otpKey = `otp:${emailId}`;

    await client.setEx(pendingKey, 300, JSON.stringify({
      firstName,
      emailId,
      password: hashedPassword,
      role: "user"
    }));

    await client.setEx(otpKey, 300, hashedOtp);

    await sendOTPEmail(emailId, otp);

    res.status(201).json({
      message: "OTP sent to your email. Please verify.",
      email: emailId
    });

  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Email already in use. Try again after a minute."
      });
    }
    res.status(400).json({ message: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { emailId: rawEmail, password } = req.body;
    const emailId = rawEmail.toLowerCase();

    if (!emailId || !password) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    if (!user.isVerified) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    
    const token = jwt.sign(
      { _id: user._id, emailId, role: user.role },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId,
        role: user.role,
        summary: user.summary,
        age: user.age,
        avatarUrl: user.avatarUrl,
        count: user.problemSolved.length,
        subscription: user.subscription,
      },
      message: "Login successful"
    });

  } catch (err) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

const logout = async(req, res)=>{

    try{
        const {token} = req.cookies;

        if(token){
            const payload = jwt.verify(token, process.env.JWT_KEY);

            // Blacklist token in Redis until its natural expiry
            const client = redisClient();
            if(client.isOpen){
                await client.set(`token:${token}`, 'Blocked');
                await client.expireAt(`token:${token}`, payload.exp);
            }
        }

        res.cookie("token", "", { ...cookieOptions, maxAge: 0 });
        res.status(200).json({ message: "Logged Out successfully" });

    }
    catch(err){
        res.status(503).json({ message: "Error: "+err.message });
    }
}

const adminRegister = async(req, res)=>{

    try{
        //console.log("Hello");
        validate(req.body);

        const {firstName, emailId: rawEmail, password} = req.body;
        const emailId = rawEmail.toLowerCase();
        
        // const ans = await User.exists({emailId});
        // if(ans) console.log("User exists");
        // else console.log("No such user");
        
        const hashedPassword = await bcrypt.hash(password,10);

        // Sanitize: only allow intended fields, force admin role
        const user = await User.create({
            firstName,
            emailId,
            password: hashedPassword,
            role: 'admin',
            isVerified: true
        });
        const token = jwt.sign({_id:user._id,emailId:user.emailId,role:user.role},process.env.JWT_KEY,{ expiresIn: '1h' })  //or 60*60
        
        res.cookie("token", token, cookieOptions);

        res.status(201).json({ message: "User Registered Successfully" });
    }
    catch(err){
        res.status(400).json({ message: "Error "+err.message });
    }

}

const deleteProfile = async(req, res)=>{

    try{

        const userId = req.result._id;

        await User.findByIdAndDelete(userId);

        // await Submission.deleteMany({userId});

        res.status(200).send('Deleted Successfully');


    }
    catch(err){
        res.status(500).json({ message: "Failed to delete profile" });
    }
}

const updateProfile = async (req, res) => {
  try {
    const userId = req.result._id;
    // console.log("User ID for profile update:", userId);
    const { firstName, lastName, age, summary, removeAvatar } = req.body;

    if (!firstName || firstName.trim().length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 chars" });
    }

    if (!lastName || lastName.trim().length < 3) {
      return res.status(400).json({ message: "Name must be at least 3 chars" });
    }

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updateFields = {
      firstName: firstName.trim(),
      lastName: lastName?.trim(),
      age,
      summary,
    };

    if (req.file) {
      // Remove old avatar from Supabase if exists
      if (existingUser.avatarUrl) {
        await deleteAvatarFromSupabase(existingUser.avatarUrl);
      }

      try {
        const avatarUrl = await uploadAvatarToSupabase(
          req.file.buffer,
          userId,
          req.file.mimetype
        );
        updateFields.avatarUrl = avatarUrl;
      } catch (uploadErr) {
        console.error('Supabase avatar upload error:', uploadErr);
        return res.status(500).json({ message: "Avatar upload failed", err: uploadErr.message });
      }
    }

    if (removeAvatar === 'true' || removeAvatar === true) {
      if (existingUser.avatarUrl) {
        await deleteAvatarFromSupabase(existingUser.avatarUrl);
      }
      updateFields.avatarUrl = '';
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      updateFields,
      { new: true, runValidators: true }
    ).select("-password"); // do not send password

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        ...updated.toObject(),
        count: updated.problemSolved?.length || 0
      },
    });

  } catch (err) {
    console.error('updateProfile error:', err);
    res.status(500).json({ message: "Internal Error", err: err.message });
  }
};

const deleteAvatar = async (req, res) => {
  try {
    const userId = req.result._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.avatarUrl) {
      await deleteAvatarFromSupabase(user.avatarUrl);
    }

    user.avatarUrl = '';
    await user.save();

    res.status(200).json({
      message: "Avatar removed successfully",
      user: {
        ...user.toObject(),
        count: user.problemSolved?.length || 0
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Internal Error", err: err.message });
  }
};


const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const emailId = email?.toLowerCase().trim();

    if (!emailId) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    const client = redisClient();
    const resetOtpKey = `resetOtp:${emailId}`;
    await client.setEx(resetOtpKey, 600, hashedOtp);

    await sendPasswordResetEmail(emailId, otp);

    res.status(200).json({ message: "Password reset code sent to your email" });
  } catch (err) {
    console.error("Request password reset error:", err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const emailId = email?.toLowerCase().trim();

    if (!emailId || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, code and new password are required" });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&)"
      });
    }

    const client = redisClient();
    const resetOtpKey = `resetOtp:${emailId}`;
    const hashedOtp = await client.get(resetOtpKey);

    if (!hashedOtp) {
      return res.status(400).json({ message: "Reset code expired. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(otp.trim(), hashedOtp);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid reset code" });
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await client.del(resetOtpKey);

    res.status(200).json({ message: "Password reset successful. Please login with your new password." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: err.message || "Internal server error" });
  }
};

module.exports = {register, login, logout, adminRegister, deleteProfile, updateProfile, deleteAvatar, requestPasswordReset, resetPassword};