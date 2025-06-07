import jwt from "jsonwebtoken"
import UserModel from "../models/UserModel.js";
export async function SignUp(req,res){
    try{
      const {email,password,role,firstName,lastName,address,dob}=req.body;

      const isUserExist=await UserModel.findOne({email});

      if(isUserExist){
          res.status(400).json({message:"User already exist"});
          return;
      }
      const token=jwt.sign({email},process.env.JWT_SECRET,{expiresIn:"1h"});
      const user=await UserModel.create({email,password,role,firstName,lastName,address,dob});

      res.status(200).json({message:"User created successfully",token,user});

    }catch(err){
        res.status(500).json(err);
        console.log(err);
    } 
}

export async function SignIn(req,res){
    try{
         const {email,password}=req.body;
         const user=await UserModel.findOne({email,password});

         if(!user){
             res.status(400).json({message:"Invalid email or password"});
             return;
         }

         const token=jwt.sign({email},process.env.JWT_SECRET,{expiresIn:"1h"});
         res.status(200).json({message:"User logged in successfully",token,user});
    }catch(err){
        res.status(500).json(err);
        console.log(err);
    }
}

export async function SignOut(req,res){
    try{
        res.clearCookie("token");
        res.status(200).json({message:"User logged out successfully"});
    }catch(err){
        res.status(500).json(err);
        console.log(err);
    }
    
}

export async function GetMe(req, res) {
    try {
        const user = req.user;
        
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const userData = {
            _id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            address: user.address,
            dob: user.dob
        };

        res.status(200).json({
            message: "User fetched successfully",
            user: userData
        });
    } catch (err) {
        console.error("GetMe error:", err);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}

export async function UpdateMe(req, res) {
    try {
        const data = req.body;

        const updatedUser = await UserModel.findOneAndUpdate(
            { _id: req.user._id },
            { $set: data },
            { new: true } 
        );

        res.status(200).json(updatedUser); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update user' });
    }
}