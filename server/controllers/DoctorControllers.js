import UserModel from "../models/UserModel.js";
import Appointment from "../models/AppointmentModel.js";
import DocterModel from "../models/DocterModel.js";
import HospitalModel from "../models/HospitalModel.js";

export async function createDoctorProfile(req, res) {
    try {
        const userId = req.user._id;
        const {
            specialization,
            qualifications,
            experience,
            consultationFee,
            availability,
            languages,
            bio,
            address,
            location
        } = req.body;
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.role !== "doctor") {
            return res.status(403).json({ message: "User is not a doctor" });
        }
        const existingProfile = await DocterModel.findOne({ user: userId });
        if (existingProfile) {
            return res.status(400).json({ message: "Doctor profile already exists" });
        }

        // Create doctor profile
        const doctorProfile = await DocterModel.create({
            user: userId,
            specialization,
            qualifications,
            experience,
            consultationFee,
            availability,
            languages,
            bio,
            address,
            location
        });

        res.status(201).json({
            message: "Doctor profile created successfully",
            doctor: doctorProfile
        });
    } catch (err) {
        console.error("CreateDoctorProfile error:", err);
        res.status(500).json({
            message: "Error creating doctor profile",
            error: err.message
        });
    }
}

// Get doctor profile with combined user and doctor info
export async function getDoctorProfile(req, res) {
    try {
        const userId = req.user._id;

        // Get user info
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const doctorProfile = await DocterModel.findOne({ user: userId });
        if (!doctorProfile) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }
        const doctorData = {
            user: {
                _id: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            },
            profile: doctorProfile
        };

        res.status(200).json({
            message: "Doctor profile retrieved successfully",
            doctor: doctorData
        });
    } catch (err) {
        console.error("GetDoctorProfile error:", err);
        res.status(500).json({
            message: "Error retrieving doctor profile",
            error: err.message
        });
    }
}
export async function updateDoctorProfile(req, res) {
    try {
        const userId = req.user._id;
        const updateData = req.body;

        // Check if user exists and is a doctor
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (user.role !== "doctor") {
            return res.status(403).json({ message: "User is not a doctor" });
        }

        // Update doctor profile
        const updatedProfile = await DocterModel.findOneAndUpdate(
            { user: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updatedProfile) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }

        res.status(200).json({
            message: "Doctor profile updated successfully",
            doctor: updatedProfile
        });
    } catch (err) {
        console.error("UpdateDoctorProfile error:", err);
        res.status(500).json({
            message: "Error updating doctor profile",
            error: err.message
        });
    }
}
export async function updateAvailability(req, res) {
    try {
        const userId = req.user._id;
        const { availability } = req.body;

        if (!availability || !Array.isArray(availability)) {
            return res.status(400).json({ message: "Invalid availability data" });
        }

        const updatedProfile = await DocterModel.findOneAndUpdate(
            { user: userId },
            { $set: { availability } },
            { new: true, runValidators: true }
        );

        if (!updatedProfile) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }

        res.status(200).json({
            message: "Availability updated successfully",
            availability: updatedProfile.availability
        });
    } catch (err) {
        console.error("UpdateAvailability error:", err);
        res.status(500).json({
            message: "Error updating availability",
            error: err.message
        });
    }
}

export async function getDoctorAppointments(req, res) {
    try {
        const userId = req.user._id;
        const appointments = await Appointment.find({ doctor: userId });
        if(!appointments) {
            return res.status(404).json({ message: "No appointments found" });
        }
        res.status(200).json({ appointments ,message:"Appointments retrieved successfully"});
    } catch (err) {
        console.error("GetDoctorAppointments error:", err);
        res.status(500).json({
            message: "Error retrieving appointments",
            error: err.message
        });
    }
}

export async function getNextAvailableSlot(req, res) {
    try {
        const userId = req.user._id;
        const { fromDate } = req.query;

        const doctorProfile = await DocterModel.findOne({ user: userId });
        if (!doctorProfile) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }

        const nextSlot = doctorProfile.getNextAvailableSlot(fromDate ? new Date(fromDate) : new Date());
        
        if (!nextSlot) {
            return res.status(404).json({ message: "No available slots found" });
        }

        res.status(200).json({
            message: "Next available slot found",
            nextSlot
        });
    } catch (err) {
        console.error("GetNextAvailableSlot error:", err);
        res.status(500).json({
            message: "Error finding next available slot",
            error: err.message
        });
    }
}

export async function deleteDoctorProfile(req, res) {
    try {
        const userId = req.user._id;

        const deletedProfile = await DocterModel.findOneAndDelete({ user: userId });
        if (!deletedProfile) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }
        res.status(200).json({
            message: "Doctor profile deleted successfully"
        });
    } catch (err) {
        console.error("DeleteDoctorProfile error:", err);
        res.status(500).json({
            message: "Error deleting doctor profile",
            error: err.message
        });
    }
}

export async function approveAppointment(req, res) {
    try {
        const appointmentId = req.params.appointmentId;
        console.log("Approving appointment:", appointmentId);

        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            { 
                status: "confirmed",
                approvalStatus: "approved"
            },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        res.status(200).json({ 
            message: "Appointment approved successfully",
            appointment 
        });
    } catch (err) {
        console.error("ApproveAppointment error:", err);
        res.status(500).json({
            message: "Error approving appointment",
            error: err.message
        });
    }
}

export async function getAllDoctors(req, res) {
    try {
        const doctors = await DocterModel.find()
            .populate({
                path: 'user',
                select: 'firstName lastName email hospitalId',
                populate: {
                    path: 'hospitalId',
                    model: 'HospitalProfile',
                    select: 'name address phone email service'
                }
            });

        const transformedDoctors = doctors.map(doctor => {
            // Get hospital data from user's hospitalId
            const hospitalData = doctor.user.hospitalId ? {
                _id: doctor.user.hospitalId._id,
                name: doctor.user.hospitalId.name,
                address: doctor.user.hospitalId.address,
                phone: doctor.user.hospitalId.phone,
                email: doctor.user.hospitalId.email,
                service: doctor.user.hospitalId.service
            } : null;

            return {
                _id: doctor._id,
                user: {
                    _id: doctor.user._id,
                    firstName: doctor.user.firstName,
                    lastName: doctor.user.lastName,
                    email: doctor.user.email,
                    hospitalId: doctor.user.hospitalId ? doctor.user.hospitalId._id : null
                },
                specialization: doctor.specialization,
                qualifications: doctor.qualifications,
                experience: doctor.experience,
                consultationFee: doctor.consultationFee,
                availability: doctor.availability,
                languages: doctor.languages,
                bio: doctor.bio,
                address: doctor.address,
                location: doctor.location,
                rating: doctor.rating,
                totalRatings: doctor.totalRatings,
                hospital: hospitalData
            };
        });

        res.status(200).json({
            message: "Doctors retrieved successfully",
            doctors: transformedDoctors
        });
    } catch (err) {
        console.error("GetAllDoctors error:", err);
        res.status(500).json({
            message: "Error retrieving doctors",
            error: err.message
        });
    }
}

export async function updateHospital(req, res) {
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
            message: "Hospital updated successfully",
            hospital: populatedHospital
        });

    } catch (err) {
        console.error("UpdateHospital error:", err);
        res.status(500).json({
            message: "Error updating hospital",
            error: err.message
        });
    }
}