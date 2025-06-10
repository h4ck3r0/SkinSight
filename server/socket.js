import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Queue from "./models/QueueModel.js";

export const SetupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173", "https://mycarebridge.onrender.com", "http://127.0.0.1:5500"],
            methods: ["GET", "POST"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"]
        }
    });

    // Store active queues
    const activeQueues = new Map();

    // Queue management functions
    const createQueue = (doctorId, hospitalId) => {
        const queueKey = `${doctorId}:${hospitalId}`;
        if (!activeQueues.has(queueKey)) {
            activeQueues.set(queueKey, {
                patients: [],
                currentNumber: 0,
                status: 'active'
            });
        }
        return activeQueues.get(queueKey);
    };

    const addToQueue = (doctorId, hospitalId, patientId) => {
        const queue = createQueue(doctorId, hospitalId);
        const position = queue.patients.length + 1;
        queue.patients.push({
            patientId,
            position,
            status: 'waiting',
            joinedAt: new Date()
        });
        return position;
    };

    const removeFromQueue = (doctorId, hospitalId, patientId) => {
        const queueKey = `${doctorId}:${hospitalId}`;
        const queue = activeQueues.get(queueKey);
        if (queue) {
            queue.patients = queue.patients.filter(p => p.patientId !== patientId);
            // Update positions
            queue.patients.forEach((p, index) => {
                p.position = index + 1;
            });
        }
    };

    const getQueueStatus = (doctorId, hospitalId) => {
        const queueKey = `${doctorId}:${hospitalId}`;
        return activeQueues.get(queueKey) || null;
    };

    // Socket event handlers
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join queue
        socket.on('joinQueue', (data) => {
            const { doctorId, hospitalId, patientId } = data;
            const room = `queue:${doctorId}:${hospitalId}`;
            
            // Add to queue
            const position = addToQueue(doctorId, hospitalId, patientId);
            socket.join(room);

            // Notify everyone in the room about the new position
            io.to(room).emit('queueUpdate', {
                queue: getQueueStatus(doctorId, hospitalId)
            });

            // Notify the specific patient about their position
            socket.emit('positionUpdate', {
                position,
                estimatedWaitTime: position * 15 // 15 minutes per patient
            });

            console.log(`Patient ${patientId} joined queue at position ${position}`);
        });

        // Leave queue
        socket.on('leaveQueue', (data) => {
            const { doctorId, hospitalId, patientId } = data;
            const room = `queue:${doctorId}:${hospitalId}`;
            
            removeFromQueue(doctorId, hospitalId, patientId);
            socket.leave(room);

            // Notify everyone in the room about the queue update
            io.to(room).emit('queueUpdate', {
                queue: getQueueStatus(doctorId, hospitalId)
            });

            console.log(`Patient ${patientId} left the queue`);
        });

        // Doctor calls next patient
        socket.on('callNextPatient', (data) => {
            const { doctorId, hospitalId } = data;
            const room = `queue:${doctorId}:${hospitalId}`;
            const queue = getQueueStatus(doctorId, hospitalId);

            if (queue && queue.patients.length > 0) {
                const nextPatient = queue.patients[0];
                nextPatient.status = 'in_consultation';
                
                // Notify the specific patient
                io.to(room).emit('patientCalled', {
                    patientId: nextPatient.patientId,
                    position: nextPatient.position
                });

                // Update everyone about queue status
                io.to(room).emit('queueUpdate', {
                    queue: getQueueStatus(doctorId, hospitalId)
                });
            }
        });

        // Complete consultation
        socket.on('completeConsultation', (data) => {
            const { doctorId, hospitalId, patientId } = data;
            const room = `queue:${doctorId}:${hospitalId}`;
            
            removeFromQueue(doctorId, hospitalId, patientId);

            // Notify everyone about queue update
            io.to(room).emit('queueUpdate', {
                queue: getQueueStatus(doctorId, hospitalId)
            });

            // Notify the patient
            socket.emit('consultationComplete', {
                patientId,
                message: 'Consultation completed successfully'
            });
        });

        // Get queue status
        socket.on('getQueueStatus', (data) => {
            const { doctorId, hospitalId } = data;
            const queue = getQueueStatus(doctorId, hospitalId);
            socket.emit('queueStatus', { queue });
        });

        // Disconnect handling
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });

        // Error handling
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    return io;
};