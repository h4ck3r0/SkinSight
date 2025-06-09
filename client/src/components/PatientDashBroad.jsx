import { useEffect, useState } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function PatientDashBroad() {
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
    
    // New state variables for appointment
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [appointmentReason, setAppointmentReason] = useState("");
    const [showAppointmentForm, setShowAppointmentForm] = useState(false);
    const [user, setUser] = useState(null);

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
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        if (location?.lat && location?.lng) {
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
            
            console.log("Raw location values:", location);
            console.log("Raw lat:", location.lat, "Raw lng:", location.lng);
            
            // Convert coordinates to numbers and ensure they are valid
            const lat = parseFloat(location.lat);
            const lng = parseFloat(location.lng);

            console.log("Converted lat:", lat, "Converted lng:", lng);

            if (isNaN(lat) || isNaN(lng)) {
                console.log("Invalid coordinates detected");
                setError("Invalid location coordinates. Please try refreshing the page.");
                return;
            }

            // Format coordinates to 6 decimal places to avoid floating point issues
            const formattedLat = lat.toFixed(6);
            const formattedLng = lng.toFixed(6);

            console.log("Formatted coordinates:", formattedLat, formattedLng);

            const response = await axios.get(`https://mycarebridge.onrender.com/api/hospital/getnearBy/${formattedLat}/${formattedLng}`);
            
            if (response.data && response.data.hospitals) {
                setHospitals(response.data.hospitals);
            } else {
                setHospitals([]);
            }
        } catch (err) {
            console.error("Error details:", err);
            setError(err.response?.data?.message || "Failed to fetch nearby hospitals");
        } finally {
            setLoading(false);
        }
    }

    async function GetAllHospitals() {
        try {
            const response = await axios.get("https://mycarebridge.onrender.com/api/hospital/getall");
            
            // Fetch doctors for each hospital
            const hospitalsWithDoctors = await Promise.all(
                response.data.hospitals.map(async (hospital) => {
                    const doctors = await fetchHospitalDoctors(hospital);
                    return {
                        ...hospital,
                        doctors
                    };
                })
            );
            
            setAllHospitals(hospitalsWithDoctors);
            SetgetAll(!isgetAll);
        } catch (err) {
            console.log("Error fetching hospitals:", err);
            setError(err.response?.data?.message || "Failed to fetch nearby hospitals");
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
            console.log("Error creating appointment:", err);
            setError(err.response?.data?.message || "Failed to create appointment");
        }
    }

    // Combine both hospital lists for search
    const allHospitalsList = [...hospitals, ...allhospitals];
    
    const filterHospitals = allHospitalsList.filter((hospital) => {
        const term = searchedTerm.toLowerCase();
        return (
            (hospital.name && hospital.name.toLowerCase().includes(term)) ||
            (hospital.address && hospital.address.toLowerCase().includes(term)) ||
            (hospital.city && hospital.city.toLowerCase().includes(term)) ||
            (hospital.state && hospital.state.toLowerCase().includes(term)) ||
            (hospital.doctors && 
                (Array.isArray(hospital.doctors) 
                    ? hospital.doctors.some(doctor => 
                        doctor && typeof doctor === 'string' && doctor.toLowerCase().includes(term))
                    : typeof hospital.doctors === 'string' && hospital.doctors.toLowerCase().includes(term)
                )
            )
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
        <div className="bg-amber-700 text-white h-screen flex flex-col justify-center items-center">
            <h1 className="text-3xl font-bold mb-10 text-blue-300">Patient Dashboard</h1>

            <div className="w-full max-w-4xl p-4">
                <h2 className="text-2xl mb-4">Nearby Hospitals</h2>
                
                {loading && <div>Loading hospitals...</div>}
                
                {error && (
                    <div className="text-red-500 mb-4">
                        {error}
                    </div>
                )}

                {!loading && !error && hospitals.length === 0 && (
                    <div>No hospitals found nearby</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hospitals.map((hospital) => (
                        <div key={hospital._id} className="bg-white text-gray-800 p-4 rounded-lg shadow">
                            <h3 className="text-xl font-bold">{hospital.name}</h3>
                            <p>{hospital.address}</p>
                            <p>Phone: {hospital.phone}</p>
                            <p>Services: {hospital.service.join(", ")}</p>
                            <div className="mt-2">
                                <p className="font-semibold">Doctors:</p>
                                <ul className="list-disc pl-5">
                                    {Array.isArray(hospital.doctors) && hospital.doctors.map((doctor) => (
                                        <li key={doctor._id} className="mb-2">
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
                                            {doctor.bio && (
                                                <div className="text-sm text-gray-600 mt-1">
                                                    <span className="font-medium">Bio:</span> {doctor.bio}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <button 
                                onClick={() => {
                                    setSelectedHospital(hospital);
                                    setShowAppointmentForm(true);
                                }}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mt-2"
                            >
                                Create Appointment
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-4">
                    <button 
                        onClick={GetAllHospitals}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Get All Hospitals
                    </button>
                </div>

                {isgetAll && (
                    <div className="mt-4">
                        <h2 className="text-2xl mb-4">All Hospitals</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allhospitals.map((hospital) => (
                                <div key={hospital._id} className="bg-white text-gray-800 p-4 rounded-lg shadow">
                                    <h3 className="text-xl font-bold">{hospital.name}</h3>
                                    <p>{hospital.address}</p>
                                    <p>Phone: {hospital.phone}</p>
                                    <p>Services: {hospital.service.join(", ")}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-8 w-full max-w-2xl">
                    <div className="relative">
                        <input 
                            className="w-full px-4 py-2 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search hospitals by name, address, city, state..."
                            value={searchedTerm}
                            onChange={(e) => {
                                SetSearchedTerm(e.target.value);
                                setShowSearchResults(e.target.value.length > 0);
                            }}
                        />
                    </div>

                    {showSearchResults && searchedTerm && (
                        <div className="mt-4 bg-white rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Search Results</h3>
                            {filterHospitals.length === 0 ? (
                                <p className="text-gray-600">No hospitals found matching your search.</p>
                            ) : (
                                <div className="grid grid-cols-1 gap-4">
                                    {filterHospitals.map((hospital) => (
                                        <div key={hospital._id} className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors">
                                            <h4 className="text-lg font-semibold text-gray-800">{hospital.name}</h4>
                                            <p className="text-gray-600">{hospital.address}</p>
                                            {hospital.phone && <p className="text-gray-600">Phone: {hospital.phone}</p>}
                                            {hospital.service && hospital.service.length > 0 && (
                                                <p className="text-gray-600">Services: {hospital.service.join(", ")}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Appointment Form Modal */}
                {showAppointmentForm && selectedHospital && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white p-6 rounded-lg w-full max-w-md">
                            <h3 className="text-xl font-bold mb-4">Create Appointment</h3>
                            
                            {error && (
                                <div className="text-red-500 mb-4">
                                    {error}
                                </div>
                            )}
                            
                            {/* Doctor Selection */}
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Select Doctor</label>
                                <select 
                                    className="w-full p-2 border rounded"
                                    value={selectedDoctor?._id || ""}
                                    onChange={(e) => {
                                        const doctor = selectedHospital.doctors.find(d => d._id === e.target.value);
                                        setSelectedDoctor(doctor);
                                    }}
                                >
                                    <option key="default" value="">Select a doctor</option>
                                    {Array.isArray(selectedHospital.doctors) && selectedHospital.doctors.map((doctor) => (
                                        <option key={doctor._id} value={doctor._id}>
                                            {doctor.name} - {doctor.specialization} (₹{doctor.consultationFee})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Date Selection */}
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Select Date</label>
                                <input 
                                    type="date"
                                    className="w-full p-2 border rounded"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]} // Set minimum date to today
                                />
                            </div>

                            {/* Time Selection */}
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Select Time</label>
                                <input 
                                    type="time"
                                    className="w-full p-2 border rounded"
                                    value={selectedTime}
                                    onChange={(e) => setSelectedTime(e.target.value)}
                                />
                            </div>

                            {/* Reason Input */}
                            <div className="mb-4">
                                <label className="block text-gray-700 mb-2">Reason for Visit</label>
                                <textarea 
                                    className="w-full p-2 border rounded"
                                    value={appointmentReason}
                                    onChange={(e) => setAppointmentReason(e.target.value)}
                                    placeholder="Please describe your reason for visit"
                                    rows="3"
                                />
                            </div>

                            <div className="flex justify-end gap-2">
                                <button 
                                    onClick={() => {
                                        setShowAppointmentForm(false);
                                        setError(null);
                                    }}
                                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={createAppointCall}
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                    Confirm Appointment
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
