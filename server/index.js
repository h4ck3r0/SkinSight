import dotenv from 'dotenv';
dotenv.config();
console.log('Environment variables:', {
    PORT: process.env.PORT,
    MONGO_URL: process.env.MONGO_URL
});

import express from 'express'
import http from "http"
import cors from "cors"
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import SetupSocket from './socket.js';
import authRoutes from './routes/AuthRoutes.js'
import ConnectDb from './ConnectDb.js'
import hospitalRoutes from './routes/HospitalRoutes.js'
import doctorRoutes from './routes/DoctorRoutes.js'
import appointmentRoutes from './routes/AppointmentRoutes.js'
import QueueRoutes from './routes/QueueRoutes.js'
import { middleware } from './middleware/middleware.js';
import { Server } from "socket.io";
import mongoose from "mongoose";

const app=express();

const PORT = process.env.PORT || 5000;

// CORS configuration
const allowedOrigins = ['http://localhost:5173', 'https://mycarebridge.onrender.com'];
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use('/api/auth',authRoutes);
app.use('/api/hospital',middleware,hospitalRoutes)
app.use('/api/doctors',middleware,doctorRoutes);
app.use('/api/appointments',middleware,appointmentRoutes);
app.use("/api/queue",middleware,QueueRoutes);

app.get("/",(req,res)=>{
    res.send("I will show these mfs who i am ");
})

app.get("/health", (req, res) => {
    res.status(200).json({ status: 'healthy' });
});
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err
    });
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "https://mycarebridge.onrender.com"],
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    }
});

SetupSocket(server);

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_queue_room", (doctorId) => {
        socket.join(`queue:${doctorId}`);
        console.log(`Client joined queue room for doctor: ${doctorId}`);
    });

    socket.on("leave_queue_room", (doctorId) => {
        socket.leave(`queue:${doctorId}`);
        console.log(`Client left queue room for doctor: ${doctorId}`);
    });

    socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
    });
});

const mongoUrl = process.env.MONGO_URL;
if (!mongoUrl) {
    console.error("MONGO_URL is not defined in environment variables");
    process.exit(1);
}

mongoose.connect(mongoUrl)
    .then(() => {
        console.log("Connected to MongoDB");
        server.listen(PORT,async ()=>{
            try{
               await ConnectDb();
                console.log(`Server is running on port ${PORT}`);
                console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            }catch(err){
                console.error("Server startup error:", err);
                process.exit(1);
            }
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    if (process.env.NODE_ENV === 'production') {
        console.error('Unhandled Promise Rejection:', err);
    } else {
        process.exit(1);
    }
});

export { io };


