import Queue from "../models/QueueModel.js";

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
        const { doctorId, hospitalId } = req.query;
        
        // Validate required parameters
        if (!doctorId || !hospitalId) {
            return res.status(400).json({
                success: false,
                message: "Doctor ID and Hospital ID are required"
            });
        }

        // Find the queue for the specified doctor and hospital
        const queue = await Queue.findOne({ 
            doctor: doctorId,
            hospital: hospitalId
        }).populate('patients.patient', 'firstName lastName');

        if (!queue) {
            return res.status(404).json({
                success: false,
                message: "Queue not found for this doctor and hospital"
            });
        }

        res.json({
            success: true,
            data: queue
        });
    } catch (error) {
        console.error("Queue status error:", error);
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
        const { doctorId, hospitalId, patientId } = req.body;

        // Validate required parameters
        if (!doctorId || !hospitalId || !patientId) {
            return res.status(400).json({
                success: false,
                message: "Doctor ID, Hospital ID, and Patient ID are required"
            });
        }

        // Find or create queue
        let queue = await Queue.findOne({ 
            doctor: doctorId,
            hospital: hospitalId
        });

        if (!queue) {
            queue = new Queue({
                doctor: doctorId,
                hospital: hospitalId,
                patients: []
            });
        }

        // Check if patient is already in queue
        const existingPatient = queue.patients.find(p => p.patient.toString() === patientId);
        if (existingPatient) {
            return res.status(400).json({
                success: false,
                message: "Patient is already in queue"
            });
        }

        // Add patient to queue
        queue.patients.push({
            patient: patientId,
            joinedAt: new Date()
        });

        await queue.save();

        // Emit queue update event to the specific queue room
        const io = req.app.locals.io;
        if (io) {
            io.to(`queue:${doctorId}:${hospitalId}`).emit('queueUpdate', {
                queue: queue
            });
        }

        res.json({
            success: true,
            message: "Successfully joined queue",
            data: queue
        });
    } catch (error) {
        console.error("Join queue error:", error);
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
        const { doctorId, hospitalId, patientId } = req.body;

        // Validate required parameters
        if (!doctorId || !hospitalId || !patientId) {
            return res.status(400).json({
                success: false,
                message: "Doctor ID, Hospital ID, and Patient ID are required"
            });
        }

        const queue = await Queue.findOne({ 
            doctor: doctorId,
            hospital: hospitalId
        });

        if (!queue) {
            return res.status(404).json({
                success: false,
                message: "Queue not found"
            });
        }

        // Remove patient from queue
        queue.patients = queue.patients.filter(p => p.patient.toString() !== patientId);
        await queue.save();

        // Emit queue update event to the specific queue room
        const io = req.app.locals.io;
        if (io) {
            io.to(`queue:${doctorId}:${hospitalId}`).emit('queueUpdate', {
                queue: queue
            });
        }

        res.json({
            success: true,
            message: "Successfully left queue",
            data: queue
        });
    } catch (error) {
        console.error("Leave queue error:", error);
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