import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { connectDB } from './config/db.js';
import userRouter from './routes/userRoute.js';
import incomeRouter from './routes/incomeRoute.js';

const app = express();
const port = 4000;

//Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

//DB
connectDB();

//Routes
app.use("/api/user",userRouter)
app.use("/api/income",incomeRouter)

app.get("/",(req,res)=>{
    res.send("Api is working")
})

app.listen(port, () =>{
    console.log(`app is listening on http://localhost:${port}`)
})