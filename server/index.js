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
import mongoose from 'mongoose';
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
import cookieParser from 'cookie-parser';

const app = express();

const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use('/api/', limiter);

// Middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:5173", "https://mycarebridge.onrender.com", "http://127.0.0.1:5500"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api/auth', authRoutes);
app.use('/api/hospital', middleware, hospitalRoutes);
app.use('/api/doctors', middleware, doctorRoutes);
app.use('/api/appointments', middleware, appointmentRoutes);
app.use("/api/queue", middleware, QueueRoutes);

app.get("/", (req, res) => {
    res.send("I will show these mfs who i am ");
});

app.get("/health", (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO with queue functionality
const io = SetupSocket(server);

// Make io accessible to routes
app.set('io', io);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err
    });
});

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("Connected to MongoDB");
        server.listen(PORT, async () => {
            try {
                await ConnectDb();
                console.log(`Server is running on port ${PORT}`);
                console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            } catch (err) {
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


