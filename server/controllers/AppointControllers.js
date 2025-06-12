import Appointment from "../models/AppointmentModel.js";
import DocterModel from "../models/DocterModel.js";
//patient
export async function createAppointment(req, res) {
    try {
        const { doctor, patient, hospital, appointmentTime, reason, appointmentDate } = req.body;
        console.log('Appointment request:', { doctor, patient, hospital, appointmentTime, appointmentDate, reason });
        
        // Find doctor profile by user ID
        const doctorProfile = await DocterModel.findOne({ user: doctor });
        if (!doctorProfile) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }

        // Create a proper date object combining date and time
        const [year, month, day] = appointmentDate.split('-').map(Number);
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
        
        console.log('Checking availability for:', appointmentDateTime);
        
        // Check if doctor is available (simplified check for now)
        const dayOfWeek = appointmentDateTime.toLocaleDateString('en-US', { weekday: 'long' });
        const time = appointmentDateTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        
        const availabilitySlot = doctorProfile.availability.find(slot => 
            slot.day === dayOfWeek && 
            time >= slot.startTime && 
            time <= slot.endTime && 
            slot.isAvailable
        );
        
        if (!availabilitySlot) {
            return res.status(400).json({ 
                message: "Doctor is not available at the requested time"
            });
        }

        // Check for existing appointments
        const existingAppointment = await Appointment.findOne({
            doctor: doctor,
            appointmentTime: appointmentDateTime,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingAppointment) {
            return res.status(400).json({ 
                message: "Doctor already has an appointment at this time"
            });
        }

        const appointment = new Appointment({
            doctor: doctor, // Use the user ID directly
            patient,
            hospital,
            appointmentTime: appointmentDateTime,
            appointmentDate: new Date(appointmentDate),
            reason,
            status: 'pending',
            approvalStatus: 'pending'
        });

        await appointment.save();

        // Update doctor profile with the new appointment
        doctorProfile.appointments.push({
            date: new Date(appointmentDate),
            startTime: appointmentTime,
            endTime: appointmentTime,
            isAvailable: false
        });

        await doctorProfile.save();

        res.status(201).json({
            message: "Appointment created successfully",
            appointment
        });
    } catch (err) {
        console.error("CreateAppointment error:", err);
        res.status(500).json({
            message: "Error creating appointment",
            error: err.message
        });
    }
}
//doctor and patient
export async function getAppointment(req, res) {
    try{
         const AppointmentId=req.params.id;
        const appointment=await Appointment.findById(AppointmentId);
        if(!appointment){
            res.status(404).json("Appointment not found");
        }
        res.status(200).json({message:"Appointment found",appointment});
    }catch(err){
        res.status(500).json(err);
    }
}

export async function updateAppointment(req, res) {
    try{
        const AppointmentId=req.params.id;
        const data=req.body;
        const appointment=await Appointment.findByIdAndUpdate(
            {_id:AppointmentId},
            {$set:data},
            {new:true}
        );
    }catch(err){
        res.status(500).json(err);
    }
}
//doctor or patient
export async function deleteAppointment(req, res) {
    try{
        const AppointmentId=req.params.id;
        const appointment=await Appointment.findByIdAndDelete(AppointmentId);
        if(!appointment){
            res.status(404).json("Appointment not found");
        }
        res.status(200).json({message:"Appointment deleted",appointment});

    }catch(err){
        res.status(500).json(err);
    }
}

export async function getAllAppointment(req, res) {
    try{
        const appointments=await Appointment.find();
        res.status(200).json(appointments);
    }catch(err){
        res.status(500).json(err);
    }
}
//doctor or satff
export async function approveAppointment(req, res) {
    try {
        const appointmentId = req.params.appointmentId;
        console.log("Approving appointment with ID:", appointmentId);

        const { approvalStatus, approvalMessage } = req.body;
        console.log("Request body:", req.body);
        if (!approvalStatus || !['approved', 'rejected'].includes(approvalStatus)) {
            return res.status(400).json({ 
                message: "Invalid approval status. Must be either 'approved' or 'rejected'" 
            });
        }

        const appointment = await Appointment.findByIdAndUpdate(
            appointmentId,
            {
                approvalStatus,
                approvalMessage: approvalMessage || "",
                approverBy: req.user._id,
                status: approvalStatus === 'approved' ? 'confirmed' : 'cancelled'
            },
            { new: true }
        );

        console.log("Found appointment:", appointment);

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
        }

        res.status(200).json({ 
            message: `Appointment ${approvalStatus} successfully`,
            appointment 
        });
    } catch (err) {
        console.error("ApproveAppointment error:", err);
        res.status(500).json({
            message: "Error processing appointment approval",
            error: err.message
        });
    }
}

export async function getDoctorAppointments(req, res) {
    try {
        const { doctorId } = req.params;
        console.log("Fetching appointments for doctor:", doctorId);
        
        let appointments = await Appointment.find({ doctor: doctorId })
            .populate('patient', 'firstName lastName email')
            .populate('hospital', 'name')
            .sort({ appointmentDate: 1, appointmentTime: 1 });

        // If no appointments found, create them from doctor profile time slots
        if (!appointments || appointments.length === 0) {
            console.log("No appointments found, creating from profile time slots...");
            appointments = await createAppointmentsFromProfile(doctorId);
        }

        res.status(200).json({ 
            message: "Appointments retrieved successfully",
            appointments 
        });
    } catch (err) {
        console.error("GetDoctorAppointments error:", err);
        res.status(500).json({
            message: "Error retrieving appointments",
            error: err.message
        });
    }
}

async function createAppointmentsFromProfile(doctorId) {
    try {
        const doctorProfile = await DocterModel.findOne({ user: doctorId });
        if (!doctorProfile || !doctorProfile.appointments) {
            return [];
        }

        const createdAppointments = [];

        // Create appointment records from profile time slots
        for (const slot of doctorProfile.appointments) {
            if (!slot.isAvailable) { // Only booked slots
                // Create appointment date and time
                const appointmentDate = new Date(slot.date);
                const [hours, minutes] = slot.startTime.split(':').map(Number);
                const appointmentDateTime = new Date(appointmentDate);
                appointmentDateTime.setHours(hours, minutes, 0, 0);

                // Check if appointment already exists
                const existingAppointment = await Appointment.findOne({
                    doctor: doctorId,
                    appointmentTime: appointmentDateTime
                });

                if (!existingAppointment) {
                    // Create new appointment record
                    const appointment = new Appointment({
                        doctor: doctorId,
                        patient: doctorId, // Use doctor ID as placeholder patient
                        hospital: doctorProfile.hospital || null,
                        appointmentTime: appointmentDateTime,
                        appointmentDate: appointmentDate,
                        reason: "Appointment from profile time slot",
                        status: 'pending'
                    });

                    await appointment.save();
                    createdAppointments.push(appointment);
                }
            }
        }

        return await Appointment.find({ doctor: doctorId })
            .populate('patient', 'firstName lastName email')
            .populate('hospital', 'name')
            .sort({ appointmentDate: 1, appointmentTime: 1 });

    } catch (error) {
        console.error("Error creating appointments from profile:", error);
        return [];
    }
}

export const getPatientAppointments = async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const appointments = await Appointment.find({ patient: patientId })
            .populate('doctor', 'firstName lastName specialization')
            .populate('hospital', 'name address')
            .sort({ appointmentDate: 1, appointmentTime: 1 });

        res.status(200).json({
            success: true,
            appointments
        });
    } catch (error) {
        console.error('Error fetching patient appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch appointments',
            error: error.message
        });
    }
};