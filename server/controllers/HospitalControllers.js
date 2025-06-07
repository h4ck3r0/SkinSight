import HospitalModel from "../models/HospitalModel.js"
import UserModel from "../models/UserModel.js";
export async function createHospital(req,res){
    try{
        const {name,phone,address,location,email,service}=req.body;
        const Check=await HospitalModel.findOne({email:email})
        if(Check){
            res.status(400).json({message:"Hospital already exists"})
        }
       const hospital= await HospitalModel.create({name,phone,address,location,email,service})
        res.status(200).json({message:"Hospital created successfully",hospital})
    }catch(err){
        res.status(500).json({message:err.message})

    }
}

export async function getHospitals(req,res){
    try{
        const hospitals=await HospitalModel.find()
        if(!hospitals){
            res.status(404).json({message:"No hospitals found"})
        }
        res.status(200).json({message:"Hospitals found",hospitals})
    }catch(err){
        res.status(500).json({message:err.message})
    }
}

export async function getHospital(req,res){
    try{
        const hospitalId=req.params.id;
        const hospital=await HospitalModel.findById(hospitalId)
        if(!hospital){
            res.status(404).json({message:"No hospital found"})
        }
        res.status(200).json({message:"Hospital found",hospital})
       
    }catch(err){
        res.status(500).json({message:err.message})
    }
}

export async function updateHospital(req,res){
     try{
       const data=req.body;
       const hospitalId=req.params.id;
       const updatedhospital=await HospitalModel.findByIdAndUpdate({
        _id:hospitalId
       },{$set:data},{new:true}) 
       res.status(200).json({message:"Hospital updated",updatedhospital
       },{new:true}) 
     }catch(err){
        res.status(500).json({message:err.message})
     }
}

export async function deleteHospital(req,res){
    try{
        const hospitalId=req.params.id;
        const deletedhospital=await HospitalModel.findByIdAndDelete(hospitalId)
        if(!deletedhospital){
            res.status(404).json({message:"No hospital found"})
        }
        res.status(200).json({message:"Hospital deleted",deletedhospital})
    }catch(err){
        res.status(500).json({message:err.message})

    }
}

export async function GetnearBy(req, res) {
    try {
        const { lat, long } = req.params;
        const latitude = parseFloat(lat);
        const longitude = parseFloat(long);

        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                message: "Invalid coordinates provided"
            });
        }
        const hospitals = await HospitalModel.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [latitude, longitude]
                    },
                    $maxDistance: 10000
                }
            }
        });

        if (!hospitals || hospitals.length === 0) {
            return res.status(404).json({
                message: "No hospitals found within the specified radius"
            });
        }

        res.status(200).json({
            message: "Hospitals found",
            hospitals: hospitals
        });

    } catch (err) {
        console.error("GetnearBy error:", err);
        res.status(500).json({
            message: "Error finding nearby hospitals",
            error: err.message
        });
    }
}

export async function addDoctor(req, res) {
    try {
        const { doctorId } = req.params;
        const hospitalId = req.params.id;
        const hospital = await HospitalModel.findById(hospitalId);
        if (!hospital) {
            return res.status(404).json({
                message: "No hospital found"
            });
        }

        if (hospital.doctors.includes(doctorId)) {
            return res.status(400).json({
                message: "Doctor already exists in this hospital"
            });
        }
        const isdoctor = await UserModel.findById(doctorId);
        if (isdoctor.role !== "doctor") {
            return res.status(404).json({
                message: "No doctor found"
            });
        }

        hospital.doctors.push(doctorId);
        await hospital.save();

        res.status(200).json({
            message: "Doctor added successfully",
            hospital: hospital
        });

    } catch (err) {
        console.error("AddDoctor error:", err);
        res.status(500).json({
            message: "Error adding doctor to hospital",
            error: err.message
        });
    }
}