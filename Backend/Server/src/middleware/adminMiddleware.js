const jwt = require('jsonwebtoken');
const User = require('../models/user');
const redisClient = require('../config/redis');

//user middleware
const adminMiddleware = async (req, res, next)=>{

    try{

        const {token} = req.cookies;
        if(!token)
            throw new Error("Token is not present");

        const payload =  jwt.verify(token, process.env.JWT_KEY);

        const {_id, role} = payload;

        if(!_id)
            throw new Error("Invalid Toekn");

        if(role != 'admin')
            throw new Error("Invalid Token");

        const result = await User.findById(_id);

        if(!result)
            throw new Error("User Doesn't Exist");

        //check that user is present in redis block list or not

        const IsBlocked = await redisClient.exists(`token:${token}`);
        if(IsBlocked)
            throw new Error("Invalid Token");

        req.result = result;

        next();
    }
    catch(err){
        res.status(401).send("Error: "+err.message);
    }
}

module.exports = adminMiddleware