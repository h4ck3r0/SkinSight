# 🏥 SkinSight - AI-Powered Healthcare Platform

<div align="center">

![SkinSight Logo](https://img.shields.io/badge/SkinSight-Healthcare%20AI-blue?style=for-the-badge&logo=medical)

**Revolutionizing healthcare with AI-powered skin analysis, intelligent chat assistance, and comprehensive hospital management**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-SkinSight-green?style=for-the-badge&logo=netlify)](https://skinsight.netlify.app)
[![ML Service](https://img.shields.io/badge/ML%20Service-Active-blue?style=for-the-badge&logo=python)](https://skinsight-ml.onrender.com)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Quick Start](#-quick-start) • [API Documentation](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 🌟 Overview

SkinSight is a cutting-edge healthcare management platform that combines traditional hospital management with advanced AI capabilities. The platform serves patients, doctors, and hospital staff with features ranging from AI-powered skin condition analysis to intelligent medical report interpretation.

### 🎯 Key Highlights

- **🤖 AI-Powered Skin Analysis**: Upload skin images for instant condition detection using deep learning
- **💬 Intelligent Medical Assistant**: AI chat bot for medical report analysis and health insights
- **🏥 Comprehensive Hospital Management**: Complete appointment and queue management system
- **📱 Real-time Communication**: Live video calls and instant messaging between patients and doctors
- **🔒 Secure & Scalable**: JWT authentication with role-based access control

---

## ✨ Features

### 🎨 For Patients
- **Smart Hospital Discovery**: Find nearby hospitals with advanced filtering
- **AI Skin Analysis**: Upload photos for instant skin condition detection
- **Intelligent Medical Assistant**: Get insights on medical reports and test results
- **Appointment Booking**: Easy appointment scheduling with real-time availability
- **Queue Management**: Join virtual queues and track your position
- **Video Consultations**: Secure video calls with healthcare providers
- **Medical History**: Complete appointment and consultation history

### 👨‍⚕️ For Doctors
- **Patient Management**: View and manage patient appointments
- **Queue Control**: Real-time queue management and patient flow
- **Video Consultations**: Conduct secure video calls with patients
- **Profile Management**: Comprehensive doctor profile setup
- **Hospital Association**: Connect with multiple healthcare facilities

### 🏥 For Hospital Staff
- **Hospital Dashboard**: Complete hospital management interface
- **Doctor Management**: Manage doctor profiles and schedules
- **Queue Monitoring**: Real-time queue status and management
- **Appointment Oversight**: Monitor and manage all appointments

### 🤖 AI Features
- **Skin Condition Detection**: Deep learning model for skin disease classification
- **Medical Report Analysis**: AI-powered interpretation of medical documents
- **Intelligent Chat**: Context-aware medical assistance
- **OCR Integration**: Extract text from medical images and documents

---

## 🛠 Tech Stack

### Frontend
- **React 19** - Modern UI framework with hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Router DOM** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client for API calls
- **React Hot Toast** - User notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **OpenAI API** - AI-powered chat and analysis

### AI/ML Services
- **Python Flask** - ML service framework
- **PyTorch** - Deep learning framework
- **ResNet-50** - Pre-trained CNN for image classification
- **OpenAI GPT-4** - Advanced language model for medical assistance

### DevOps & Deployment
- **Netlify** - Frontend hosting
- **Render** - Backend and ML service hosting
- **MongoDB Atlas** - Cloud database
- **Environment Variables** - Secure configuration management

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18.0.0 or higher)
- **npm** or **yarn** package manager
- **MongoDB** instance (local or MongoDB Atlas)
- **Python 3.8+** (for ML service)
- **OpenAI API Key** (for AI features)

### 📦 Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/SkinSight.git
cd SkinSight
```

#### 2. Backend Setup

```bash
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Configure your `.env` file:

```env
PORT=5000
MONGO_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=development
```

```bash
# Start development server
npm run dev
```

#### 3. Frontend Setup

```bash
cd ../client

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Configure your `.env` file:

```env
VITE_API_URL=http://localhost:5000
```

```bash
# Start development server
npm run dev
```

#### 4. ML Service Setup (Optional)

```bash
cd ../server/ml

# Install Python dependencies
pip install -r requirements.txt

# Start ML service
python app.py
```

### 🌐 Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **ML Service**: http://localhost:5001

---

## 📚 API Documentation

### Authentication Endpoints

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/profile
```

### Hospital Management

```http
GET    /api/hospitals
POST   /api/hospitals
GET    /api/hospitals/:id
PUT    /api/hospitals/:id
DELETE /api/hospitals/:id
```

### Appointment System

```http
GET    /api/appointments
POST   /api/appointments
PUT    /api/appointments/:id
DELETE /api/appointments/:id
```

### Queue Management

```http
GET    /api/queues
POST   /api/queues/join
PUT    /api/queues/:id
DELETE /api/queues/:id
```

### AI Services

```http
POST /api/chat
POST /api/analyze-image
POST /api/ocr
```

### ML Service Endpoints

```http
GET  /ml/health
POST /ml/predict
```

---

## 🏗 Project Structure

```
SkinSight/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   │   ├── components/    # React components
│   │   ├── context/       # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── constants/     # Application constants
│   │   └── assets/        # Images and icons
│   ├── package.json
│   └── vite.config.js
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── ml/              # Python ML service
│   │   ├── app.py       # Flask ML API
│   │   ├── best_resnet50_model.pth
│   │   └── requirements.txt
│   ├── socket.js        # Socket.IO configuration
│   └── index.js         # Main server file
└── README.md
```

---

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=5000
MONGO_URL=mongodb://localhost:27017/skinsight
JWT_SECRET=your_super_secret_jwt_key
OPENAI_API_KEY=sk-your_openai_api_key
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_ML_SERVICE_URL=http://localhost:5001
```

### Database Setup

1. **Local MongoDB**:
   ```bash
   mongod --dbpath /path/to/your/data/directory
   ```

2. **MongoDB Atlas**:
   - Create a cluster at [MongoDB Atlas](https://cloud.mongodb.com)
   - Get your connection string
   - Update `MONGO_URL` in your `.env` file

---

## 🚀 Deployment

### Frontend (Netlify)

1. Build the project:
   ```bash
   cd client
   npm run build
   ```

2. Deploy to Netlify:
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `dist`

### Backend (Render/Heroku)

1. **Render**:
   - Connect your GitHub repository
   - Set build command: `npm install`
   - Set start command: `npm start`
   - Add environment variables

2. **Heroku**:
   ```bash
   heroku create your-app-name
   heroku config:set MONGO_URL=your_mongodb_url
   heroku config:set JWT_SECRET=your_jwt_secret
   git push heroku main
   ```

### ML Service (Render)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python app.py`

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT-4 API
- **MongoDB** for the database solution
- **Netlify** and **Render** for hosting services
- **Tailwind CSS** for the beautiful UI framework
- **React** team for the amazing frontend framework

---

## 📞 Support

- **Live Demo**: [https://skinsight.netlify.app](https://skinsight.netlify.app)
- **ML Service**: [https://skinsight-ml.onrender.com](https://skinsight-ml.onrender.com)
- **Issues**: [GitHub Issues](https://github.com/yourusername/SkinSight/issues)
- **Email**: support@skinsight.com

---

<div align="center">

**Made with ❤️ for better healthcare**

[![GitHub stars](https://img.shields.io/github/stars/yourusername/SkinSight?style=social)](https://github.com/yourusername/SkinSight)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/SkinSight?style=social)](https://github.com/yourusername/SkinSight)

</div>
