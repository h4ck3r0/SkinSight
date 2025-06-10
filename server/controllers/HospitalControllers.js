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
export const getHospitals = async (req, res) => {
    try {
        const hospitals = await HospitalModel.find({});
        res.status(200).json({
            message: "Hospitals retrieved successfully",
            hospitals
        });
    } catch (error) {
        console.error("Error getting hospitals:", error);
        res.status(500).json({ message: "Error getting hospitals" });
    }
};
//patient-Np
export const getHospital = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if the request is for 'getall'
        if (id === 'getall') {
            return getHospitals(req, res);
        }

        const hospital = await HospitalModel.findById(id);
        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found" });
        }
        res.status(200).json({
            message: "Hospital retrieved successfully",
            hospital
        });
    } catch (error) {
        console.error("Error getting hospital:", error);
        res.status(500).json({ message: "Error getting hospital" });
    }
};
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
export const GetnearBy = async (req, res) => {
    try {
        const { lat, lng } = req.params;
        
        // Validate coordinates
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        
        if (isNaN(latitude) || isNaN(longitude)) {
            return res.status(400).json({
                success: false,
                message: "Invalid coordinates provided"
            });
        }

        // Find hospitals within 10km using MongoDB's $near operator
        const hospitals = await HospitalModel.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: 10000 // 10km in meters
                }
            }
        }).populate({
            path: 'doctors',
            select: 'firstName lastName specialization experience consultationFee languages bio availability'
        });

        res.status(200).json({
            success: true,
            hospitals: hospitals
        });
    } catch (error) {
        console.error('Error finding nearby hospitals:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find nearby hospitals',
            error: error.message
        });
    }
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
}

function deg2rad(deg) {
    return deg * (Math.PI/180);
}

//hospital-C
export async function addDoctor(req, res) {
    try {
        const { id: hospitalId, userId } = req.params;
        console.log("Adding doctor to hospital:", { hospitalId, userId });

        // Find hospital and user
        const hospital = await HospitalModel.findById(hospitalId);
        const user = await UserModel.findById(userId);

        if (!hospital) {
            console.log("Hospital not found:", hospitalId);
            return res.status(404).json({ message: "Hospital not found" });
        }

        if (!user) {
            console.log("User not found:", userId);
            return res.status(404).json({ message: "User not found" });
        }

        // Verify user is a doctor
        if (user.role !== "doctor") {
            console.log("User is not a doctor:", userId);
            return res.status(400).json({ message: "User is not a doctor" });
        }

        // Check if doctor profile exists
        let doctorProfile = await DocterModel.findOne({ user: userId });
        
        if (!doctorProfile) {
            console.log("Creating new doctor profile for user:", userId);
            // Create a new doctor profile
            doctorProfile = await DocterModel.create({
                user: userId,
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

        // Check if doctor is already in hospital
        if (hospital.doctors.includes(doctorProfile._id)) {
            console.log("Doctor already in hospital:", doctorProfile._id);
            return res.status(400).json({ message: "Doctor already in hospital" });
        }

        // Add doctor to hospital
        hospital.doctors.push(doctorProfile._id);
        await hospital.save();

        // Update user's hospitalId
        user.hospitalId = hospitalId;
        await user.save();

        // Get populated hospital data
        const populatedHospital = await HospitalModel.findById(hospitalId)
            .populate({
                path: 'doctors',
                model: 'DoctorProfile',
                populate: {
                    path: 'user',
                    select: 'firstName lastName email'
                }
            });

        console.log("Successfully added doctor to hospital:", {
            hospitalId,
            doctorId: doctorProfile._id,
            userId
        });

        res.status(200).json({
            message: "Doctor added to hospital successfully",
            hospital: populatedHospital
        });

    } catch (err) {
        console.error("AddDoctor error:", err);
        res.status(500).json({
            message: "Error adding doctor to hospital",
            error: err.message
        });
    }
}
export async function cleanupInvalidDoctors(req, res) {
    try {
        const hospitals = await HospitalModel.find();
        let cleanedCount = 0;

        for (const hospital of hospitals) {
            const validDoctors = [];
            for (const doctorId of hospital.doctors) {
                const doctor = await DocterModel.findById(doctorId);
                if (doctor) {
                    validDoctors.push(doctorId);
                }
            }

            if (validDoctors.length !== hospital.doctors.length) {
                hospital.doctors = validDoctors;
                await hospital.save();
                cleanedCount++;
            }
        }

        res.status(200).json({
            message: `Cleaned up invalid doctor references in ${cleanedCount} hospitals`
        });
    } catch (err) {
        console.error("CleanupInvalidDoctors error:", err);
        res.status(500).json({
            message: "Error cleaning up invalid doctor references",
            error: err.message
        });
    }
}
export async function removeDoctor(req, res) {
    try {
        const { id, userId } = req.params;

        const hospital = await HospitalModel.findById(id);
        if (!hospital) {
            return res.status(404).json({ 
                success: false,
                message: "Hospital not found" 
            });
        }

        // Remove doctor from hospital's doctors array
        hospital.doctors = hospital.doctors.filter(docId => docId.toString() !== userId);
        await hospital.save();

        res.status(200).json({ 
            success: true,
            message: "Doctor removed from hospital successfully",
            data: hospital
        });
    } catch (error) {
        console.error("Error removing doctor:", error);
        res.status(500).json({ 
            success: false,
            message: "Error removing doctor from hospital",
            error: error.message 
        });
    }
}