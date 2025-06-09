import jwt from "jsonwebtoken"
import UserModel from "../models/UserModel.js";
import HospitalModel from "../models/HospitalModel.js";
import DocterModel from "../models/DocterModel.js";

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
              const userResponse = {
             _id: user._id,
             email: user.email,
             firstName: user.firstName,
             LastName: user.LastName,
             role: user.role,
             address: user.address,
             dob: user.dob,
             hospitalId: user.hospitalId
         };

         res.status(200).json({
             message:"User logged in successfully",
             token,
             user: userResponse
         });
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
            dob: user.dob,
            hospitalId: user.hospitalId
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

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = {
            _id: updatedUser._id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            role: updatedUser.role,
            address: updatedUser.address,
            dob: updatedUser.dob,
            hospitalId: updatedUser.hospitalId
        };

        res.status(200).json({
            message: "User updated successfully",
            user: userData
        });
    } catch (err) {
        console.error("UpdateMe error:", err);
        res.status(500).json({ 
            message: "Failed to update user",
            error: err.message 
        });
    }
}

export async function UpdateHospital(req, res) {
    try {
        const { id } = req.params;
        const { hospitalId } = req.body;

        // Find the user
        const user = await UserModel.findById(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify user is a doctor
        if (user.role !== "doctor") {
            return res.status(400).json({ message: "User is not a doctor" });
        }

        // Find the hospital
        const hospital = await HospitalModel.findById(hospitalId);
        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found" });
        }

        // Check if doctor profile exists, if not create one
        let doctorProfile = await DocterModel.findOne({ user: id });
        if (!doctorProfile) {
            console.log("Creating new doctor profile for user:", id);
            doctorProfile = await DocterModel.create({
                user: id,
                specialization: "General Medicine", // Default specialization
                qualifications: [],
                experience: 0,
                consultationFee: 500, // Default fee
                availability: [
                    {
                        day: "Monday",
                        startTime: "09:00",
                        endTime: "17:00",
                        isAvailable: true
                    },
                    {
                        day: "Tuesday",
                        startTime: "09:00",
                        endTime: "17:00",
                        isAvailable: true
                    }
                ],
                languages: ["English"],
                bio: "New doctor at " + hospital.name,
                address: user.address || "",
                location: hospital.location
            });
        }

        // Update user's hospitalId
        user.hospitalId = hospitalId;
        await user.save();

        // Add doctor to hospital's doctors array if not already there
        if (!hospital.doctors.includes(doctorProfile._id)) {
            hospital.doctors.push(doctorProfile._id);
            await hospital.save();
        }

        res.status(200).json({
            message: "Hospital updated successfully",
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.LastName,
                email: user.email,
                role: user.role,
                hospitalId: user.hospitalId
            }
        });

    } catch (err) {
        console.error("UpdateHospital error:", err);
        res.status(500).json({
            message: "Error updating hospital",
            error: err.message
        });
    }
}

export async function UpdateUserHospital(req, res) {
    try {
        const { hospitalId } = req.body;
        const userId = req.user._id;

        if (!hospitalId) {
            return res.status(400).json({
                message: "Hospital ID is required"
            });
        }

        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { $set: { hospitalId } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const userData = {
            _id: updatedUser._id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            role: updatedUser.role,
            address: updatedUser.address,
            dob: updatedUser.dob,
            hospitalId: updatedUser.hospitalId
        };

        res.status(200).json({
            message: "User's hospital updated successfully",
            user: userData
        });
    } catch (err) {
        console.error("UpdateUserHospital error:", err);
        res.status(500).json({
            message: "Failed to update user's hospital",
            error: err.message
        });
    }
}