import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Queue from "./models/QueueModel.js";

export const SetupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: ["http://localhost:5173", "https://mycarebridge.onrender.com"],
            methods: ["GET", "POST"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"]
        }
    });

    // Store io instance directly on server object
    server.io = io;

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Invalid token"));
        }
        try {
            const payload = jwt.verify(token, process.env.SECRET_KEY);
            socket.user = payload;
            next();
        } catch (err) {
            next(new Error("Invalidd token"));
        }
    });

    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);

        socket.emit("Some mfs is connected ${socket.user.username}");
        socket.join(socket.user._id.toString());

        socket.on("joinHospital", (hospitalId) => {
            if (hospitalId) {
                socket.join(hospitalId.toString());
                console.log("joined hospital ${hospitalId}");
            }
        });

        socket.on("leaveHospital", (hospitalId) => {
            if (hospitalId) {
                socket.leave(hospitalId.toString());
                console.log("left hospital ${hospitalId}");
            }
        });

        socket.on("message:hospital", (data) => {
            const { message, hospitalId } = data;
            if (hospitalId) {
                io.to(hospitalId.toString()).emit("message:hospital", {
                    message,
                    sender: socket.user,
                    createdAt: new Date()
                });
            }
        });

        socket.on("message:private", (data) => {
            const { message, receiverId } = data;
            if (receiverId) {
                socket.to(receiverId.toString()).emit("message:private", {
                    message,
                    sender: socket.user,
                    createdAt: new Date()
                });
            }
        });

        socket.on("message:doctor", (data) => {
            const { message, doctorId } = data;
            if (doctorId) {
                socket.to(doctorId.toString()).emit("message:doctor", {
                    message,
                    sender: socket.user,
                    createdAt: new Date()
                });
            }
        });

        socket.on('appointment:request', (data) => {
            const { doctorId, patientId } = data;
            if (doctorId) {
                io.to(`doctor:${doctorId}`).emit('appointment:request', data);
            }
            if (patientId) {
                io.to(`patient:${patientId}`).emit('appointment:request', data);
            }
        });

        socket.on('appointment:accept', (data) => {
            const { doctorId, patientId } = data;
            if (doctorId) {
                io.to(`doctor:${doctorId}`).emit('appointment:accept', data);
            }
            if (patientId) {
                io.to(`patient:${patientId}`).emit('appointment:accept', data);
            }
        });

        socket.on('joinQueue', (data) => {
            const { doctorId, hospitalId } = data;
            if (doctorId && hospitalId) {
                const roomId = `queue:${doctorId}:${hospitalId}`;
                socket.join(roomId);
                console.log(`Client ${socket.id} joined queue room: ${roomId}`);
            }
        });

        socket.on('leaveQueue', (data) => {
            const { doctorId, hospitalId } = data;
            if (doctorId && hospitalId) {
                const roomId = `queue:${doctorId}:${hospitalId}`;
                socket.leave(roomId);
                console.log(`Client ${socket.id} left queue room: ${roomId}`);
            }
        });

        socket.on('queue:join', async (data) => {
            try {
                const { queueId, patientId } = data;
                if (!queueId || !patientId) {
                    socket.emit('queue:error', { message: 'Missing required fields' });
                    return;
                }

                const queue = await Queue.findById(queueId).populate('patients.patientId');
                if (!queue) {
                    socket.emit('queue:error', { message: 'Queue not found' });
                    return;
                }

                if (queue.currentPatients >= queue.maxPatients) {
                    socket.emit('queue:error', { message: 'Queue is full' });
                    return;
                }

                const patientExists = queue.patients.some(p => p.patientId.toString() === patientId);
                if (patientExists) {
                    socket.emit('queue:error', { message: 'Patient already in queue' });
                    return;
                }

                queue.patients.push({ patientId, status: 'waiting' });
                queue.currentPatients += 1;
                await queue.save();

                socket.join(`queue:${queueId}`);
                io.to(`queue:${queueId}`).emit('queue:updated', {
                    queueId,
                    patients: queue.patients,
                    currentPatients: queue.currentPatients
                });
            } catch (error) {
                socket.emit('queue:error', { message: error.message });
            }
        });

        socket.on('queue:leave', async (data) => {
            try {
                const { queueId, patientId } = data;
                if (!queueId || !patientId) {
                    socket.emit('queue:error', { message: 'Missing required fields' });
                    return;
                }

                const queue = await Queue.findById(queueId);
                if (!queue) {
                    socket.emit('queue:error', { message: 'Queue not found' });
                    return;
                }

                const patientIndex = queue.patients.findIndex(p => p.patientId.toString() === patientId);
                if (patientIndex === -1) {
                    socket.emit('queue:error', { message: 'Patient not found in queue' });
                    return;
                }

                queue.patients.splice(patientIndex, 1);
                queue.currentPatients -= 1;
                await queue.save();

                socket.leave(`queue:${queueId}`);
                io.to(`queue:${queueId}`).emit('queue:updated', {
                    queueId,
                    patients: queue.patients,
                    currentPatients: queue.currentPatients
                });
            } catch (error) {
                socket.emit('queue:error', { message: error.message });
            }
        });

        socket.on('queue:update_status', async (data) => {
            try {
                const { queueId, patientId, status } = data;
                if (!queueId || !patientId || !status) {
                    socket.emit('queue:error', { message: 'Missing required fields' });
                    return;
                }

                const queue = await Queue.findById(queueId);
                if (!queue) {
                    socket.emit('queue:error', { message: 'Queue not found' });
                    return;
                }

                const patient = queue.patients.find(p => p.patientId.toString() === patientId);
                if (!patient) {
                    socket.emit('queue:error', { message: 'Patient not found in queue' });
                    return;
                }

                patient.status = status;
                await queue.save();

                io.to(`queue:${queueId}`).emit('queue:updated', {
                    queueId,
                    patients: queue.patients,
                    currentPatients: queue.currentPatients
                });
            } catch (error) {
                socket.emit('queue:error', { message: error.message });
            }
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });

        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    return io;
};