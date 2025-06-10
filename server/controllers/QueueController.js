import Queue from "../models/QueueModel.js";
import { io } from "../index.js";

// Create a new queue
export const createQueue = async (req, res) => {
    try {
        const { doctorId, hospitalId } = req.body;

        // Check if queue already exists
        const existingQueue = await Queue.findOne({ 
            doctor: doctorId,
            hospital: hospitalId,
            status: 'active'
        });

        if (existingQueue) {
            return res.status(400).json({ 
                success: false, 
                message: "A queue already exists for this doctor" 
            });
        }

        const queue = new Queue({
            doctor: doctorId,
            hospital: hospitalId,
            patients: [],
            status: 'active'
        });

        await queue.save();

        // Notify all connected clients about the new queue
        io.emit('queueCreated', {
            queueId: queue._id,
            doctorId,
            hospitalId
        });

        res.status(201).json({
            success: true,
            message: "Queue created successfully",
            queue
        });
    } catch (error) {
        console.error("Error creating queue:", error);
        res.status(500).json({
            success: false,
            message: "Error creating queue",
            error: error.message
        });
    }
};

// Get queue status
export const getQueueStatus = async (req, res) => {
    try {
        const { doctorId, hospitalId } = req.params;

        const queue = await Queue.findOne({
            doctor: doctorId,
            hospital: hospitalId,
            status: 'active'
        }).populate('patients.patient', 'firstName lastName');

        if (!queue) {
            return res.status(404).json({
                success: false,
                message: "No active queue found"
            });
        }

        res.status(200).json({
            success: true,
            queue
        });
    } catch (error) {
        console.error("Error getting queue status:", error);
        res.status(500).json({
            success: false,
            message: "Error getting queue status",
            error: error.message
        });
    }
};

// Join queue
export const joinQueue = async (req, res) => {
    try {
        const { queueId } = req.params;
        const { patientId } = req.body;

        const queue = await Queue.findById(queueId);

        if (!queue) {
            return res.status(404).json({
                success: false,
                message: "Queue not found"
            });
        }

        if (queue.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: "Queue is not active"
            });
        }

        // Check if patient is already in queue
        const isInQueue = queue.patients.some(p => p.patient.toString() === patientId);
        if (isInQueue) {
            return res.status(400).json({
                success: false,
                message: "Patient is already in queue"
            });
        }

        queue.patients.push({
            patient: patientId,
            joinedAt: new Date()
        });

        await queue.save();

        // Notify all connected clients about the queue update
        io.emit('queueUpdated', {
            queueId: queue._id,
            patients: queue.patients
        });

        res.status(200).json({
            success: true,
            message: "Joined queue successfully",
            queue
        });
    } catch (error) {
        console.error("Error joining queue:", error);
        res.status(500).json({
            success: false,
            message: "Error joining queue",
            error: error.message
        });
    }
};

// Leave queue
export const leaveQueue = async (req, res) => {
    try {
        const { queueId } = req.params;
        const { patientId } = req.body;

        const queue = await Queue.findById(queueId);

        if (!queue) {
            return res.status(404).json({
                success: false,
                message: "Queue not found"
            });
        }

        queue.patients = queue.patients.filter(p => p.patient.toString() !== patientId);
        await queue.save();

        // Notify all connected clients about the queue update
        io.emit('queueUpdated', {
            queueId: queue._id,
            patients: queue.patients
        });

        res.status(200).json({
            success: true,
            message: "Left queue successfully",
            queue
        });
    } catch (error) {
        console.error("Error leaving queue:", error);
        res.status(500).json({
            success: false,
            message: "Error leaving queue",
            error: error.message
        });
    }
};

// End queue
export const endQueue = async (req, res) => {
    try {
        const { queueId } = req.params;

        const queue = await Queue.findById(queueId);

        if (!queue) {
            return res.status(404).json({
                success: false,
                message: "Queue not found"
            });
        }

        queue.status = 'ended';
        await queue.save();

        // Notify all connected clients about the queue ending
        io.emit('queueEnded', {
            queueId: queue._id
        });

        res.status(200).json({
            success: true,
            message: "Queue ended successfully",
            queue
        });
    } catch (error) {
        console.error("Error ending queue:", error);
        res.status(500).json({
            success: false,
            message: "Error ending queue",
            error: error.message
        });
    }
};

// Start a new queue
export const startQueue = async (req, res) => {
    try {
        const { doctorId, hospitalId } = req.body;
        let queue = await Queue.findOne({ doctor: doctorId, hospital: hospitalId, status: 'active' });
        if (queue) {
            return res.status(400).json({ message: "A queue is already active for this doctor" });
        }
        queue = new Queue({ doctor: doctorId, hospital: hospitalId, status: 'active', currentNumber: 0, patients: [] });
        await queue.save();
        return res.status(201).json({ queue, message: "Queue started successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Get next patient in queue
export const getNextPatient = async (req, res) => {
    try {
        const { doctorId, hospitalId } = req.body;
        const queue = await Queue.findOne({ doctor: doctorId, hospital: hospitalId, status: 'active' });
        if (!queue) {
            return res.status(404).json({ message: "No active queue found" });
        }
        const nextPatient = queue.patients.find(p => p.status === "waiting");
        if (!nextPatient) {
            return res.status(404).json({ message: "No patients waiting in queue" });
        }
        nextPatient.status = "in_consultation";
        await queue.save();
        return res.status(200).json({ patient: nextPatient, queue });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

// Complete consultation for current patient
export const completeConsultation = async (req, res) => {
    try {
        const { doctorId, hospitalId, patientId } = req.body;
        const queue = await Queue.findOne({ doctor: doctorId, hospital: hospitalId, status: 'active' });
        if (!queue) {
            return res.status(404).json({ message: "No active queue found" });
        }
        const patient = queue.patients.find(p => p.patient.toString() === patientId && p.status === "in_consultation");
        if (!patient) {
            return res.status(404).json({ message: "Patient not found in consultation" });
        }
        patient.status = "completed";
        await queue.save();
        return res.status(200).json({ queue, message: "Consultation completed successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}; 