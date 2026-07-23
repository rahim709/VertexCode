const express = require('express');
const problemRouter = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const userMiddleware = require('../middleware/userMiddleware');
const requireSubscription = require('../middleware/subscriptionMiddleware');
const {
    createProblem, 
    updateProblem, 
    deleteProblem, 
    getProblemById, 
    getSolution,
    getAllProblem, 
    solvedAllProblembyUser, 
    submittedProblem,recentSolved, 
    correctSubmission,getLeaderboard
} = require('../controllers/userProblem');


problemRouter.post('/create', adminMiddleware, createProblem);
problemRouter.put('/update/:id', adminMiddleware, updateProblem);
problemRouter.delete('/delete/:id', adminMiddleware, deleteProblem);



// // //user and admin will handle.
problemRouter.get('/problemById/:id',userMiddleware, getProblemById);
problemRouter.get('/solution/:id', userMiddleware, requireSubscription, getSolution);
problemRouter.get('/getAllProblem', userMiddleware, getAllProblem);
problemRouter.get('/problemSolvedByUser',userMiddleware, solvedAllProblembyUser);
problemRouter.get('/submittedProblem/:pid',userMiddleware,submittedProblem);

problemRouter.get('/recentSolved', userMiddleware, recentSolved);
problemRouter.get('/correctSubmission', userMiddleware, correctSubmission);
problemRouter.get('/getLeaderboard', userMiddleware, getLeaderboard);
module.exports = problemRouter;

