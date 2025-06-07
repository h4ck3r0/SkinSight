import Queue from "../models/QueueModel.js"

export async function CreateQueue(req, res) {
    try {
        const { hospitalId, doctorId, queueNumber, maxPatients } = req.body;
        
        if (!doctorId || !hospitalId || !queueNumber || !maxPatients) {
            return res.status(400).json({ error: "Please provide all required fields" });
        }
         const existingQueue = await Queue.findOne({ hospitalId, doctorId, status: 'active' });
        if (existingQueue) {
            return res.status(400).json({ error: "An active queue already exists for this doctor" });
        }

        const queue = await Queue.create({ hospitalId, doctorId, queueNumber, maxPatients });
        return res.status(201).json({ queue, message: "Queue created successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

export async function DeleteQueue(req, res) {
    try {
        const { queueId } = req.params;
        const queue = await Queue.findByIdAndDelete(queueId);
        
        if (!queue) {
            return res.status(404).json({ error: "Queue not found" });
        }
        
        return res.status(200).json({ message: "Queue deleted successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

export async function GetQueue(req, res) {
    try {
        const { queueId } = req.params;
        const queue = await Queue.findById(queueId).populate('patients.patientId');
        
        if (!queue) {
            return res.status(404).json({ error: "Queue not found" });
        }
        
        return res.status(200).json({ queue });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

export async function UpdateQueue(req, res) {
    try {
        const { queueId } = req.params;
        const data = req.body;
        
        const queue = await Queue.findByIdAndUpdate(
            queueId,
            data,
            { new: true }
        );
        
        if (!queue) {
            return res.status(404).json({ error: "Queue not found" });
        }
        
        return res.status(200).json({ queue });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

export async function AddPatientToQueue(req, res) {
    try {
        const { queueId } = req.params;
        const { patientId, reason } = req.body;
        
        if (!patientId) {
            return res.status(400).json({ error: "Patient ID is required" });
        }

        const queue = await Queue.findById(queueId);
        if (!queue) {
            return res.status(404).json({ error: "Queue not found" });
        }

        if (queue.currentPatients >= queue.maxPatients) {
            return res.status(400).json({ error: "Queue is full" });
        }

        const patientExists = queue.patients.some(p => p.patientId.toString() === patientId);
        if (patientExists) {
            return res.status(400).json({ error: "Patient already in queue" });
        }

        queue.patients.push({ patientId, reason });
        queue.currentPatients += 1;
        await queue.save();

        return res.status(200).json({ queue });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

export async function RemovePatientFromQueue(req, res) {
    try {
        const { queueId } = req.params;
        const { patientId } = req.body;
        
        if (!patientId) {
            return res.status(400).json({ error: "Patient ID is required" });
        }

        const queue = await Queue.findById(queueId);
        if (!queue) {
            return res.status(404).json({ error: "Queue not found" });
        }

        const patientIndex = queue.patients.findIndex(p => p.patientId.toString() === patientId);
        if (patientIndex === -1) {
            return res.status(404).json({ error: "Patient not found in queue" });
        }

        queue.patients.splice(patientIndex, 1);
        queue.currentPatients -= 1;
        await queue.save();

        return res.status(200).json({ queue });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

export async function GetAllQueues(req, res) {
    try {
        const { hospitalId, doctorId, status } = req.query;
        const query = {};
        
        if (hospitalId) query.hospitalId = hospitalId;
        if (doctorId) query.doctorId = doctorId;
        if (status) query.status = status;

        const queues = await Queue.find(query).populate('patients.patientId');
        return res.status(200).json({ queues });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

export async function Controls(req, res) {
    try {
        const { queueId } = req.params;
        const { status } = req.body;

        if (!status || !['active', 'closed'].includes(status)) {
            return res.status(400).json({ error: "Invalid status. Must be 'active' or 'closed'" });
        }

        const queue = await Queue.findById(queueId);
        if (!queue) {
            return res.status(404).json({ error: "Queue not found" });
        }

        queue.status = status;
        await queue.save();

        return res.status(200).json({ queue, message: "Status updated successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

