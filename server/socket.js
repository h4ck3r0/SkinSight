import { Server } from 'socket.io';
import jwt from "jsonwebtoken";
import Queue from "./models/QueueModel.js";

export const SetupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: [
                'http://localhost:5173',
                'https://mycarebridge.onrender.com',
                'http://127.0.0.1:5500'
            ],
            methods: ['GET', 'POST'],
            credentials: true,
            allowedHeaders: ['Content-Type', 'Authorization']
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
        upgradeTimeout: 30000,
        allowEIO3: true
    });

    // Store active queues
    const queues = new Map();

    // Queue management functions
    const createQueue = (doctorId, hospitalId) => {
        const queueKey = `${doctorId}:${hospitalId}`;
        if (!queues.has(queueKey)) {
            queues.set(queueKey, {
                doctorId,
                hospitalId,
                patients: [],
                status: 'active'
            });
        }
        return queues.get(queueKey);
    };

    const addToQueue = (doctorId, hospitalId, patient) => {
        const queue = createQueue(doctorId, hospitalId);
        queue.patients.push(patient);
        return queue.patients.length;
    };

    const removeFromQueue = (doctorId, hospitalId, patientId) => {
        const queueKey = `${doctorId}:${hospitalId}`;
        const queue = queues.get(queueKey);
        if (queue) {
            queue.patients = queue.patients.filter(p => p._id !== patientId);
            if (queue.patients.length === 0) {
                queues.delete(queueKey);
            }
        }
    };

    const getQueueStatus = (doctorId, hospitalId) => {
        const queueKey = `${doctorId}:${hospitalId}`;
        return queues.get(queueKey) || createQueue(doctorId, hospitalId);
    };

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Join a room (for private messages)
        socket.on('joinRoom', (roomId) => {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        });

        // Join queue
        socket.on('joinQueue', ({ doctorId, hospitalId, patient }) => {
            const position = addToQueue(doctorId, hospitalId, patient);
            const queue = getQueueStatus(doctorId, hospitalId);
            
            // Notify all clients in the room about the queue update
            io.to(`${doctorId}:${hospitalId}`).emit('queueUpdate', {
                doctorId,
                hospitalId,
                queue
            });

            // Notify the patient about their position
            socket.emit('positionUpdate', {
                position,
                estimatedWaitTime: position * 15 // 15 minutes per patient
            });
        });

        // Leave queue
        socket.on('leaveQueue', ({ doctorId, hospitalId, patientId }) => {
            removeFromQueue(doctorId, hospitalId, patientId);
            const queue = getQueueStatus(doctorId, hospitalId);
            
            io.to(`${doctorId}:${hospitalId}`).emit('queueUpdate', {
                doctorId,
                hospitalId,
                queue
            });
        });

        // Call next patient
        socket.on('callNextPatient', ({ doctorId, hospitalId }) => {
            const queue = getQueueStatus(doctorId, hospitalId);
            if (queue.patients.length > 0) {
                const nextPatient = queue.patients[0];
                removeFromQueue(doctorId, hospitalId, nextPatient._id);
                
                // Notify the patient
                io.to(nextPatient._id).emit('patientCalled', {
                    doctorId,
                    hospitalId,
                    patient: nextPatient
                });

                // Update queue for all clients
                io.to(`${doctorId}:${hospitalId}`).emit('queueUpdate', {
                    doctorId,
                    hospitalId,
                    queue: getQueueStatus(doctorId, hospitalId)
                });
            }
        });

        // Complete consultation
        socket.on('completeConsultation', ({ doctorId, hospitalId, patientId }) => {
            io.to(patientId).emit('consultationComplete', {
                doctorId,
                hospitalId,
                patientId
            });
        });

        // Get queue status
        socket.on('getQueueStatus', ({ doctorId, hospitalId }) => {
            const queue = getQueueStatus(doctorId, hospitalId);
            socket.emit('queueUpdate', {
                doctorId,
                hospitalId,
                queue
            });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};