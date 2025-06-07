import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/mycarebridge';

async function ConnectDb() {
    try {
        await mongoose.connect(MONGO_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to Database");
    } catch (err) {
        console.error("Database connection error:", err);
        process.exit(1); 
    }
}

export default ConnectDb;