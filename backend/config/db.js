import mongoose from "mongoose";

export const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/expense_tracker";

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("DB CONNECTED");
    } catch (error) {
        console.error("DB CONNECTION FAILED:", error.message);
    }
};