import { useEffect, useState } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import QueueSystem from "./QueueSystem";

const API_URL = import.meta.env.VITE_API_URL || 'https://mycarebridge.onrender.com/api';

const PatientDashBroad = () => {
    const navigate = useNavigate();
    const { location, error: locationError } = useGeolocation();
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [allhospitals, setAllHospitals] = useState([]);
    const [isgetAll, SetgetAll] = useState(false);
    const [searchedTerm, SetSearchedTerm] = useState("");
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [doctorsMap, setDoctorsMap] = useState({});
    const [activeTab, setActiveTab] = useState('hospitals');
    
    // New state variables for appointment and queue
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [user, setUser] = useState(null);
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchAppointments(parsedUser._id);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        if (location) {
            console.log("Location updated:", location);
            GetnearByHospital();
        }
    }, [location]);

    const GetnearByHospital = async () => {
        try {
            setLoading(true);
            setError(null);
            
            if (!location?.lat || !location?.lng) {
                console.log("Location not available:", location);
                setError("Location not available. Please ensure location access is enabled.");
                return;
            }

            const latitude = parseFloat(location.lat);
            const longitude = parseFloat(location.lng);

            if (isNaN(latitude) || isNaN(longitude)) {
                setError("Invalid location coordinates. Please try refreshing the page.");
                return;
            }

            console.log("Fetching nearby hospitals for:", { latitude, longitude });
            
            const response = await axios.get(
                `${API_URL}/hospital/nearby/${latitude}/${longitude}`
            );

            console.log("Nearby hospitals response:", response.data);

            if (response.data && response.data.success) {
                const hospitalList = response.data.hospitals || [];
                console.log("Setting hospitals:", hospitalList);
                setHospitals(hospitalList);
            } else {
                console.error("Invalid response format:", response.data);
                setError("Failed to fetch hospitals. Please try again.");
            }
        } catch (err) {
            console.error("Error fetching hospitals:", err);
            setError(err.response?.data?.message || "Failed to fetch hospitals. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getAllHospitals = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.get(`${API_URL}/hospital`);

            if (response.data && response.data.hospitals) {
                const hospitalList = response.data.hospitals;
                setAllHospitals(hospitalList);
                SetgetAll(!isgetAll);
            }
        } catch (err) {
            console.error("Error fetching all hospitals:", err);
            setError("Failed to fetch all hospitals. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAppointment = async (hospital, doctor) => {
        try {
            setLoading(true);
            setError(null);

            if (!doctor?._id) {
                setError("Doctor ID is missing. Please try again.");
                return;
            }

            if (!user?._id) {
                setError("User not logged in. Please login again.");
                return;
            }

            const now = new Date();
            const date = now.toISOString().split('T')[0];
            const time = "09:00";

            const response = await axios.post(
                `${API_URL}/appointments/create`,
                {
                    doctor: doctor._id,
                    patient: user._id,
                    hospital: hospital._id,
                    appointmentTime: time,
                    appointmentDate: date,
                    reason: "General checkup"
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data && response.data.appointment) {
                alert("Appointment created successfully!");
                fetchAppointments(user._id);
            }
        } catch (err) {
            console.error("Error creating appointment:", err);
            setError(err.response?.data?.message || "Failed to create appointment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async (userId) => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/appointments/patient/${userId}`);
            if (response.data && response.data.appointments) {
                setAppointments(response.data.appointments);
            } else {
                setAppointments([]);
            }
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setError(err.response?.data?.message || "Failed to fetch appointments");
        } finally {
            setLoading(false);
        }
    };

    const handleJoinQueue = (hospital, doctor) => {
        setSelectedHospital(hospital);
        setSelectedDoctor(doctor);
        setActiveTab('queue');
    };

    // Enhanced hospital selection for queue
    const handleHospitalSelection = (hospitalId) => {
        const hospital = allHospitalsList.find(h => h._id === hospitalId);
        if (hospital) {
            setSelectedHospital(hospital);
            setSelectedDoctor(null);
        }
    };

    // Combine both hospital lists for search
    const allHospitalsList = [...hospitals, ...allhospitals];
    
    const filterHospitals = allHospitalsList.filter((hospital) => {
        const term = searchedTerm.toLowerCase();
        return (
            (hospital.name && hospital.name.toLowerCase().includes(term)) ||
            (hospital.address && hospital.address.toLowerCase().includes(term)) ||
            (hospital.city && hospital.city.toLowerCase().includes(term)) ||
            (hospital.state && hospital.state.toLowerCase().includes(term)) ||
            (hospital.doctors && hospital.doctors.some(doctor => {
                const doctorName = doctor.user ? 
                    `${doctor.user.firstName} ${doctor.user.lastName}` : 
                    (doctor.firstName ? `${doctor.firstName} ${doctor.lastName}` : doctor.name || '');
                return doctorName.toLowerCase().includes(term) || 
                       (doctor.specialization && doctor.specialization.toLowerCase().includes(term));
            }))
        );
    });

    if (locationError) {
        return (
            <div className="min-h-screen bg-[#A6DCEF]/10 flex flex-col justify-center items-center">
                <div className="bg-white rounded-lg shadow-md p-8 max-w-lg w-full">
                    <h1 className="text-3xl font-bold mb-6 text-[#2C3E50] text-center">Patient Dashboard</h1>
                    <div className="text-red-500 text-center">
                        Error: {locationError}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#A6DCEF]/10">
            <div className="container mx-auto px-6 py-8">
                <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-100">
                    <h1 className="text-3xl font-bold mb-6 text-[#2C3E50] pb-2 border-b border-[#A6DCEF]">Patient Dashboard</h1>
                    
                    {/* Tab navigation */}
                    <nav className="flex space-x-6">
                        <button
                            onClick={() => setActiveTab('hospitals')}
                            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                activeTab === 'hospitals'
                                    ? 'bg-[#2C3E50] text-white shadow-md hover:opacity-90'
                                    : 'text-[#2C3E50] hover:bg-[#A6DCEF]/10'
                            }`}
                        >
                            Hospitals
                        </button>
                        <button
                            onClick={() => setActiveTab('appointments')}
                            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                activeTab === 'appointments'
                                    ? 'bg-[#2C3E50] text-white shadow-md hover:opacity-90'
                                    : 'text-[#2C3E50] hover:bg-[#A6DCEF]/10'
                            }`}
                        >
                            Appointments
                        </button>
                        <button
                            onClick={() => setActiveTab('queue')}
                            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                activeTab === 'queue'
                                    ? 'bg-[#2C3E50] text-white shadow-md hover:opacity-90'
                                    : 'text-[#2C3E50] hover:bg-[#A6DCEF]/10'
                            }`}
                        >
                            Queue Status
                        </button>
                    </nav>
                </div>

            {activeTab === 'hospitals' ? (
                <div className="space-y-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-8">
                            <input 
                                className="w-full px-6 py-3 rounded-lg text-[#2C3E50] border border-[#A6DCEF] focus:outline-none focus:ring-2 focus:ring-[#2C3E50] focus:border-transparent shadow-sm"
                                placeholder="Search hospitals by name, address, city, state, or doctor..."
                                value={searchedTerm}
                                onChange={(e) => {
                                    SetSearchedTerm(e.target.value);
                                    setShowSearchResults(e.target.value.length > 0);
                                }}
                            />
                        </div>

                        {loading && (
                            <div className="text-center py-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                                <p className="mt-2">Loading hospitals...</p>
                            </div>
                        )}
                        
                        {error && (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                                {error}
                            </div>
                        )}

                        {!loading && !error && hospitals.length === 0 && (
                            <div className="text-center py-4">
                                No hospitals found nearby
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(showSearchResults ? filterHospitals : hospitals).map((hospital) => (
                            <div key={hospital._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-100 hover:shadow-lg transition-shadow duration-200">
                                <h3 className="text-xl font-semibold mb-2 text-gray-800">{hospital.name}</h3>
                                <p className="text-gray-600 mb-2">{hospital.address}</p>
                                <p className="text-gray-600 mb-4">Phone: {hospital.phone}</p>
                                
                                {hospital.doctors && hospital.doctors.length > 0 ? (
                                    <div className="mt-4">
                                        <h4 className="font-medium mb-2 text-gray-800">Available Doctors:</h4>
                                        <div className="space-y-3">
                                            {hospital.doctors.map((doctor, index) => {
                                                // Handle different doctor data structures
                                                const doctorName = doctor.user ? 
                                                    `${doctor.user.firstName} ${doctor.user.lastName}` : 
                                                    (doctor.firstName ? `${doctor.firstName} ${doctor.lastName}` : doctor.name || 'Unknown Doctor');
                                                
                                                return (
                                                    <div key={doctor._id || index} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-all duration-200">
                                                        <p className="font-medium text-gray-800">
                                                            Dr. {doctorName}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Specialization: {doctor.specialization || 'General'}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Experience: {doctor.experience || 'N/A'} years
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Consultation Fee: ₹{doctor.consultationFee || 'N/A'}
                                                        </p>
                                                        {doctor.languages && (
                                                            <p className="text-sm text-gray-600">
                                                                Languages: {Array.isArray(doctor.languages) ? doctor.languages.join(', ') : doctor.languages}
                                                            </p>
                                                        )}
                                                        
                                                        <div className="flex gap-2 mt-3">
                                                            <button
                                                                onClick={() => handleAppointment(hospital, doctor)}
                                                                disabled={loading}
                                                                className="bg-[#2C3E50] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 shadow-sm hover:shadow-md transition-all duration-200"
                                                            >
                                                                {loading ? 'Booking...' : 'Book Appointment'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleJoinQueue(hospital, doctor)}
                                                                className="bg-[#2C3E50] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 shadow-sm hover:shadow-md transition-all duration-200"
                                                            >
                                                                Join Queue
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No doctors available at this hospital</p>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <button 
                            onClick={getAllHospitals}
                            disabled={loading}
                            className="bg-[#2C3E50] text-white px-6 py-3 rounded-lg hover:opacity-90 transition-all duration-200 disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : (isgetAll ? "Hide All Hospitals" : "Show All Hospitals")}
                        </button>
                    </div>
                </div>
            ) : activeTab === 'appointments' ? (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Appointments</h2>
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-2 text-gray-600">Loading appointments...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                            {error}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {appointments && appointments.length > 0 ? (
                                appointments.map((appointment) => (
                                    <div key={appointment._id} className="border rounded-lg p-6 bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-all duration-200">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg text-gray-800">
                                                    Dr. {appointment.doctor ? 
                                                        `${appointment.doctor.firstName || appointment.doctor.user?.firstName || ''} ${appointment.doctor.lastName || appointment.doctor.user?.lastName || ''}` : 
                                                        'Doctor Name Not Available'}
                                                </h3>
                                                <p className="text-gray-600">Hospital: {appointment.hospital?.name || 'Not specified'}</p>
                                                <p className="text-gray-600">Date: {new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                                                <p className="text-gray-600">Time: {appointment.appointmentTime}</p>
                                                <p className="text-gray-600">Reason: {appointment.reason || 'Not specified'}</p>
                                                <p className="text-gray-600">
                                                    Status: <span className={`font-medium ${
                                                        appointment.status === 'approved' ? 'text-green-600' : 
                                                        appointment.status === 'pending' ? 'text-yellow-600' : 
                                                        'text-red-600'
                                                    }`}>
                                                        {appointment.status || 'pending'}
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">No appointments scheduled</p>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Queue Status</h2>
                    {selectedDoctor && selectedHospital ? (
                        <div className="mb-6 p-6 bg-gradient-to-r from-[#A6DCEF]/20 to-white rounded-lg border border-[#A6DCEF] shadow-sm">
                            <h3 className="font-semibold text-[#2C3E50] mb-2">Selected Queue:</h3>
                            <p className="text-[#2C3E50]">
                                <strong>Doctor:</strong> Dr. {
                                    selectedDoctor.user ? 
                                        `${selectedDoctor.user.firstName} ${selectedDoctor.user.lastName}` : 
                                        (selectedDoctor.firstName ? `${selectedDoctor.firstName} ${selectedDoctor.lastName}` : selectedDoctor.name || 'Unknown')
                                } ({selectedDoctor.specialization})
                            </p>
                            <p className="text-blue-700">
                                <strong>Hospital:</strong> {selectedHospital.name}
                            </p>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 mb-4">Please select a doctor and hospital to view queue status</p>
                            <div className="flex flex-col space-y-4 max-w-md mx-auto">
                                <select
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900 shadow-sm"
                                    onChange={(e) => handleHospitalSelection(e.target.value)}
                                    value={selectedHospital?._id || ''}
                                >
                                    <option value="">Select Hospital</option>
                                    {allHospitalsList.map((hospital) => (
                                        <option key={hospital._id} value={hospital._id}>
                                            {hospital.name}
                                        </option>
                                    ))}
                                </select>

                                {selectedHospital && selectedHospital.doctors && selectedHospital.doctors.length > 0 && (
                                    <select
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-gray-900 shadow-sm"
                                        onChange={(e) => {
                                            const doctor = selectedHospital.doctors.find(d => d._id === e.target.value);
                                            setSelectedDoctor(doctor);
                                        }}
                                        value={selectedDoctor?._id || ''}
                                    >
                                        <option value="">Select Doctor</option>
                                        {selectedHospital.doctors.map((doctor) => {
                                            const doctorName = doctor.user ? 
                                                `${doctor.user.firstName} ${doctor.user.lastName}` : 
                                                (doctor.firstName ? `${doctor.firstName} ${doctor.lastName}` : doctor.name || 'Unknown Doctor');
                                            return (
                                                <option key={doctor._id} value={doctor._id}>
                                                    Dr. {doctorName} - {doctor.specialization}
                                                </option>
                                            );
                                        })}
                                    </select>
                                )}
                            </div>
                        </div>
                    )}
                    

                    {selectedDoctor && selectedHospital && (
                        <QueueSystem
                            doctorId={selectedDoctor.user}
                            hospitalId={selectedHospital._id}
                            role="patient"
                        />
                    )}
                </div>
            )}
            </div>
        </div>
    );
};

export default PatientDashBroad;