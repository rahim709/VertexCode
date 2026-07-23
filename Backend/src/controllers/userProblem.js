const {getLanguageById, submitBatch, submitToken} = require("../utils/problemUtility");
const Problem = require('../models/problem');
const User = require('../models/user');
const Submission = require("../models/submission");
const createProblem = async (req, res)=>{

    const {
        title,
        description, 
        difficulty, 
        tags, 
        visibleTestCases,
        hiddenTestCases,
        startCode,
        referenceSolution,
        problemCreator
    } = req.body;
    //we will not push that code directly in database because we don't know that solution is correct or not
    try{
        // for(const element of referenceSolution)
        for(const {language, completeCode} of referenceSolution){


            const languageId = getLanguageById(language);

            const submissions = visibleTestCases.map((testcase)=>({

                source_code: completeCode,
                language_id: languageId,
                stdin: testcase.input,
                expected_output: testcase.output

            }));

            const submitResult = await submitBatch(submissions);

            const resultToken = submitResult.map((value)=>  value.token);

            const testResult = await submitToken(resultToken);

            // console.log(testResult);

            for(const test of testResult){
                if(test.status_id == 4){
                    return res.status(400).send("Wrong Answer");
                }
                else if(test.status_id == 5){
                    return res.status(400).send("Time Limit Exceeded");
                }
                else if(test.status_id == 6){
                    return res.status(400).send("Compilation Error");
                }
                else if(test.status_id >=7){
                    return res.status(400).send("Error Occured");
                }
            }

        }


        await Problem.create({
            ...req.body,
            problemCreator: req.result._id
        })

        res.status(201).send("Problem Saved Successfully");
    }
    catch(err){
        const message = err.message || "";
        if (message.toLowerCase().includes("invalid api key")) {
            return res.status(503).json({
                message: "Judge0 API key is invalid. Please check your RapidAPI key configuration."
            });
        }
        res.status(400).send("Error "+err);
    }
}

const updateProblem = async(req, res)=>{

    const {id} = req.params;
    const {
        problemCreator,
        ...updateData
    } = req.body;
    const { referenceSolution, visibleTestCases } = updateData;
    try{
        if(!id){
            return res.status(400).send("Missing ID Field");
        }

        const DsaProblem = await Problem.findById(id);
        if(!DsaProblem)
            return res.status(400).send("ID is not present in server");


        // for(const element of referenceSolution)
        for(const {language, completeCode} of referenceSolution){


            const languageId = getLanguageById(language);

            const submissions = visibleTestCases.map((testcase)=>({

                source_code: completeCode,
                language_id: languageId,
                stdin: testcase.input,
                expected_output: testcase.output

            }));

            const submitResult = await submitBatch(submissions);

            const resultToken = submitResult.map((value)=>  value.token);

            const testResult = await submitToken(resultToken);

            for(const test of testResult){
                if(test.status_id == 4){
                    return res.status(400).send("Wrong Answer");
                }
                else if(test.status_id == 5){
                    return res.status(400).send("Time Limit Exceeded");
                }
                else if(test.status_id == 6){
                    return res.status(400).send("Compilation Error");
                }
                else if(test.status_id >=7){
                    return res.status(400).send("Error Occured");
                }
            }

        }


        // new:true means updated documents return krke dena
        const newProblem = await Problem.findByIdAndUpdate(id, updateData, {runValidators:true, new:true}); //runValidators means check all the edge cases when we created DB

        res.status(201).send(newProblem);
    }
    catch(err){
        console.error("UPDATE PROBLEM ERROR:", err);
        console.error("UPDATE PROBLEM STACK:", err.stack);
        const message = err.message || "";
        if (message.toLowerCase().includes("invalid api key")) {
            return res.status(503).json({
                message: "Judge0 API key is invalid. Please check your RapidAPI key configuration."
            });
        }
        res.status(500).json({ message: "Error: " + err.message });
    }
}

const deleteProblem = async(req, res)=>{
    const {id} = req.params;

    try{

        if(!id)
            return res.status(400).send("ID is Missing");

        const deletedProblem = await Problem.findByIdAndDelete(id);

        if(!deletedProblem)
            return res.status(404).send("Problem is Missing");

        res.status(200).send("Successfully Deleted");
    }
    catch(err){

        res.status(500).send("Error: "+err);
    }
}


const getProblemById = async(req, res)=>{

    const {id} = req.params;

    try{
        if(!id)
            return res.status(400).send("ID is Missing");

        let query = Problem.findById(id);
        if (req.result.role !== 'admin') {
            query = query.select('-hiddenTestCases -problemCreator -referenceSolution');
        }
        const getProblem = await query;

        if(!getProblem)
            return res.status(404).send("Problem is Missing");

        res.status(200).send(getProblem);
    }
    catch(err){
        res.status(500).send("Error: "+err);
    }
}

const getSolution = async(req, res)=>{

    const {id} = req.params;

    try{
        if(!id)
            return res.status(400).send("ID is Missing");

        const getProblem = await Problem.findById(id).select('title referenceSolution');

        if(!getProblem)
            return res.status(404).send("Problem is Missing");

        res.status(200).send({ referenceSolution: getProblem.referenceSolution });
    }
    catch(err){
        res.status(500).send("Error: "+err);
    }
}

const getAllProblem = async(req, res)=>{

    try{

        const getProblem =  await Problem.find({}).select('_id title  difficulty tags');

        if(!getProblem.length)
            return res.status(404).send("Problem is Missing");

        res.status(200).send(getProblem);
    }
    catch(err){
        res.status(500).send("Error: "+err);
    }
}

const solvedAllProblembyUser = async(req, res)=>{

    try{

        //const count = req.result.problemSolved.length;

        const userId = req.result._id;

        const user = await User.findById(userId).populate({
            path:"problemSolved",
            select:"_id title difficulty tags "
        });

        res.status(200).send(user.problemSolved);
    }
    catch(err){
        res.status(500).send("Error: "+err);
    }

}


const submittedProblem = async(req, res)=>{

    try{
        const userId = req.result._id;

        const problemId = req.params.pid;

        const ans = await Submission.find({userId,problemId});

        if(!ans.length)
            return res.status(200).send("No submission is present");

        res.status(200).send(ans);

    }
    catch(err){

        res.status(500).send("Internal Server Error");
    }
}

const recentSolved = async (req, res) => {
  try {
    const userId = req.result._id;

    const latest = await Submission.aggregate([
        { $match: { userId, status: "accepted" } },
        // Sort by newest first
        { $sort: { createdAt: -1 } },

        // Group by problemId -> keep first submission (latest)
        {
            $group: {
            _id: "$problemId",
            submissionId: { $first: "$_id" },
            title: { $first: "$title" },
            createdAt: { $first: "$createdAt" }
            }
        },
        { $sort: { createdAt: -1 } },
        // Limit to 5 unique problems
        { $limit: 6 }
    ]);

    // console.log(latest);
    if (!latest.length) return res.status(200).json([]);

    res.status(200).json(latest);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};


const correctSubmission = async (req, res) => {
  try {
    const userId = req.result._id;
    const acceptedQns = await Submission.aggregate([
      { $match: { userId, status: "accepted" } },

      // Sort so $first picks the latest
      { $sort: { createdAt: -1 } },

      {
        $group: {
          _id: "$problemId",
          submissionId: { $first: "$_id" },
          title: { $first: "$title" },
          difficulty: { $first: "$difficulty" },
          createdAt: { $first: "$createdAt" }
        }
      },

      { $sort: { createdAt: -1 } }
    ]);

    if (!acceptedQns.length)
      return res.status(200).json([]);

    res.status(200).json(acceptedQns);
  } catch (err) {
    res.status(500).send("Error: " + err);
  }
};

//const User = require('../models/user');

const getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.aggregate([
      // 1. Join with submissions
      {
        $lookup: {
          from: "submissions",
          localField: "_id",
          foreignField: "userId",
          as: "userSubmissions",
        },
      },

      // 2. Get UNIQUE accepted submissions (unique problemId)
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          avatarUrl: 1,
          createdAt: 1, //  required for tie-breaker
          uniqueAcceptedSubmissions: {
            $reduce: {
              input: {
                $filter: {
                  input: "$userSubmissions",
                  as: "sub",
                  cond: { $eq: ["$$sub.status", "accepted"] },
                },
              },
              initialValue: [],
              in: {
                $cond: [
                  { $in: ["$$this.problemId", "$$value.problemId"] },
                  "$$value",
                  { $concatArrays: ["$$value", ["$$this"]] },
                ],
              },
            },
          },
        },
      },

      // 3. Compute solvedCount and vertexScore
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          avatarUrl: 1,
          createdAt: 1,
          solvedCount: { $size: "$uniqueAcceptedSubmissions" },
          vertexScore: {
            $reduce: {
              input: "$uniqueAcceptedSubmissions",
              initialValue: 0,
              in: {
                $add: [
                  "$$value",
                  {
                    $switch: {
                      branches: [
                        { case: { $eq: ["$$this.difficulty", "easy"] }, then: 10 },
                        { case: { $eq: ["$$this.difficulty", "medium"] }, then: 30 },
                        { case: { $eq: ["$$this.difficulty", "hard"] }, then: 50 },
                      ],
                      default: 0,
                    },
                  },
                ],
              },
            },
          },
        },
      },

      // 4. FINAL SORT 
      {
        $sort: {
          vertexScore: -1,   // primary
          solvedCount: -1,   // secondary
          createdAt: 1,      // tertiary (earlier joined first)
        },
      },

      // 5. Limit leaderboard size
      { $limit: 100 },
    ]);

    res.status(200).json(leaderboard);
  } catch (err) {
    console.error("Leaderboard Error:", err);
    res.status(500).json({ error: err.message });
  }
};


module.exports = {createProblem, updateProblem, deleteProblem, getProblemById, getSolution, getAllProblem, solvedAllProblembyUser, submittedProblem, recentSolved, correctSubmission, getLeaderboard};










// status of code
// 1	In Queue
// 2	Processing
// 3	Accepted
// 4	Wrong Answer
// 5	Time Limit Exceeded
// 6	Compilation Error
// 7	Runtime Error (SIGSEGV)
// 8	Runtime Error (SIGXFSZ)
// 9	Runtime Error (SIGFPE)
// 10	Runtime Error (SIGABRT)
// 11	Runtime Error (SIGNZ)
// 12	Runtime Error (Other)
// 13	Internal Error
// 14	Exec Format Error














// Latest ID for each language
// C++       → 105
// JavaScript→ 102
// Java      → 91
