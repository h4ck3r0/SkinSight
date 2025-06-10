import Appointment from "../models/AppointmentModel.js";
import DocterModel from "../models/DocterModel.js";
//patient
export async function createAppointment(req, res) {
    try {
        const { doctor, patient, hospital, appointmentTime, reason, appointmentDate } = req.body;
        console.log('Appointment request:', { doctor, patient, hospital, appointmentTime, appointmentDate, reason });
        
        const doctorProfile = await DocterModel.findById(doctor);
        if (!doctorProfile) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }

        // Create a proper date object combining date and time
        const [year, month, day] = appointmentDate.split('-').map(Number);
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        const appointmentDateTime = new Date(year, month - 1, day, hours, minutes);
        
        console.log('Checking availability for:', appointmentDateTime);
        
        if (!doctorProfile.isAvailableAt(appointmentDateTime)) {
            const nextSlot = doctorProfile.getNextAvailableSlot(appointmentDateTime);
            console.log('Next available slot:', nextSlot);
            return res.status(400).json({ 
                message: "Doctor is not available at the requested time",
                nextAvailableSlot: nextSlot
            });
        }

        const existingAppointment = await Appointment.findOne({
            doctor,
            appointmentTime: appointmentDateTime,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingAppointment) {
            const nextSlot = doctorProfile.getNextAvailableSlot(appointmentDateTime);
            return res.status(400).json({ 
                message: "Doctor already has an appointment at this time",
                nextAvailableSlot: nextSlot
            });
        }

        const appointment = new Appointment({
            doctor,
            patient,
            hospital,
            appointmentTime: appointmentDateTime,
            appointmentDate: new Date(appointmentDate),
            reason,
            status: 'pending'
        });

        await appointment.save();

        doctorProfile.appointments.push({
            date: new Date(appointmentDate),
            startTime: appointmentTime,
            endTime: appointmentTime, // You might want to calculate this based on appointment duration
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
        
        const appointments = await Appointment.find({ doctor: doctorId })
            .populate('patient', 'firstName lastName email')
            .populate('hospital', 'name')
            .sort({ appointmentDate: 1, appointmentTime: 1 });

        if (!appointments) {
            return res.status(404).json({ message: "No appointments found" });
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