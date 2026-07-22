const express = require('express');
const {register, login,logout, adminRegister, deleteProfile, updateProfile, deleteAvatar} = require("../controllers/userAuthent");
const authRouter = express.Router();
const userMiddleware = require("../middleware/userMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const {verifyOTP, resendOTP} = require("../controllers/userOTP");
const upload = require("../config/multer");

//Register
authRouter.post('/register', register);
authRouter.post('/verifyOTP', verifyOTP);
authRouter.post('/resendOTP', resendOTP);
authRouter.post('/login',login);
authRouter.post('/logout',userMiddleware,logout);
authRouter.post('/admin/register',adminMiddleware, adminRegister);
authRouter.delete('/deleteProfile',userMiddleware, deleteProfile);
authRouter.put('/updateProfile', userMiddleware, upload.single('avatar'), updateProfile);
authRouter.delete('/avatar', userMiddleware, deleteAvatar);

// check is user already loggedIn or SignUp
authRouter.get('/check', userMiddleware, (req,res) =>{
    
    const reply = {
        firstName: req.result.firstName,
        lastName: req.result.lastName,
        emailId: req.result.emailId,
        _id: req.result._id,
        role: req.result.role,
        summary: req.result.summary,
        age: req.result.age,
        avatarUrl: req.result.avatarUrl,
        count: req.result.count
    }
    //console.log(reply);
    // const reply = {
    //         firstName: user.firstName,
    //         emailId: user.emailId,
    //         _id: user._id,
    //         role: user.role,
    //         firstName:user.firstName,
    //         lastName: user.lastName,
    //         summary: user.summary,
    //         age: user.age
    //     };
    res.status(200).json({
        user: reply,
        message: "Valid User"
    });

})

module.exports = authRouter;