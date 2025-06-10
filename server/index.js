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
import { Server } from 'socket.io';
import { SetupSocket } from './socket.js';
import authRoutes from './routes/AuthRoutes.js'
import ConnectDb from './ConnectDb.js'
import hospitalRoutes from './routes/HospitalRoutes.js'
import doctorRoutes from './routes/DoctorRoutes.js'
import appointmentRoutes from './routes/AppointmentRoutes.js'
import QueueRoutes from './routes/QueueRoutes.js'
import { middleware } from './middleware/middleware.js';
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import cookieParser from 'cookie-parser';

const app=express();

const PORT = process.env.PORT || 5000;

// Trust proxy - important for rate limiting behind a reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

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

// Create HTTP server
const httpServer = http.createServer(app);

// Simple Socket.IO setup
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true
    }
});

// Basic socket connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinQueue', (data) => {
        const { doctorId, hospitalId } = data;
        const room = `queue:${doctorId}:${hospitalId}`;
        socket.join(room);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Make io accessible to routes
app.set('io', io);

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("Connected to MongoDB");
        httpServer.listen(PORT,async ()=>{
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


