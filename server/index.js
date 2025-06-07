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
const app=express();

const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Other middleware
app.use(compression());
app.use(morgan('dev'));
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

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'production' ? {} : err
    });
});

const server = http.createServer(app);
SetupSocket(server);

server.listen(PORT,async ()=>{
    try{
       await ConnectDb();
        console.log(`Server is running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    }catch(err){
        console.error("Server startup error:", err);
        process.exit(1);
    }
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    // Don't crash the server in production
    if (process.env.NODE_ENV === 'production') {
        console.error('Unhandled Promise Rejection:', err);
    } else {
        process.exit(1);
    }
});


