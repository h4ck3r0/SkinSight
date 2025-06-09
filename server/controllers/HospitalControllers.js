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
                
                // Check if doctor profile exists
                const doctorProfile = await DocterModel.findById(hospital.doctors[0]);
                console.log("Doctor profile found:", doctorProfile ? "Yes" : "No");
                if (doctorProfile) {
                    console.log("Doctor profile details:", JSON.stringify(doctorProfile, null, 2));
                }

                const populatedHospital = await HospitalModel.findById(hospital._id)
                    .populate({
                        path: 'doctors',
                        model: 'DoctorProfile',
                        populate: {
                            path: 'user',
                            select: 'firstName lastName email'
                        }
                    });

                console.log(`Hospital ${hospital._id} doctors:`, populatedHospital.doctors);

                const transformedDoctors = populatedHospital.doctors.map(doctor => ({
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
                    ...populatedHospital.toObject(),
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
        const { userId } = req.params;
        const hospitalId = req.params.id;

        // First find the hospital
        const hospital = await HospitalModel.findById(hospitalId);
        if (!hospital) {
            return res.status(404).json({
                message: "No hospital found"
            });
        }

        // Find the user and verify they are a doctor
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

        // Find the doctor's profile
        const doctorProfile = await DocterModel.findOne({ user: userId });
        if (!doctorProfile) {
            return res.status(404).json({
                message: "Doctor profile not found"
            });
        }

        // Check if doctor is already in this hospital
        if (hospital.doctors.includes(doctorProfile._id)) {
            return res.status(400).json({
                message: "Doctor already exists in this hospital"
            });
        }

        // Add doctor to hospital
        hospital.doctors.push(doctorProfile._id);
        await hospital.save();

        // Update user's hospitalId
        user.hospitalId = hospitalId;
        await user.save();

        // Update doctor's hospital reference
        doctorProfile.hospital = hospitalId;
        await doctorProfile.save();

        // Get the populated hospital data
        const populatedHospital = await HospitalModel.findById(hospitalId)
            .populate({
                path: 'doctors',
                model: 'DoctorProfile',
                populate: {
                    path: 'user',
                    select: 'firstName lastName email'
                }
            });

        res.status(200).json({
            message: "Doctor added successfully to hospital",
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
                const doctorProfile = await DocterModel.findById(doctorId);
                if (doctorProfile) {
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
export async function createTestDoctor(req, res) {
    try {
        const hospitalId = req.params.id;
        const hospital = await HospitalModel.findById(hospitalId);
        
        if (!hospital) {
            return res.status(404).json({ message: "Hospital not found" });
        }

        // Create a test user
        const testUser = await UserModel.create({
            email: "testdoctor@example.com",
            password: "test123", // In production, this should be hashed
            role: "doctor",
            firstName: "John",
            LastName: "Doe",
            address: "123 Test St"
        });

        // Create a doctor profile
        const doctorProfile = await DocterModel.create({
            user: testUser._id,
            specialization: "General Medicine",
            qualifications: [{
                degree: "MBBS",
                institution: "Test Medical College",
                year: 2020
            }],
            experience: 3,
            consultationFee: 500,
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
            languages: ["English", "Hindi"],
            bio: "Experienced general physician with expertise in preventive care and chronic disease management.",
            address: "123 Test St",
            location: {
                type: "Point",
                coordinates: [77.5946, 12.9716]
            }
        });

        // Add doctor to hospital
        hospital.doctors.push(doctorProfile._id);
        await hospital.save();

        // Update user's hospitalId
        testUser.hospitalId = hospitalId;
        await testUser.save();

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

        res.status(200).json({
            message: "Test doctor created and added to hospital",
            hospital: populatedHospital
        });

    } catch (err) {
        console.error("CreateTestDoctor error:", err);
        res.status(500).json({
            message: "Error creating test doctor",
            error: err.message
        });
    }
}