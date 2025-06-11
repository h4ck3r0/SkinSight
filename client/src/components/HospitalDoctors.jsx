import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from "../context/AuthContext";

export default function HospitalDoctors({ hospitalId, onDoctorAdded }) {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [availableDoctors, setAvailableDoctors] = useState([]);
    const { token } = useAuth();

    useEffect(() => {
        fetchDoctors();
    }, [hospitalId]);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            // First get all doctors
            const allDoctorsResponse = await axios.get("https://mycarebridge.onrender.com/api/doctors/getall", {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            // Then get hospital details to get doctor IDs
            const hospitalResponse = await axios.get(`https://mycarebridge.onrender.com/api/hospital/${hospitalId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (hospitalResponse.data && hospitalResponse.data.hospital && hospitalResponse.data.hospital.doctors) {
                // Filter doctors that belong to this hospital
                const hospitalDoctorIds = hospitalResponse.data.hospital.doctors.map(d => 
                    typeof d === 'object' ? d._id : d
                );
                
                const hospitalDoctors = allDoctorsResponse.data.doctors
                    .filter(doctor => hospitalDoctorIds.includes(doctor._id))
                    .map(doctor => {
                        // Extract user ID properly - handle both string and object cases
                        const userId = typeof doctor.user === 'object' ? doctor.user._id : doctor.user;
                        return {
                            ...doctor,
                            user: userId, // Ensure user field is always a string ID
                            name: doctor.user ? 
                                (typeof doctor.user === 'object' ? 
                                    `${doctor.user.firstName || ''} ${doctor.user.lastName || ''}`.trim() : 
                                    'Unknown Doctor'
                                ) : 'Unknown Doctor',
                            specialization: doctor.specialization || 'Not specified',
                            experience: doctor.experience || 0,
                            consultationFee: doctor.consultationFee || 0,
                            languages: doctor.languages || [],
                            availability: doctor.availability || []
                        };
                    });
                
                setDoctors(hospitalDoctors);
            } else {
                setDoctors([]);
            }
        } catch (err) {
            console.error("Error fetching doctors:", err);
            setError(err.response?.data?.message || "Failed to fetch doctors");
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableDoctors = async () => {
        try {
            const response = await axios.get("https://mycarebridge.onrender.com/api/doctors/getall", {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.data && response.data.doctors) {
                // Filter out doctors that are already in this hospital
                const currentDoctorIds = doctors.map(d => d._id);
                const available = response.data.doctors
                    .filter(d => !currentDoctorIds.includes(d._id))
                    .map(doctor => {
                        // Extract user ID properly - handle both string and object cases
                        const userId = typeof doctor.user === 'object' ? doctor.user._id : doctor.user;
                        return {
                            ...doctor,
                            user: userId, // Ensure user field is always a string ID
                            name: doctor.user ? 
                                (typeof doctor.user === 'object' ? 
                                    `${doctor.user.firstName || ''} ${doctor.user.lastName || ''}`.trim() : 
                                    'Unknown Doctor'
                                ) : 'Unknown Doctor',
                            specialization: doctor.specialization || 'Not specified'
                        };
                    });
                setAvailableDoctors(available);
            }
        } catch (err) {
            console.error("Error fetching available doctors:", err);
            setError(err.response?.data?.message || "Failed to fetch available doctors");
        }
    };

    const handleAddDoctor = async () => {
        if (!selectedDoctor) {
            setError("Please select a doctor");
            return;
        }

        try {
            // selectedDoctor is now the user ID directly
            const response = await axios.post(
                `https://mycarebridge.onrender.com/api/hospital/${hospitalId}/doctors/${selectedDoctor}`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data) {
                setShowAddForm(false);
                setSelectedDoctor("");
                setError(null);
                // Refresh the doctors list
                fetchDoctors();
                if (onDoctorAdded) {
                    onDoctorAdded();
                }
            }
        } catch (err) {
            console.error("Error adding doctor:", err);
            setError(err.response?.data?.message || "Failed to add doctor");
        }
    };

    const filteredDoctors = doctors.filter(doctor => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (doctor.name && doctor.name.toLowerCase().includes(searchLower)) ||
            (doctor.specialization && doctor.specialization.toLowerCase().includes(searchLower))
        );
    });

    if (loading) {
        return (
            <div className="flex justify-center items-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <input
                    type="text"
                    placeholder="Search doctors..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={() => {
                        setShowAddForm(true);
                        fetchAvailableDoctors();
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                >
                    Add Doctor
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                    {error}
                </div>
            )}

            {showAddForm && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold mb-4">Add Doctor to Hospital</h3>
                    <select
                        value={selectedDoctor}
                        onChange={(e) => setSelectedDoctor(e.target.value)}
                        className="w-full p-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select a doctor</option>
                        {availableDoctors.map((doctor) => {
                            // Extract user ID properly - handle both string and object cases
                            const userId = typeof doctor.user === 'object' ? doctor.user._id : doctor.user;
                            return (
                                <option key={doctor._id} value={userId}>
                                    {doctor.name} - {doctor.specialization}
                                </option>
                            );
                        })}
                    </select>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddDoctor}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Add Doctor
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDoctors.map((doctor) => (
                    <div key={doctor._id} className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-xl font-semibold mb-2">{doctor.name}</h3>
                        <p className="text-gray-600 mb-2">Specialization: {doctor.specialization}</p>
                        <p className="text-gray-600 mb-2">Experience: {doctor.experience} years</p>
                        <p className="text-gray-600 mb-2">Consultation Fee: ₹{doctor.consultationFee}</p>
                        {doctor.languages && doctor.languages.length > 0 && (
                            <p className="text-gray-600 mb-2">Languages: {doctor.languages.join(", ")}</p>
                        )}
                        {doctor.availability && doctor.availability.length > 0 && (
                            <div className="mt-4">
                                <h4 className="font-semibold mb-2">Availability:</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {doctor.availability.map((slot, index) => (
                                        <div key={index} className="text-sm">
                                            <span className="font-medium">{slot.day}:</span>{" "}
                                            {slot.isAvailable ? `${slot.startTime} - ${slot.endTime}` : "Not Available"}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredDoctors.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    No doctors found
                </div>
            )}
        </div>
    );
} 