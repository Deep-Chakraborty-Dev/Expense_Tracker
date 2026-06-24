import mongoose from "mongoose";
import { type } from './../node_modules/@types/whatwg-url/index.d';

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    }
});

const userModel = mongoose.model || mongoose.model("user",userSchema);
export default userModel; 