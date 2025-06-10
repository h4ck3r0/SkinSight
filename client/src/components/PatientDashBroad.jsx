import { useEffect, useState } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import QueueSystem from "./QueueSystem";

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
    const [activeTab, setActiveTab] = useState('hospitals'); // 'hospitals', 'appointments', or 'queue'
    
    // New state variables for appointment
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [appointmentReason, setAppointmentReason] = useState("");
    const [showAppointmentForm, setShowAppointmentForm] = useState(false);
    const [user, setUser] = useState(null);
    const [appointments, setAppointments] = useState([]);

    const fetchDoctorDetails = async (doctorId) => {
        try {
            const response = await axios.get("https://mycarebridge.onrender.com/api/doctors/getall");
            if (response.data && response.data.doctors) {
                const doctor = response.data.doctors.find(d => d._id === doctorId);
                if (doctor) {
                    return {
                        _id: doctor._id,
                        name: `${doctor.user.firstName} ${doctor.user.lastName}`,
                        specialization: doctor.specialization,
                        experience: doctor.experience,
                        consultationFee: doctor.consultationFee,
                        languages: doctor.languages,
                        bio: doctor.bio,
                        hospital: doctor.hospital,
                        availability: doctor.availability
                    };
                }
            }
            return null;
        } catch (err) {
            console.error("Error fetching doctor details:", err);
            return null;
        }
    };

    // Function to fetch all doctors for a hospital
    const fetchHospitalDoctors = async (hospital) => {
        if (!hospital.doctors || !Array.isArray(hospital.doctors)) return [];
        
        try {
            const response = await axios.get("https://mycarebridge.onrender.com/api/doctors/getall");
            if (!response.data || !response.data.doctors) return [];
            const allDoctors = response.data.doctors.reduce((acc, doctor) => {
                acc[doctor._id] = {
                    _id: doctor._id,
                    name: `${doctor.user.firstName} ${doctor.user.lastName}`,
                    specialization: doctor.specialization,
                    experience: doctor.experience,
                    consultationFee: doctor.consultationFee,
                    languages: doctor.languages,
                    bio: doctor.bio,
                    hospital: doctor.hospital,
                    availability: doctor.availability
                };
                return acc;
            }, {});

            setDoctorsMap(allDoctors);
            return hospital.doctors
                .map(doctorId => allDoctors[doctorId])
                .filter(doctor => doctor !== undefined);
        } catch (err) {
            console.error("Error fetching hospital doctors:", err);
            return [];
        }
    };

    useEffect(() => {
        // Get user from localStorage
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
        if (location?.lat && location?.lng) {
            console.log("Location updated:", location);
            GetnearByHospital();
        }
    }, [location]);

    async function GetnearByHospital() {
        if (!location?.lat || !location?.lng) {
            console.log("Location not available:", location);
            setError("Location not available. Please ensure location access is enabled.");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            
            const lat = parseFloat(location.lat);
            const lng = parseFloat(location.lng);

            if (isNaN(lat) || isNaN(lng)) {
                setError("Invalid location coordinates. Please try refreshing the page.");
                return;
            }

            console.log("Fetching nearby hospitals for:", { lat, lng });
            const response = await axios.get(`https://mycarebridge.onrender.com/api/hospital/nearby/${lat}/${lng}`);
            console.log("Nearby hospitals response:", response.data);
            
            if (response.data && response.data.hospitals && response.data.hospitals.length > 0) {
                setHospitals(response.data.hospitals);
            } else {
                console.log("No nearby hospitals found, fetching all hospitals");
                const allHospitalsResponse = await axios.get("https://mycarebridge.onrender.com/api/hospital");
                if (allHospitalsResponse.data && allHospitalsResponse.data.hospitals) {
                    setHospitals(allHospitalsResponse.data.hospitals);
                } else {
                    setHospitals([]);
                }
            }
        } catch (err) {
            console.error("Error fetching nearby hospitals:", err);
            // Only fetch all hospitals if nearby hospitals API fails
            try {
                const allHospitalsResponse = await axios.get("https://mycarebridge.onrender.com/api/hospital");
                if (allHospitalsResponse.data && allHospitalsResponse.data.hospitals) {
                    setHospitals(allHospitalsResponse.data.hospitals);
                } else {
                    setHospitals([]);
                }
            } catch (fallbackErr) {
                console.error("Error fetching all hospitals:", fallbackErr);
                setError("Failed to fetch hospitals. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    }

    async function GetAllHospitals() {
        try {
            const response = await axios.get("https://mycarebridge.onrender.com/api/hospital");
            if (response.data && response.data.hospitals) {
                setAllHospitals(response.data.hospitals);
                SetgetAll(!isgetAll);
            }
        } catch (err) {
            console.log("Error fetching hospitals:", err);
            setError(err.response?.data?.message || "Failed to fetch hospitals");
        }
    }

    async function createAppointCall() {
        if (!user) {
            setError("Please login to create an appointment");
            navigate('/login');
            return;
        }

        if (!selectedHospital || !selectedDoctor || !selectedDate || !selectedTime || !appointmentReason) {
            setError("Please fill in all appointment details");
            return;
        }

        try {
            console.log("Selected Doctor:", selectedDoctor);
            
            // Use the doctor ID directly since we already have it from the hospital data
            const response = await axios.post("https://mycarebridge.onrender.com/api/appointments/create", {
                doctor: selectedDoctor._id,
                patient: user._id,
                hospital: selectedHospital._id,
                appointmentTime: selectedTime,
                appointmentDate: selectedDate,
                reason: appointmentReason
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.data) {
                // Reset form after successful creation
                setSelectedHospital(null);
                setSelectedDoctor(null);
                setSelectedDate("");
                setSelectedTime("");
                setAppointmentReason("");
                setShowAppointmentForm(false);
                setError(null);
                
                alert("Appointment created successfully!");
            }
        } catch (err) {
            console.error("Error creating appointment:", err);
            setError(err.response?.data?.message || "Failed to create appointment");
        }
    }

    const fetchAppointments = async (userId) => {
        try {
            setLoading(true);
            const response = await axios.get(`https://mycarebridge.onrender.com/api/appointments/patient/${userId}`);
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

    // Combine both hospital lists for search
    const allHospitalsList = [...hospitals, ...allhospitals];
    
    const filterHospitals = allHospitalsList.filter((hospital) => {
        const term = searchedTerm.toLowerCase();
        return (
            (hospital.name && hospital.name.toLowerCase().includes(term)) ||
            (hospital.address && hospital.address.toLowerCase().includes(term)) ||
            (hospital.city && hospital.city.toLowerCase().includes(term)) ||
            (hospital.state && hospital.state.toLowerCase().includes(term)) ||
            (hospital.doctors && hospital.doctors.some(doctor => 
                doctor && doctor.name && doctor.name.toLowerCase().includes(term)
            ))
        );
    });

    if (locationError) {
        return (
            <div className="bg-amber-700 text-white h-screen flex flex-col justify-center items-center">
                <h1 className="text-3xl font-bold mb-10 text-blue-300">Patient Dashboard</h1>
                <div className="text-red-500">
                    Error: {locationError}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-amber-700 text-white min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-10 text-blue-300 text-center">Patient Dashboard</h1>
            
            {/* Add tab navigation */}
            <div className="mb-8">
                <div className="flex space-x-4 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('hospitals')}
                        className={`px-4 py-2 text-sm font-medium ${
                            activeTab === 'hospitals'
                                ? 'border-b-2 border-blue-500 text-blue-300'
                                : 'text-gray-300 hover:text-white'
                        }`}
                    >
                        Hospitals
                    </button>
                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`px-4 py-2 text-sm font-medium ${
                            activeTab === 'appointments'
                                ? 'border-b-2 border-blue-500 text-blue-300'
                                : 'text-gray-300 hover:text-white'
                        }`}
                    >
                        Appointments
                    </button>
                    <button
                        onClick={() => setActiveTab('queue')}
                        className={`px-4 py-2 text-sm font-medium ${
                            activeTab === 'queue'
                                ? 'border-b-2 border-blue-500 text-blue-300'
                                : 'text-gray-300 hover:text-white'
                        }`}
                    >
                        Queue
                    </button>
                </div>
            </div>

            {activeTab === 'hospitals' ? (
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <input 
                            className="w-full px-4 py-2 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(showSearchResults ? filterHospitals : hospitals).map((hospital) => (
                            <div key={hospital._id} className="bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden">
                                <div className="p-6">
                                    <h3 className="text-xl font-bold mb-2">{hospital.name}</h3>
                                    <p className="text-gray-600 mb-2">{hospital.address}</p>
                                    <p className="text-gray-600 mb-2">Phone: {hospital.phone}</p>
                                    <p className="text-gray-600 mb-4">Services: {hospital.service.join(", ")}</p>
                                    
                                    <div className="mb-4">
                                        <h4 className="font-semibold mb-2">Available Doctors:</h4>
                                        {hospital.doctors && hospital.doctors.length > 0 ? (
                                            <ul className="space-y-3">
                                                {hospital.doctors.map((doctor, index) => (
                                                    <li key={doctor._id || index} className="bg-gray-50 p-3 rounded">
                                                        <div className="font-medium">{doctor.name}</div>
                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-medium">Specialization:</span> {doctor.specialization}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-medium">Experience:</span> {doctor.experience} years
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-medium">Consultation Fee:</span> ₹{doctor.consultationFee}
                                                        </div>
                                                        {doctor.languages && doctor.languages.length > 0 && (
                                                            <div className="text-sm text-gray-600">
                                                                <span className="font-medium">Languages:</span> {doctor.languages.join(", ")}
                                                            </div>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-gray-500 italic">No doctors available</p>
                                        )}
                                    </div>

                                    <button 
                                        onClick={() => {
                                            setSelectedHospital(hospital);
                                            setShowAppointmentForm(true);
                                        }}
                                        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                                    >
                                        Book Appointment
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 text-center">
                        <button 
                            onClick={GetAllHospitals}
                            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            {isgetAll ? "Hide All Hospitals" : "Show All Hospitals"}
                        </button>
                    </div>

                    {/* Appointment Form Modal */}
                    {showAppointmentForm && selectedHospital && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-lg w-full max-w-md p-6">
                                <h3 className="text-xl font-bold mb-4 text-gray-800">Book Appointment</h3>
                                
                                {error && (
                                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                                        {error}
                                    </div>
                                )}
                                
                                <div className="space-y-4">
                                    {/* Doctor Selection */}
                                    <div>
                                        <label className="block text-gray-700 mb-2">Select Doctor</label>
                                        <select 
                                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedDoctor?._id || ""}
                                            onChange={(e) => {
                                                const doctorId = e.target.value;
                                                if (!doctorId) {
                                                    setSelectedDoctor(null);
                                                    return;
                                                }
                                                const doctor = selectedHospital.doctors.find(d => d._id === doctorId);
                                                console.log("Selected doctor:", doctor);
                                                if (doctor) {
                                                    setSelectedDoctor(doctor);
                                                } else {
                                                    setError("Doctor not found");
                                                }
                                            }}
                                        >
                                            <option value="">Select a doctor</option>
                                            {selectedHospital.doctors && selectedHospital.doctors.map((doctor) => (
                                                <option key={doctor._id} value={doctor._id}>
                                                    {doctor.name} - {doctor.specialization} (₹{doctor.consultationFee})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Date Selection */}
                                    <div>
                                        <label className="block text-gray-700 mb-2">Select Date</label>
                                        <input 
                                            type="date"
                                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>

                                    {/* Time Selection */}
                                    <div>
                                        <label className="block text-gray-700 mb-2">Select Time</label>
                                        <input 
                                            type="time"
                                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={selectedTime}
                                            onChange={(e) => setSelectedTime(e.target.value)}
                                        />
                                    </div>

                                    {/* Reason Input */}
                                    <div>
                                        <label className="block text-gray-700 mb-2">Reason for Visit</label>
                                        <textarea 
                                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={appointmentReason}
                                            onChange={(e) => setAppointmentReason(e.target.value)}
                                            placeholder="Please describe your reason for visit"
                                            rows="3"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-2 mt-6">
                                        <button 
                                            onClick={() => {
                                                setShowAppointmentForm(false);
                                                setError(null);
                                            }}
                                            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={createAppointCall}
                                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                                        >
                                            Confirm Appointment
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : activeTab === 'appointments' ? (
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Appointments</h2>
                    {loading ? (
                        <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                            <p className="mt-2">Loading appointments...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                            {error}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {appointments && appointments.length > 0 ? (
                                appointments.map((appointment) => (
                                    <div key={appointment._id} className="border rounded-lg p-4 bg-gray-50">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {appointment.doctor ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}` : 'Doctor Name Not Available'}
                                                </h3>
                                                <p className="text-gray-600">Hospital: {appointment.hospital?.name || 'Not specified'}</p>
                                                <p className="text-gray-600">Date: {new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                                                <p className="text-gray-600">Time: {appointment.appointmentTime}</p>
                                                <p className="text-gray-600">Reason: {appointment.reason || 'Not specified'}</p>
                                                <p className="text-gray-600">Status: <span className={`font-medium ${appointment.status === 'approved' ? 'text-green-600' : appointment.status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`}>{appointment.status || 'pending'}</span></p>
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
                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Queue Status</h2>
                    {selectedDoctor && selectedHospital ? (
                        <QueueSystem
                            doctorId={selectedDoctor._id}
                            hospitalId={selectedHospital._id}
                            userRole="patient"
                        />
                    ) : (
                        <p className="text-gray-500">Please select a doctor and hospital to view queue status</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default PatientDashBroad;
