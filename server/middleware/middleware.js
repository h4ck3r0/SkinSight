import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import UserModel from "../models/UserModel.js";

export async function middleware(req, res, next) {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        
        if (!token) {
            return res.status(401).json({
                message: "Unauthorized - No token provided"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        if (!decoded || !decoded.email) {
            return res.status(401).json({
                message: "Unauthorized - Invalid token"
            });
        }
        const user = await UserModel.findOne({ email: decoded.email });
        
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized - User not found"
            });
        }
        req.user = user;
        next();

    } catch (error) {
        console.error("Middleware error:", error);
        return res.status(401).json({
            message: "Unauthorized - Invalid token"
        });
    }
}