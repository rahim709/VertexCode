const express = require('express')
const app = express();
require('dotenv').config();
const main = require("./config/db");
const redisClient = require("./config/redis");
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/userAuth');
const problemRouter = require('./routes/problemCreator');
const submitRouter = require('./routes/submit');
const cors = require('cors');


const allowedOrigins = [
  "http://localhost:5173", // dev
  "https://vertexcode-frontend.vercel.app" // production
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

//origin:'*' koi bhi host isko access kr skta h

app.use(express.json());
app.use(cookieParser());
app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission',submitRouter);


const InitalizeConnection = async()=>{
    try{

        await Promise.all([main(),redisClient.connect()]);
        console.log("DB Connected Successfully");

        app.listen(process.env.PORT, ()=>{
            console.log("Server listening at port number: "+process.env.PORT);
        })
    }
    catch(err){
        console.log("Error "+err);
    }
}

InitalizeConnection();
