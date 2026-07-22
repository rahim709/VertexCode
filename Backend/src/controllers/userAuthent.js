const express = require('express');
const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const Submission = require('../models/submission');
const sendOTPEmail = require('../services/emailService');
const fs = require('fs');
const path = require('path');

// Cookie options: secure only in production so local HTTP dev works
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 60 * 60 * 1000,
};

//Register
const register = async (req, res) => {
  try {
    validate(req.body);

    const { firstName, emailId: rawEmail, password } = req.body;
    const emailId = rawEmail.toLowerCase();

    //  Check existing verified user
    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists. Please login."
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Store pending user data + OTP in Redis (overwrite if re-registering)
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

    //  Send OTP
    await sendOTPEmail(emailId, otp);

    res.status(201).json({
      message: "OTP sent to your email. Please verify.",
      email: emailId
    });

  } catch (err) {
    // Handle duplicate index just in case
    if (err.code === 11000) {
      return res.status(400).json({
        message: "Email already in use. Try again after a minute."
      });
    }
    res.status(400).json({ message: err.message });
  }
};

//login
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
        count: user.problemSolved.length
      },
      message: "Login successful"
    });

  } catch (err) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

//logout
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

//AdminRegister
const adminRegister = async(req, res)=>{

    try{
        //console.log("Hello");
        //validate the user
        validate(req.body);

        const {firstName, emailId: rawEmail, password} = req.body;
        const emailId = rawEmail.toLowerCase();
        
        //email already exists or not
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

//delete profile
const deleteProfile = async(req, res)=>{

    try{

        const userId = req.result._id;

        //delete user from userSchema
        await User.findByIdAndDelete(userId);

        //submission se bhi delete karna hai
        // await Submission.deleteMany({userId});

        res.status(200).send('Deleted Successfully');


    }
    catch(err){
        res.status(500).json({ message: "Failed to delete profile" });
    }
}

// update Profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.result._id;
    const { firstName, lastName, age, summary, removeAvatar } = req.body;

    // Validate required
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

    // Handle avatar file upload
    if (req.file) {
      // Remove old avatar if exists
      if (existingUser.avatarUrl) {
        const oldPath = path.join(__dirname, '../../', existingUser.avatarUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updateFields.avatarUrl = `/uploads/avatars/${req.file.filename}`;
    }

    // Handle avatar removal request
    if (removeAvatar === 'true' || removeAvatar === true) {
      if (existingUser.avatarUrl) {
        const oldPath = path.join(__dirname, '../../', existingUser.avatarUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
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
    res.status(500).json({ message: "Internal Error", err: err.message });
  }
};

// Delete avatar only
const deleteAvatar = async (req, res) => {
  try {
    const userId = req.result._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.avatarUrl) {
      const filePath = path.join(__dirname, '../../', user.avatarUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
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


module.exports = {register, login, logout, adminRegister, deleteProfile, updateProfile, deleteAvatar};