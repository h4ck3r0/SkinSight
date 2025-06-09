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
        const hospitals = await HospitalModel.find()
            .populate({
                path: 'doctors',
                model: 'DoctorProfile',
                populate: {
                    path: 'user',
                    select: 'firstName lastName email'
                }
            });

        if(!hospitals){
            return res.status(404).json({message:"No hospitals found"});
        }

        // Transform the hospitals data
        const transformedHospitals = hospitals.map(hospital => {
            const transformedDoctors = hospital.doctors.map(doctor => ({
                _id: doctor._id,
                name: `${doctor.user.firstName} ${doctor.user.lastName}`,
                specialization: doctor.specialization,
                experience: doctor.experience,
                consultationFee: doctor.consultationFee,
                languages: doctor.languages,
                bio: doctor.bio,
                availability: doctor.availability
            }));

            return {
                ...hospital.toObject(),
                doctors: transformedDoctors
            };
        });

        res.status(200).json({
            message: "Hospitals found",
            hospitals: transformedHospitals
        });
    }catch(err){
        res.status(500).json({message:err.message});
    }
}
//patient-Np
export async function getHospital(req,res){
    try{
        const hospitalId = req.params.id;
        const hospital = await HospitalModel.findById(hospitalId)
            .populate({
                path: 'doctors',
                model: 'DoctorProfile',
                populate: {
                    path: 'user',
                    select: 'firstName lastName email'
                }
            });

        if(!hospital){
            return res.status(404).json({message:"No hospital found"});
        }

        // Transform the doctors data
        const transformedHospital = {
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
        };

        res.status(200).json({
            message: "Hospital found",
            hospital: transformedHospital
        });
       
    }catch(err){
        res.status(500).json({message:err.message});
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
        console.log("Received coordinates:", { lat, lng });
        
        const maxDistance = 10; // 10 kilometers

        // Convert coordinates to numbers and validate
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        
        console.log("Converted coordinates:", { latitude, longitude });

        if (isNaN(latitude) || isNaN(longitude)) {
            console.log("Invalid coordinates detected");
            return res.status(400).json({ message: "Invalid coordinates provided" });
        }

        // Validate coordinate ranges
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            console.log("Coordinates out of range:", { latitude, longitude });
            return res.status(400).json({ message: "Coordinates out of valid range" });
        }

        console.log("Querying with coordinates:", { latitude, longitude, maxDistance });

        // First find the hospitals
        const hospitals = await HospitalModel.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: maxDistance * 1000 // Convert km to meters
                }
            }
        });

        console.log("Found hospitals:", hospitals.length);
        console.log("Raw hospitals data:", JSON.stringify(hospitals, null, 2));

        // Then populate doctors for each hospital
        const populatedHospitals = await Promise.all(
            hospitals.map(async (hospital) => {
                console.log(`Populating doctors for hospital ${hospital._id}`);
                
                // Find all users with this hospitalId who are doctors
                const users = await UserModel.find({ 
                    hospitalId: hospital._id,
                    role: 'doctor'
                }).populate('hospitalId');

                console.log(`Found ${users.length} doctors for hospital ${hospital._id}`);

                // Get doctor profiles for these users
                const doctorProfiles = await DocterModel.find({
                    user: { $in: users.map(u => u._id) }
                }).populate('user', 'firstName lastName email');

                console.log(`Found ${doctorProfiles.length} doctor profiles`);

                const transformedDoctors = doctorProfiles.map(doctor => ({
                    _id: doctor._id,
                    name: `${doctor.user.firstName} ${doctor.user.lastName}`,
                    specialization: doctor.specialization,
                    experience: doctor.experience,
                    consultationFee: doctor.consultationFee,
                    languages: doctor.languages,
                    bio: doctor.bio,
                    availability: doctor.availability
                }));

                return {
                    ...hospital.toObject(),
                    doctors: transformedDoctors
                };
            })
        );

        console.log("Final transformed hospitals:", JSON.stringify(populatedHospitals, null, 2));

        res.status(200).json({ hospitals: populatedHospitals });
    } catch (error) {
        console.error("Error in GetnearBy:", error);
        res.status(500).json({ message: "Error finding nearby hospitals", error: error.message });
    }
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