import userModel from "../models/userModel";
import validator from 'validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = "your_jwt_secret_here";
const TOKEN_EXPIRES='24h'

const createToken = (userId) => {
    jwt.sign({id:userId},JWT_SECRET,{expiresIn:TOKEN_EXPIRES});
}

//Register an user
export async function registerUser(req,res){
    const {name,email,password} = req.body;
    if(!name || !email || !password){
        return res.status(400).json({
            success:false,
            message:"All fields are required"
        })
    }
    if(!validator.isEmail(email)){
        return res.status(400).json({
            success:false,
            message:"Invalid email"
        })
    }
    if(password.length<8){
        return res.status(400).json({
            success:false,
            message:"Password must be longer than 8 characters"
        })
    }
    try {
        if (await User.findOne({email})){
            return res.status(409).json({
                success:false,
                message:"User already exits"
            });
        }

        const hashed = await bcrypt.hash(password,10);
        const user = await User.create({name,email,password:hashed});
        const token = createToken(user._id)
    }
     catch (error) {
        
    }
}