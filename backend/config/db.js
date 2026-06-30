import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGO_URI;

        if (!mongoUri) {
            throw new Error("MONGO_URI is not set in the environment");
        }

        const conn = await mongoose.connect(mongoUri);
        console.log(`DB CONNECTED: ${conn.connection.host}`);
    } catch (error) {
        console.error("DB connection failed", error.message);
        process.exit(1);
    }
};