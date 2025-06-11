import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import axios from 'axios';
import { SetupSocket } from './socket.js';
import authRoutes from './routes/AuthRoutes.js';
import doctorRoutes from './routes/DoctorRoutes.js';
import hospitalRoutes from './routes/HospitalRoutes.js';
import appointmentRoutes from './routes/AppointmentRoutes.js';
import QueueRoutes from './routes/QueueRoutes.js';
import { middleware } from './middleware/middleware.js';
import cookieParser from 'cookie-parser';

dotenv.config();
console.log('Environment variables:', {
    PORT: process.env.PORT,
    MONGO_URL: process.env.MONGO_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
});

// OpenAI API configuration
const API_BASE_URL = 'https://api.aimlapi.com/v1';
const API_KEY = process.env.OPENAI_API_KEY;

console.log('API Configuration:', {
    API_BASE_URL,
    API_KEY_EXISTS: !!API_KEY,
    API_KEY_LENGTH: API_KEY ? API_KEY.length : 0
});

const callAPI = async (endpoint, data, headers = {}) => {
    try {
        if (!API_KEY) {
            throw new Error('OpenAI API key is not configured');
        }
        
        const response = await axios.post(`${API_BASE_URL}${endpoint}`, data, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': '*/*',
                ...headers
            }
        });
        return response.data;
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error.response?.data || error.message);
        throw error;
    }
};

const mockOcrResponse = (text) => ({
    pages: [{
        text: text || 'Sample medical report text. Patient shows normal vital signs...',
        page_number: 1
    }]
});


const app = express();
const server = createServer(app);

const io = SetupSocket(server);

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:5173", "https://mycarebridge.onrender.com", "http://127.0.0.1:5500","https://skinsight.netlify.app"],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Chat endpoint
const apiRouter = express.Router();

// Test endpoint to verify routing
apiRouter.get('/test', (req, res) => {
    res.json({ message: 'API router is working!' });
});

apiRouter.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        console.log('Sending chat message:', message);

        const apiResponse = await callAPI('/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [
                { role: "user", content: message }
            ]
        });

        const responseText = apiResponse.choices?.[0]?.message?.content;
        if (!responseText) {
            throw new Error('Invalid response from chat API');
        }

        console.log('Chat response received');
        res.json({ response: responseText });

    } catch (error) {
        console.error('Chat error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to process chat message',
            details: error.response?.data || error.message
        });
    }
});

// Image analysis endpoint
apiRouter.post('/analyze-image', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'Image data is required' });
        }

        console.log('Processing image...');
        const ocrResponse = mockOcrResponse();
        const extractedText = ocrResponse.pages[0].text;

        const analysisResponse = await callAPI('/chat/completions', {
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a medical expert. Analyze the given medical report text and provide a clear summary."
                },
                {
                    role: "user",
                    content: `Analyze this medical report text and provide a clear summary:\n\n${extractedText}`
                }
            ]
        });

        const analysis = analysisResponse.choices?.[0]?.message?.content;
        if (!analysis) {
            throw new Error('Failed to analyze the medical text');
        }

        res.json({
            text: extractedText,
            analysis: analysis
        });

    } catch (error) {
        console.error('Image analysis error:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to analyze image',
            details: error.response?.data || error.message
        });
    }
});

// Mount API routes FIRST
app.use('/api', apiRouter);

app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

app.use('/api/auth', authRoutes);
app.use('/api/hospital', hospitalRoutes);
app.use('/api/doctors', middleware, doctorRoutes);
app.use('/api/appointments', middleware, appointmentRoutes);
app.use('/api/queue', middleware, QueueRoutes);

app.get("/", (req, res) => {
    res.send("I will show these mfs who i am ");
});

app.get("/health", (req, res) => {
    res.status(200).json({ status: 'healthy' });
});

app.set('io', io);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Something went wrong!",
        error: process.env.NODE_ENV === "production" ? {} : err,
    });
});

mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
        console.log("Connected to MongoDB");
        const PORT = process.env.PORT || 5000;
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1);
    });

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    if (process.env.NODE_ENV === 'production') {
        console.error('Unhandled Promise Rejection:', err);
    } else {
        process.exit(1);
    }
});


