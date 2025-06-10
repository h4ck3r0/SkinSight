import Queue from "../models/QueueModel.js";
import { io } from "../index.js";

// Start a new queue
export async function startQueue(req, res) {
    try {
        const { doctorId, hospitalId } = req.body;
        
        // Check if there's already an active queue
        const existingQueue = await Queue.findOne({
            doctor: doctorId,
            hospital: hospitalId,
            isActive: true
        });

        if (existingQueue) {
            return res.status(400).json({
                message: "A queue is already active for this doctor"
            });
        }

        const queue = new Queue({
            doctor: doctorId,
            hospital: hospitalId,
            isActive: true,
            currentNumber: 0
        });

        await queue.save();

        // Emit queue started event
        io.emit(`queue:${doctorId}`, {
            type: "queue_started",
            queue
        });

        res.status(201).json({
            message: "Queue started successfully",
            queue
        });
    } catch (err) {
        console.error("StartQueue error:", err);
        res.status(500).json({
            message: "Error starting queue",
            error: err.message
        });
    }
}

// Join queue
export async function joinQueue(req, res) {
    try {
        const { doctorId, hospitalId, patientId } = req.body;

        const queue = await Queue.findOne({
            doctor: doctorId,
            hospital: hospitalId,
            isActive: true
        });

        if (!queue) {
            return res.status(404).json({
                message: "No active queue found"
            });
        }

        // Check if patient is already in queue
        const existingPatient = queue.patients.find(
            p => p.patient.toString() === patientId
        );

        if (existingPatient) {
            return res.status(400).json({
                message: "Patient is already in queue"
            });
        }

        // Add patient to queue
        queue.currentNumber += 1;
        queue.patients.push({
            patient: patientId,
            queueNumber: queue.currentNumber,
            status: "waiting"
        });

        await queue.save();

        // Emit queue updated event
        io.emit(`queue:${doctorId}`, {
            type: "patient_joined",
            queue
        });

        res.status(200).json({
            message: "Joined queue successfully",
            queueNumber: queue.currentNumber,
            queue
        });
    } catch (err) {
        console.error("JoinQueue error:", err);
        res.status(500).json({
            message: "Error joining queue",
            error: err.message
        });
    }
}

// Get next patient
export async function getNextPatient(req, res) {
    try {
        const { doctorId, hospitalId } = req.body;

        const queue = await Queue.findOne({
            doctor: doctorId,
            hospital: hospitalId,
            isActive: true
        });

        if (!queue) {
            return res.status(404).json({
                message: "No active queue found"
            });
        }

        // Find next waiting patient
        const nextPatient = queue.patients.find(p => p.status === "waiting");

        if (!nextPatient) {
            return res.status(404).json({
                message: "No patients waiting in queue"
            });
        }

        // Update patient status
        nextPatient.status = "in_consultation";
        await queue.save();

        // Emit next patient event
        io.emit(`queue:${doctorId}`, {
            type: "next_patient",
            queue,
            currentPatient: nextPatient
        });

        res.status(200).json({
            message: "Next patient retrieved successfully",
            patient: nextPatient,
            queue
        });
    } catch (err) {
        console.error("GetNextPatient error:", err);
        res.status(500).json({
            message: "Error getting next patient",
            error: err.message
        });
    }
}

// Complete consultation
export async function completeConsultation(req, res) {
    try {
        const { doctorId, hospitalId, patientId } = req.body;

        const queue = await Queue.findOne({
            doctor: doctorId,
            hospital: hospitalId,
            isActive: true
        });

        if (!queue) {
            return res.status(404).json({
                message: "No active queue found"
            });
        }

        // Find and update patient status
        const patient = queue.patients.find(
            p => p.patient.toString() === patientId && p.status === "in_consultation"
        );

        if (!patient) {
            return res.status(404).json({
                message: "Patient not found in consultation"
            });
        }

        patient.status = "completed";
        await queue.save();

        // Emit consultation completed event
        io.emit(`queue:${doctorId}`, {
            type: "consultation_completed",
            queue,
            completedPatient: patient
        });

        res.status(200).json({
            message: "Consultation completed successfully",
            queue
        });
    } catch (err) {
        console.error("CompleteConsultation error:", err);
        res.status(500).json({
            message: "Error completing consultation",
            error: err.message
        });
    }
}

// Get queue status
export async function getQueueStatus(req, res) {
    try {
        const { doctorId, hospitalId } = req.params;

        const queue = await Queue.findOne({
            doctor: doctorId,
            hospital: hospitalId,
            isActive: true
        }).populate("patients.patient", "firstName lastName");

        if (!queue) {
            return res.status(404).json({
                message: "No active queue found"
            });
        }

        res.status(200).json({
            message: "Queue status retrieved successfully",
            queue
        });
    } catch (err) {
        console.error("GetQueueStatus error:", err);
        res.status(500).json({
            message: "Error getting queue status",
            error: err.message
        });
    }
}

// End queue
export async function endQueue(req, res) {
    try {
        const { doctorId, hospitalId } = req.body;

        const queue = await Queue.findOne({
            doctor: doctorId,
            hospital: hospitalId,
            isActive: true
        });

        if (!queue) {
            return res.status(404).json({
                message: "No active queue found"
            });
        }

        queue.isActive = false;
        await queue.save();

        // Emit queue ended event
        io.emit(`queue:${doctorId}`, {
            type: "queue_ended",
            queue
        });

        res.status(200).json({
            message: "Queue ended successfully",
            queue
        });
    } catch (err) {
        console.error("EndQueue error:", err);
        res.status(500).json({
            message: "Error ending queue",
            error: err.message
        });
    }
} 