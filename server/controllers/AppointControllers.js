import Appointment from "../models/AppointmentModel.js";
import DocterModel from "../models/DocterModel.js";

export async function createAppointment(req, res) {
    try {
        const { doctor, patient, hospital, appointmentTime, reason, appointmentDate } = req.body;
        const doctorProfile = await DocterModel.findOne({ user: doctor });
        if (!doctorProfile) {
            return res.status(404).json({ message: "Doctor profile not found" });
        }
        const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
        
        if (!doctorProfile.isAvailableAt(appointmentDateTime)) {
            return res.status(400).json({ 
                message: "Doctor is not available at the requested time",
                nextAvailableSlot: doctorProfile.getNextAvailableSlot(appointmentDateTime)
            });
        }
        const existingAppointment = await Appointment.findOne({
            doctor,
            appointmentDate,
            appointmentTime,
            status: { $in: ['pending', 'confirmed'] }
        });

        if (existingAppointment) {
            return res.status(400).json({ 
                message: "Doctor already has an appointment at this time",
                nextAvailableSlot: doctorProfile.getNextAvailableSlot(appointmentDateTime)
            });
        }

        // Create the appointment
        const appointment = new Appointment({
            doctor,
            patient,
            hospital,
            appointmentTime,
            reason,
            appointmentDate,
            status: 'pending'
        });

        await appointment.save();

        doctorProfile.appointments.push({
            date: appointmentDate,
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