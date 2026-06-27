import express from 'express';
import { registerUser,loginUser, getCurrentUser, updateProfile, updatePassword } from '../controllers/userController.js';
import authMiddleware from '../middleware/auth.js';


const userRouter = express.Router();

userRouter.post("/register",registerUser);
userRouter.post("/login",loginUser);

userRouter.get("/me",authMiddleware,getCurrentUser);
userRouter.get("/profile",authMiddleware,updateProfile);
userRouter.get("/password",authMiddleware,updatePassword);

export default userRouter;