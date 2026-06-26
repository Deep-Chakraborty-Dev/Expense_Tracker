import User from '../models/userModel.js'
import jwt from 'jsonwebtoken'

const JWT_SECRET = "your_jwt_secret_here";

export default async function authMiddleware(req,res,next) {
    const authHeader = req.headers.authorization;
    if(!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json(
            { success:false,
              message: 'Not authorized or token is missing' 
            });
    }
}