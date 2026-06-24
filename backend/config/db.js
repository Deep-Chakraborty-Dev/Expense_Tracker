import mongoose from "mongoose";

export const connectDB = async() =>{
    await mongoose.connect("mongodb+srv://iamdeepchakraborty19112000_db_user:eR9siNpnKiDzi9Cc@cluster0.9iagagh.mongodb.net/Expense")
    .then(() => console.log("DB CONNECTED"));
}