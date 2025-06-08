import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Home from './components/Home.jsx'
import Login from './components/Login.jsx'
import Signup from './components/Signup.jsx'
import DoctorDashBoard from './components/DoctorDashBroard.jsx'
import PatientDashBroad from './components/PatientDashBroad.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import HospitalDashBoard from './components/HospitalDashborad.jsx'
import HospitalSelection from './components/HospitalSelection.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'

function App() {
  const [count, setCount] = useState(0)

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
                    <Route path="/patient" element={
            <ProtectedRoute roles={['patient']}>
              <PatientDashBroad />
            </ProtectedRoute>
          } />
          
          <Route path="/doctor" element={
            <ProtectedRoute roles={['doctor']}>
              <DoctorDashBoard />
            </ProtectedRoute>
          } />
          
          <Route path="/hospital" element={
            <ProtectedRoute roles={['staff']}>
              <HospitalDashBoard />
            </ProtectedRoute>
          } />
          
          <Route path="/hospital-selection" element={
            <ProtectedRoute roles={['staff', 'doctor']}>
              <HospitalSelection />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
