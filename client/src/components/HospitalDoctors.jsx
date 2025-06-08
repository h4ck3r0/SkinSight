import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from "../context/AuthContext";

export default function HospitalDoctors() {
    const [availableDoctors, setAvailableDoctors] = useState([]);
    const [hospitalDoctors, setHospitalDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);   
    const hospitalId = localStorage.getItem('hospitalId');
    const { token } = useAuth();

    useEffect(() => {
        if (hospitalId) {
            fetchDoctors();
            fetchHospitalDoctors();
        }
    }, [hospitalId]);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const response = await axios.get('https://mycarebridge.onrender.com/api/doctors/getall', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setAvailableDoctors(response.data.doctors);
        } catch (err) {
            setError('Failed to fetch doctors');
            console.error('Error fetching doctors:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchHospitalDoctors = async () => {
        try {
            const response = await axios.get(`https://mycarebridge.onrender.com/api/hospital/${hospitalId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setHospitalDoctors(response.data.hospital.doctors || []);
        } catch (err) {
            setError('Failed to fetch hospital doctors');
            console.error('Error fetching hospital doctors:', err);
        }
    };

    const addDoctorToHospital = async (userId) => {
        try {
            setLoading(true);
            await axios.post(
                `https://mycarebridge.onrender.com/api/hospital/adddoctor/${hospitalId}/${userId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            await fetchDoctors();
            await fetchHospitalDoctors();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add doctor');
            console.error('Error adding doctor:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Hospital Doctors</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h3 className="text-xl font-semibold mb-2">Available Doctors</h3>
                    <div className="space-y-2">
                        {availableDoctors.map((doctor) => (
                            <div key={doctor._id} className="bg-white p-4 rounded shadow">
                                <p className="font-semibold">{doctor.firstName} {doctor.lastName}</p>
                                <p className="text-gray-600">{doctor.email}</p>
                                {!hospitalDoctors.includes(doctor._id) && (
                                    <button
                                        onClick={() => addDoctorToHospital(doctor._id)}
                                        className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                    >
                                        Add to Hospital
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-semibold mb-2">Current Hospital Doctors</h3>
                    <div className="space-y-2">
                        {hospitalDoctors.length === 0 ? (
                            <p>No doctors currently in this hospital</p>
                        ) : (
                            hospitalDoctors.map((doctorId) => {
                                const doctor = availableDoctors.find(d => d._id === doctorId);
                                return doctor ? (
                                    <div key={doctorId} className="bg-white p-4 rounded shadow">
                                        <p className="font-semibold">{doctor.firstName} {doctor.lastName}</p>
                                        <p className="text-gray-600">{doctor.email}</p>
                                    </div>
                                ) : null;
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 