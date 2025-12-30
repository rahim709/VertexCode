const express = require('express');
const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const Submission = require('../models/submission');
const sendOTPEmail = require('../services/emailService');

//Register
const register = async (req, res) => {
  try {
    validate(req.body);

    const { firstName, emailId, password } = req.body;

    //  Check existing user
    const existingUser = await User.findOne({ emailId });

    if (existingUser) {
      // Case 1: User exists but NOT verified then delete & allow re-register
      if (!existingUser.isVerified) {
        await User.deleteOne({ _id: existingUser._id });
      } else {
        //  Case 2: Already verified
        return res.status(400).json({
          message: "User already exists. Please login."
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    //  Create new user
    const user = await User.create({
      firstName,
      emailId,
      password: hashedPassword,
      verificationCode: hashedOtp,
      verificationExpiry: Date.now() + 5 * 60 * 1000, // 5 minutes, // TTL starts
      isVerified: false,
      role: "user"
    });

    //  Send OTP
    await sendOTPEmail(emailId, otp);

    res.status(201).json({
      message: "OTP sent to your email. Please verify.",
      userId: user._id
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
    const { emailId, password } = req.body;

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

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        emailId: user.emailId,
        role: user.role,
        summary: user.summary,
        age: user.age,
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

        const payload = jwt.decode(token);

        // await redisClient.set(`token:${token}`,'Blocked');
        // await redisClient.expireAt(`token:${token}`,payload.exp);
        //  after logout we will add that token it into blocklist  with the help of Redis
        //  Cookies ko clear kar dena hai

        res.cookie("token",null, {expires:new Date(Date.now())});
        res.send("Logged Out succesfully");

    }
    catch(err){
        res.status(503).send("Error: "+err);
    }
}

//AdminRegister
const adminRegister = async(req, res)=>{

    try{
        //console.log("Hello");
        //validate the user
        validate(req.body);

        const {firstName, emailId, password} = req.body;
        
        //email already exists or not
        // const ans = await User.exists({emailId});
        // if(ans) console.log("User exists");
        // else console.log("No such user");
        
        req.body.password = await bcrypt.hash(password,10);

        const user = await User.create(req.body);
        const token = jwt.sign({_id:user._id,emailId:user.emailId,role:user.role},process.env.JWT_KEY,{ expiresIn: '1h' })  //or 60*60
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        res.status(201).send("User Registered Successfully");
    }
    catch(err){
        res.status(400).send("Error "+err);
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
        res.status(500).send("Deleted Successfully");
    }
}

// update Profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.result._id;
    const { firstName, lastName, age, summary } = req.body;

    // Validate required
    if (!firstName || firstName.trim().length < 3) {
      return res.status(400).json({ msg: "Username must be at least 3 chars" });
    }

    if (!lastName || lastName.trim().length < 3) {
      return res.status(400).json({ msg: "Username must be at least 3 chars" });
    }
    
    const updated = await User.findByIdAndUpdate(
      userId,
      {
        firstName: firstName.trim(),
        lastName: lastName?.trim(),
        age,
        summary,
      },
      { new: true, runValidators: true }
    ).select("-password"); // do not send password

    // console.log(updated);
    res.status(200).json({
      msg: "Profile updated successfully",
      user: updated,
    });

  } catch (err) {
    res.status(500).json({ msg: "Internal Error", err });
  }
};


module.exports = {register, login, logout, adminRegister, deleteProfile, updateProfile};