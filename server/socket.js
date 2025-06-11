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

    // Queue management
    const queues = new Map();

    const createQueue = (doctorId, hospitalId) => {
        const queueKey = `${doctorId}-${hospitalId}`;
        if (!queues.has(queueKey)) {
            queues.set(queueKey, {
                patients: [],
                isActive: false,
                currentPatient: null
            });
        }
        return queues.get(queueKey);
    };

    const getQueue = (doctorId, hospitalId) => {
        const queueKey = `${doctorId}-${hospitalId}`;
        return queues.get(queueKey) || createQueue(doctorId, hospitalId);
    };

    const addToQueue = (doctorId, hospitalId, patientId) => {
        const queue = getQueue(doctorId, hospitalId);
        if (!queue.isActive) {
            throw new Error('Queue is not active');
        }
        if (!queue.patients.includes(patientId)) {
            queue.patients.push(patientId);
            return queue.patients.length;
        }
        return null;
    };

    const removeFromQueue = (doctorId, hospitalId, patientId) => {
        const queue = getQueue(doctorId, hospitalId);
        const index = queue.patients.indexOf(patientId);
        if (index !== -1) {
            queue.patients.splice(index, 1);
            return true;
        }
        return false;
    };

    const getQueueStatus = (doctorId, hospitalId) => {
        return getQueue(doctorId, hospitalId);
    };

    const toggleQueueStatus = (doctorId, hospitalId, isActive) => {
        const queue = getQueue(doctorId, hospitalId);
        queue.isActive = isActive;
        return queue;
    };

    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        socket.on('joinRoom', (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined their room`);
        });

        socket.on('joinQueue', async ({ doctorId, hospitalId, patientId }) => {
            try {
                const position = addToQueue(doctorId, hospitalId, patientId);
                if (position !== null) {
                    // Notify the patient of their position
                    socket.to(patientId).emit('positionUpdate', {
                        position,
                        estimatedWaitTime: position * 15 // 15 minutes per patient
                    });

                    // Notify everyone about the queue update
                    io.to(doctorId).emit('queueUpdate', {
                        doctorId,
                        hospitalId,
                        queue: getQueue(doctorId, hospitalId).patients,
                        isActive: getQueue(doctorId, hospitalId).isActive
                    });
                }
            } catch (error) {
                socket.emit('error', error.message);
            }
        });

        socket.on('leaveQueue', ({ doctorId, hospitalId, patientId }) => {
            if (removeFromQueue(doctorId, hospitalId, patientId)) {
                // Notify everyone about the queue update
                io.to(doctorId).emit('queueUpdate', {
                    doctorId,
                    hospitalId,
                    queue: getQueue(doctorId, hospitalId).patients,
                    isActive: getQueue(doctorId, hospitalId).isActive
                });
            }
        });

        socket.on('callNextPatient', ({ doctorId, hospitalId }) => {
            const queue = getQueue(doctorId, hospitalId);
            if (queue.patients.length > 0) {
                const nextPatient = queue.patients.shift();
                queue.currentPatient = nextPatient;

                // Notify the patient
                io.to(nextPatient).emit('patientCalled', {
                    doctorId,
                    hospitalId,
                    patientId: nextPatient
                });

                // Notify everyone about the queue update
                io.to(doctorId).emit('queueUpdate', {
                    doctorId,
                    hospitalId,
                    queue: queue.patients,
                    isActive: queue.isActive
                });
            }
        });

        socket.on('completeConsultation', ({ doctorId, hospitalId, patientId }) => {
            const queue = getQueue(doctorId, hospitalId);
            if (queue.currentPatient === patientId) {
                queue.currentPatient = null;
                io.to(patientId).emit('consultationComplete', {
                    doctorId,
                    hospitalId,
                    patientId
                });
            }
        });

        socket.on('getQueueStatus', ({ doctorId, hospitalId }) => {
            const queue = getQueue(doctorId, hospitalId);
            socket.emit('queueStatus', {
                doctorId,
                hospitalId,
                queue: queue.patients,
                isActive: queue.isActive
            });
        });

        socket.on('toggleQueueStatus', ({ doctorId, hospitalId, isActive }) => {
            const queue = toggleQueueStatus(doctorId, hospitalId, isActive);
            io.to(doctorId).emit('queueUpdate', {
                doctorId,
                hospitalId,
                queue: queue.patients,
                isActive: queue.isActive
            });
        });

        // Online consultation handlers
        socket.on('toggleOnlineMode', ({ doctorId, hospitalId, patientId, isOnline }) => {
            console.log('Toggle online mode event:', { doctorId, hospitalId, patientId, isOnline });
            
            // Notify both doctor and patient about online mode change
            io.to(doctorId).emit('onlineModeToggle', {
                doctorId,
                hospitalId,
                patientId,
                isOnline
            });
            io.to(patientId).emit('onlineModeToggle', {
                doctorId,
                hospitalId,
                patientId,
                isOnline
            });
            
            console.log(`Sent onlineModeToggle to doctor ${doctorId} and patient ${patientId}`);
        });

        socket.on('sendMessage', ({ doctorId, hospitalId, sender, receiver, message }) => {
            // Send message to both sender and receiver
            io.to(sender).emit('newMessage', {
                sender,
                receiver,
                message,
                timestamp: new Date()
            });
            io.to(receiver).emit('newMessage', {
                sender,
                receiver,
                message,
                timestamp: new Date()
            });
        });

        socket.on('requestVideoCall', ({ doctorId, hospitalId, patientId }) => {
            // Notify the patient about video call request
            io.to(patientId).emit('videoCallRequest', {
                doctorId,
                hospitalId,
                patientId
            });
        });

        socket.on('videoCallResponse', ({ doctorId, hospitalId, patientId, accepted }) => {
            // Notify the doctor about video call response
            io.to(doctorId).emit('videoCallResponse', {
                doctorId,
                hospitalId,
                patientId,
                accepted
            });
        });

        socket.on('endVideoCall', ({ doctorId, hospitalId, patientId }) => {
            // Notify both parties that video call ended
            io.to(doctorId).emit('videoCallEnded', {
                doctorId,
                hospitalId,
                patientId
            });
            io.to(patientId).emit('videoCallEnded', {
                doctorId,
                hospitalId,
                patientId
            });
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });

    return io;
};