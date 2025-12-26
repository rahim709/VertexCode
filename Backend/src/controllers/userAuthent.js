const express = require('express');
const User = require("../models/user");
const validate = require("../utils/validator");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const redisClient = require('../config/redis');
const Submission = require('../models/submission');

//Register
const register= async (req, res)=>{

    try{
        // console.log("Hello");
        //validate the user
        validate(req.body);

        const {firstName, emailId, password} = req.body;
        
        //email already exists or not

        const ans = await User.exists({emailId});
        // if(ans) console.log("User exists");
        // else console.log("No such user");
        
        req.body.password = await bcrypt.hash(password,10);

        req.body.role = 'user';
        
        const user = await User.create(req.body);
        const token = jwt.sign({_id:user._id,emailId,role:user.role},process.env.JWT_KEY,{ expiresIn: '1h' })  //or 60*60
        
        const count = user.problemSolved.length;

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role,
            firstName:user.firstName,
            lastName: user.lastName,
            summary: user.summary,
            age: user.age,
            count: count
        };
        //console.log(user.role);
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 60 * 60 * 1000, // 1 hour
        });


        res.status(201).json({
            user:reply,
            message: "Loggin Successfully"
        })
    }
    catch(err){

        res.status(400).send("Error "+err);
    }
}

//login
const login = async(req, res)=>{

    try{
        const {emailId, password} = req.body;

        if(!emailId){
            throw new Error("Invalid Credentials");
        }
        if(!password){
            throw new Error("Invalid Credentials");
        }

        const user = await User.findOne({emailId});

        const match = await bcrypt.compare(password,user.password);
        if(!match)
            throw new Error("Invalid credentials");
        
        const solvedCount = (user.problemSolved && user.problemSolved.length) || 0;

        const reply = {
            firstName: user.firstName,
            emailId: user.emailId,
            _id: user._id,
            role: user.role,
            lastName: user.lastName,
            summary: user.summary,
            age: user.age,
            count: solvedCount
        };

        //console.log(user.role);

        const token = jwt.sign({_id:user._id,emailId,role:user.role},process.env.JWT_KEY,{ expiresIn: '1h' })  //or 60*60
        
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        res.status(201).json({
            user:reply,
            message: "Loggin Successfully"
        })
    }
    catch(err){
        res.status(401).send("Error: "+err);
    }
}


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

//update profile
// updateProfile
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