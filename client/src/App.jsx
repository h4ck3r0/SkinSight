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

function App() {
  const [count, setCount] = useState(0)

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/patient" element={<PatientDashBroad />} />
          <Route path="/doctor" element={<DoctorDashBoard />} />
          <Route path='/hospital' element={<HospitalDashBoard/>}/>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
