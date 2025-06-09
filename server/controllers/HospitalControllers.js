import HospitalModel from "../models/HospitalModel.js"
import UserModel from "../models/UserModel.js";
import DocterModel from "../models/DocterModel.js";
//doctor-C
export async function createHospital(req, res) {
    try {
        const { name, phone, address, location, email, service } = req.body;
        
        // Validate required fields
        if (!name || !phone || !address || !email || !location) {
            return res.status(400).json({ message: "All required fields must be provided" });
        }

        // Check if hospital with same email exists
        const existingHospital = await HospitalModel.findOne({ email });
        if (existingHospital) {
            return res.status(400).json({ message: "Hospital with this email already exists" });
        }

        // Create hospital
        const hospital = await HospitalModel.create({
            name,
            phone,
            address,
            location,
            email,
            service: service || []
        });

        // Update user's hospitalId if user is provided
        if (req.user) {
            await UserModel.findByIdAndUpdate(req.user._id, { hospitalId: hospital._id });
        }

        res.status(201).json({
            message: "Hospital created successfully",
            hospital
        });
    } catch (err) {
        console.error("CreateHospital error:", err);
        res.status(500).json({
            message: "Error creating hospital",
            error: err.message
        });
    }
}
//patient-NP
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
//patient-Np
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
//hospital-C
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
//hospital-NN
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
//patient-C
export async function GetnearBy(req, res) {
    try {
        const { lat, lng } = req.params;
        const maxDistance = 10000; // 10km radius

        const hospitals = await HospitalModel.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: maxDistance
                }
            }
        })
        .populate({
            path: 'doctors',
            populate: {
                path: 'user',
                model: 'User',
                select: 'firstName lastName email'
            }
        })
        .select('-__v');

        // Transform the data to include complete doctor information
        const transformedHospitals = hospitals.map(hospital => ({
            ...hospital.toObject(),
            doctors: hospital.doctors.map(doctor => ({
                _id: doctor._id,
                name: `${doctor.user.firstName} ${doctor.user.lastName}`,
                specialization: doctor.specialization,
                experience: doctor.experience,
                consultationFee: doctor.consultationFee,
                languages: doctor.languages,
                bio: doctor.bio,
                availability: doctor.availability
            }))
        }));

        res.status(200).json({
            message: "Hospitals found",
            hospitals: transformedHospitals
        });
    } catch (err) {
        console.error("GetNearBy error:", err);
        res.status(500).json({
            message: "Error finding nearby hospitals",
            error: err.message
        });
    }
}
//hospital-C
export async function addDoctor(req, res) {
    try {
        const { userId } = req.params;
        const hospitalId = req.params.id;
        const hospital = await HospitalModel.findById(hospitalId);
        if (!hospital) {
            return res.status(404).json({
                message: "No hospital found"
            });
        }
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }
        if (user.role !== "doctor") {
            return res.status(400).json({
                message: "User is not a doctor"
            });
        }

        if (hospital.doctors.includes(userId)) {
            return res.status(400).json({
                message: "Doctor already exists in this hospital"
            });
        }
        hospital.doctors.push(userId);
        await hospital.save();
        user.hospitalId = hospitalId;
        await user.save();

        res.status(200).json({
            message: "Doctor added successfully to hospital",
            hospital: hospital,
            doctor: user
        });

    } catch (err) {
        console.error("AddDoctor error:", err);
        res.status(500).json({
            message: "Error adding doctor to hospital",
            error: err.message
        });
    }
}