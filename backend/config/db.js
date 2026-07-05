import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer;

export const connectDB = async () => {
    const mongoUri = process.env.MONGO_URI;

    try {
        await mongoose.connect(mongoUri || "mongodb://127.0.0.1:27017/expense_tracker", {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            bufferCommands: false,
        });
        console.log("DB CONNECTED");
    } catch (error) {
        if (!mongoUri) {
            try {
                memoryServer = await MongoMemoryServer.create();
                const fallbackUri = memoryServer.getUri();
                await mongoose.connect(fallbackUri, {
                    serverSelectionTimeoutMS: 10000,
                    socketTimeoutMS: 45000,
                    bufferCommands: false,
                });
                console.log("DB CONNECTED (in-memory fallback)");
            } catch (fallbackError) {
                console.error("DB CONNECTION FAILED:", fallbackError.message);
                throw fallbackError;
            }
        } else {
            console.error("DB CONNECTION FAILED:", error.message);
            throw error;
        }
    }
};