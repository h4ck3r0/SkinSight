import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Home from "./components/Home";
import Login from "./components/Login";
import Signup from "./components/Signup";
import PatientDashBroad from "./components/PatientDashBroad";
import DoctorDashboard from "./components/DoctorDashboard";
import HospitalDashborad from "./components/HospitalDashborad";
import HospitalSelection from "./components/HospitalSelection";
import ChatWidget from "./components/ChatWidget";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import SkinSightFeatures from "./components/features";
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Toaster position="top-center" />
        <Router>
          <div className="min-h-screen bg-gray-100">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path='/features' element={<SkinSightFeatures/>}/>
              <Route
                path="/patient"
                element={
                  <ProtectedRoute roles={['patient']}>
                    <PatientDashBroad />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/doctor"
                element={
                  <ProtectedRoute roles={['doctor']}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hospital"
                element={
                  <ProtectedRoute roles={['staff']}>
                    <HospitalDashborad />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hospital-selection"
                element={
                  <ProtectedRoute roles={['staff', 'doctor']}>
                    <HospitalSelection />
                  </ProtectedRoute>
                }
              />
            </Routes>
            <ChatWidget />
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
