import User from '../models/userModel.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'expense_tracker_secret';

export default async function authMiddleware(req,res,next) {
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json(
            { success:false,
              message: 'Not authorized or token is missing' 
            });
    }
    const token = authHeader.split(" ")[1];

    //verify token
    try {
        const payload = jwt.verify(token,JWT_SECRET);
        const user = await User.findById(payload.id).select("-password");
        if(!user){
            return res.status(401).json({
                success:false,
                message:"User not found"
            })
        }
        req.user = user;
        next();
    } catch (error) {
        console.error("JWT verification failed",error);
        return res.status(401).json({
            success:false,
            message:"Token invalid or expired"
        });
    }
}