import { useEffect, useState } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import QueueSystem from "./QueueSystem";
import Navigation from "./Navigation";
import { toast } from "react-hot-toast";

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
    
    // Appointment form state
    const [appointmentDate, setAppointmentDate] = useState('');
    const [appointmentTime, setAppointmentTime] = useState('');
    const [appointmentReason, setAppointmentReason] = useState('');
    const [showAppointmentForm, setShowAppointmentForm] = useState(false);

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
                
                // Create doctors map
                const doctorsMap = {};
                hospitalList.forEach(hospital => {
                    if (hospital.doctors && Array.isArray(hospital.doctors)) {
                        doctorsMap[hospital._id] = hospital.doctors;
                    }
                });
                setDoctorsMap(doctorsMap);
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
            console.log('GetAllHospitals response:', response.data);

            if (response.data && response.data.hospitals) {
                const hospitalList = response.data.hospitals;
                console.log('Setting allhospitals:', hospitalList);
                setAllHospitals(hospitalList);
                SetgetAll(!isgetAll);
                
                // Create doctors map for all hospitals
                const doctorsMap = {};
                hospitalList.forEach(hospital => {
                    if (hospital.doctors && Array.isArray(hospital.doctors)) {
                        doctorsMap[hospital._id] = hospital.doctors;
                    }
                });
                setDoctorsMap(prev => ({ ...prev, ...doctorsMap }));
            }
        } catch (err) {
            console.error("Error fetching all hospitals:", err);
            setError("Failed to fetch all hospitals. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleBookAppointment = (hospital, doctor) => {
        setSelectedHospital(hospital);
        setSelectedDoctor(doctor);
        setShowAppointmentForm(true);
        setAppointmentDate('');
        setAppointmentTime('');
        setAppointmentReason('');
    };

    const handleJoinQueue = (hospital, doctor) => {
        console.log('handleJoinQueue called with:', { hospital, doctor });
        
        // Get the correct doctor ID - use user._id if available, otherwise fallback to doctor._id
        const doctorId = doctor.user?._id || doctor._id;
        console.log('Doctor ID (user):', doctor.user?._id);
        console.log('Doctor ID (profile):', doctor._id);
        console.log('Using Doctor ID:', doctorId);
        console.log('Hospital ID:', hospital._id);
        
        if (!doctorId) {
            toast.error('Doctor ID is missing. Please try again.');
            return;
        }
        
        if (!hospital._id) {
            toast.error('Hospital ID is missing. Please try again.');
            return;
        }
        
        // Create a modified doctor object with the correct ID
        const doctorWithCorrectId = {
            ...doctor,
            _id: doctorId // Use the user ID for queue operations
        };
        
        setSelectedHospital(hospital);
        setSelectedDoctor(doctorWithCorrectId);
        setActiveTab('queue');
    };

    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        
        // Get the correct doctor ID - use user._id if available, otherwise fallback to doctor._id
        const doctorId = selectedDoctor.user?._id || selectedDoctor._id;
        
        if (!doctorId || !selectedHospital?._id) {
            toast.error("Please select a doctor and hospital");
            return;
        }

        if (!appointmentDate || !appointmentTime || !appointmentReason) {
            toast.error("Please fill in all appointment details");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/appointments/create`,
                {
                    doctor: doctorId, // Use the correct doctor ID
                    patient: user._id,
                    hospital: selectedHospital._id,
                    appointmentDate,
                    appointmentTime,
                    reason: appointmentReason
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                toast.success("Appointment created successfully!");
                setShowAppointmentForm(false);
                setAppointmentDate('');
                setAppointmentTime('');
                setAppointmentReason('');
                setSelectedHospital(null);
                setSelectedDoctor(null);
                // Refresh appointments
                fetchAppointments(user._id);
            }
        } catch (err) {
            console.error("Error creating appointment:", err);
            const errorMessage = err.response?.data?.message || "Failed to create appointment";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/appointments/patient/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            
            if (response.data && response.data.appointments) {
                setAppointments(response.data.appointments);
            }
        } catch (err) {
            console.error("Error fetching appointments:", err);
        }
    };

    const handleHospitalSelection = (hospitalId) => {
        navigate(`/hospital-selection/${hospitalId}`);
    };

    const filteredHospitals = searchedTerm
        ? (isgetAll ? allhospitals : hospitals).filter(hospital =>
            hospital.name.toLowerCase().includes(searchedTerm.toLowerCase()) ||
            hospital.address.toLowerCase().includes(searchedTerm.toLowerCase())
        )
        : (isgetAll ? allhospitals : hospitals);

    const currentHospitals = isgetAll ? allhospitals : hospitals;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Navigation />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                    Welcome back, {user?.name || 'Patient'}! 👋
                                </h1>
                                <p className="text-gray-600">
                                    Find nearby hospitals, book appointments, and manage your healthcare needs.
                                </p>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span>Location services active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Nearby Hospitals</p>
                                <p className="text-2xl font-bold text-gray-900">{hospitals.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Your Appointments</p>
                                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Available Doctors</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {Object.values(doctorsMap).flat().length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('hospitals')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                    activeTab === 'hospitals'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    <span>Hospitals</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('appointments')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                    activeTab === 'appointments'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span>Appointments</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('queue')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                    activeTab === 'queue'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span>Queue</span>
                                </div>
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Search and Filter Section */}
                        <div className="mb-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search hospitals..."
                                            value={searchedTerm}
                                            onChange={(e) => SetSearchedTerm(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={GetnearByHospital}
                                        disabled={loading}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                        Nearby
                                    </button>
                                    <button
                                        onClick={getAllHospitals}
                                        disabled={loading}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                        </svg>
                                        All
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content based on active tab */}
                        {activeTab === 'hospitals' && (
                            <div>
                                {error && (
                                    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                        {error}
                                    </div>
                                )}

                                {loading ? (
                                    <div className="flex justify-center items-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {filteredHospitals.map((hospital) => (
                                            <div key={hospital._id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-200">
                                                <div className="p-6">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                                {hospital.name}
                                                            </h3>
                                                            <p className="text-sm text-gray-600 mb-2">
                                                                {hospital.address}
                                                            </p>
                                                            <div className="flex items-center text-sm text-gray-500">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                                </svg>
                                                                {hospital.phone}
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mb-4">
                                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Services:</h4>
                                                        <div className="flex flex-wrap gap-1">
                                                            {hospital.service?.slice(0, 3).map((service, index) => (
                                                                <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                    {service}
                                                                </span>
                                                            ))}
                                                            {hospital.service?.length > 3 && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                    +{hospital.service.length - 3} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {doctorsMap[hospital._id] && doctorsMap[hospital._id].length > 0 && (
                                                        <div className="mb-4">
                                                            <h4 className="text-sm font-medium text-gray-900 mb-2">Available Doctors:</h4>
                                                            <div className="space-y-2">
                                                                {doctorsMap[hospital._id].slice(0, 2).map((doctor) => (
                                                                    <div key={doctor._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                                        <div>
                                                                            <p className="text-sm font-medium text-gray-900">
                                                                                {doctor.user ? 
                                                                                    `${doctor.user.firstName || ''} ${doctor.user.lastName || ''}`.trim() || 'Unknown Doctor' 
                                                                                    : doctor.name || 'Unknown Doctor'
                                                                                }
                                                                            </p>
                                                                            <p className="text-xs text-gray-600">{doctor.specialization}</p>
                                                                        </div>
                                                                        <div className="flex space-x-1">
                                                                            <button
                                                                                onClick={() => handleBookAppointment(hospital, doctor)}
                                                                                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                                                                            >
                                                                                Book
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleJoinQueue(hospital, doctor)}
                                                                                className="px-3 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                                                                            >
                                                                                Queue
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {doctorsMap[hospital._id].length > 2 && (
                                                                    <p className="text-xs text-gray-500 text-center">
                                                                        +{doctorsMap[hospital._id].length - 2} more doctors
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => handleHospitalSelection(hospital._id)}
                                                            className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                                                        >
                                                            View Details
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {!loading && filteredHospitals.length === 0 && (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hospitals found</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {searchedTerm ? 'Try adjusting your search terms.' : 'No hospitals available in your area.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'appointments' && (
                            <div>
                                <div className="mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Appointments</h2>
                                    {appointments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
                                            <p className="mt-1 text-sm text-gray-500">You haven't booked any appointments yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {appointments.map((appointment) => (
                                                <div key={appointment._id} className="bg-white border border-gray-200 rounded-lg p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <h3 className="text-lg font-medium text-gray-900">
                                                                Dr. {appointment.doctor?.name || 'Unknown Doctor'}
                                                            </h3>
                                                            <p className="text-sm text-gray-600">
                                                                {appointment.hospital?.name || 'Unknown Hospital'}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                {new Date(appointment.appointmentDate).toLocaleDateString()} at {appointment.appointmentTime}
                                                            </p>
                                                            <p className="text-sm text-gray-500">
                                                                Reason: {appointment.reason}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                appointment.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                                appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'
                                                            }`}>
                                                                {appointment.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'queue' && (
                            <div>
                                {selectedHospital && selectedDoctor ? (
                                    <QueueSystem
                                        doctorId={selectedDoctor._id}
                                        hospitalId={selectedHospital._id}
                                        role="patient"
                                    />
                                ) : (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">Select a doctor to join queue</h3>
                                        <p className="mt-1 text-sm text-gray-500">Choose a hospital and doctor from the Hospitals tab to join their queue.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Appointment Form Modal */}
            {showAppointmentForm && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Book Appointment</h3>
                            <form onSubmit={handleAppointmentSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Doctor
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedDoctor?.user ? 
                                            `${selectedDoctor.user.firstName || ''} ${selectedDoctor.user.lastName || ''}`.trim() || 'Unknown Doctor'
                                            : selectedDoctor?.name || ''
                                        }
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Hospital
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedHospital?.name || ''}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={appointmentDate}
                                        onChange={(e) => setAppointmentDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Time
                                    </label>
                                    <input
                                        type="time"
                                        value={appointmentTime}
                                        onChange={(e) => setAppointmentTime(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason
                                    </label>
                                    <textarea
                                        value={appointmentReason}
                                        onChange={(e) => setAppointmentReason(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        rows="3"
                                        placeholder="Describe your symptoms or reason for visit..."
                                        required
                                    />
                                </div>
                                <div className="flex space-x-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                    >
                                        {loading ? 'Booking...' : 'Book Appointment'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowAppointmentForm(false)}
                                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDashBroad;