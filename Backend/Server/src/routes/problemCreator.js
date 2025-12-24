const express = require('express');
const problemRouter = express.Router();
const adminMiddleware = require('../middleware/adminMiddleware');
const userMiddleware = require('../middleware/userMiddleware');
const {
    createProblem, 
    updateProblem, 
    deleteProblem, 
    getProblemById, 
    getAllProblem, 
    solvedAllProblembyUser, 
    submittedProblem,recentSolved, 
    correctSubmission,getLeaderboard
} = require('../controllers/userProblem');


//admin will handle
problemRouter.post('/create', adminMiddleware, createProblem);
problemRouter.put('/update/:id', adminMiddleware, updateProblem);
problemRouter.delete('/delete/:id', adminMiddleware, deleteProblem);



// // //user and admin will handle.
problemRouter.get('/problemById/:id',userMiddleware, getProblemById);
problemRouter.get('/getAllProblem', userMiddleware, getAllProblem);
problemRouter.get('/problemSolvedByUser',userMiddleware, solvedAllProblembyUser);
problemRouter.get('/submittedProblem/:pid',userMiddleware,submittedProblem);

//fetch 5 problem
problemRouter.get('/recentSolved', userMiddleware, recentSolved);
//fetch accepted questions
problemRouter.get('/correctSubmission', userMiddleware, correctSubmission);
// for leaderBoard
problemRouter.get('/getLeaderboard', userMiddleware, getLeaderboard);
module.exports = problemRouter;

