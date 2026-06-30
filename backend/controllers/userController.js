import User from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "expense_tracker_secret";
const TOKEN_EXPIRES = "24h";

const createToken = (userId) => {
    return jwt.sign(
        { id: userId },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRES }
    );
};

// Register User
export async function registerUser(req, res) {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required",
        });
    }

    if (!validator.isEmail(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email",
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters long",
        });
    }

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
        });

        // Generate token
        const token = createToken(user._id);

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
}

// Login User
export async function loginUser(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: "Email and password are required",
        });
    }

    try {
        // Find user
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Compare password
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Generate token
        const token = createToken(user._id);

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
}


//to get the user detail

export async function getCurrentUser(req,res) {
    try {
        const user = await User.findById(req.user.id).select("name email")
        if(!user){
            return res.status(404).json({
                success:false,
                message:"User not found"
            })
        }
        res.json({
            success:true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        })

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server error",
        });
    }
}


//to update a user profile
export async function updateProfile(req,res){
    const {name,email}=req.body;
    if(!name || !email || !validator.isEmail(email)){
        return res.status(404).json({
            success:false,
            message:"valid email or password is required"
        })

    }try {
        const exists = await User.findOne({email,_id:{$ne: req.user.id}})
        if(exists){
            return res.status(409).json({
                success:false,
                message:"email already exists"
            });
        }
        const user = await User.findByIdAndUpdate(
            req.user.id,
            {name,email},
            {new:true,runValidators:true,select:"name email"}
        );
        res.json({
            success:true,
            user
        })
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server error",
    });
    }

    }

//to change password
export async function updatePassword(req,res){
    const {currentPassword,newPassword}= req.body;
    if(!currentPassword || !newPassword || newPassword.length<8){
        return res.status(400).json({
            success:false,
            message:"wrong password or too short"
        });
    }
    try {
        const user = await User.findById(req.user.id).select("password")
        if(!user){
            return res.status(404).json({
                success:false,
                message:"user not found"
            });
        }

        const match = await bcrypt.compare(currentPassword,user.password);
        if(!match){
            return res.status(404).json({
                success:false,
                message:"current password is incorrect"
            });
        }
        user.password=await bcrypt.hash(newPassword,10);
        await user.save();
        res.json({
            success:true,
            message:"password changed"
        });
        
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Server error",
    });
    }
}