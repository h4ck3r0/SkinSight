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

    const addDoctorToHospital = async (doctorId) => {
        try {
            setLoading(true);
            await axios.post(
                `https://mycarebridge.onrender.com/api/hospital/adddocter/${hospitalId}/${doctorId}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            // Refresh both lists
            await fetchDoctors();
            await fetchHospitalDoctors();
        } catch (err) {
            setError('Failed to add doctor');
            console.error('Error adding doctor:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-6">Manage Hospital Doctors</h2>
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4">Current Hospital Doctors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {hospitalDoctors.map((doctor) => (
                        <div key={doctor._id} className="bg-white p-4 rounded-lg shadow">
                            <h4 className="font-bold">{doctor.firstName} {doctor.lastName}</h4>
                            <p>Specialization: {doctor.specialization}</p>
                            <p>Experience: {doctor.experience} years</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Available Doctors to Add */}
            <div>
                <h3 className="text-xl font-semibold mb-4">Available Doctors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {availableDoctors
                        .filter(doctor => !hospitalDoctors.some(hd => hd._id === doctor._id))
                        .map((doctor) => (
                            <div key={doctor._id} className="bg-white p-4 rounded-lg shadow">
                                <h4 className="font-bold">{doctor.firstName} {doctor.lastName}</h4>
                                <p>Specialization: {doctor.specialization}</p>
                                <p>Experience: {doctor.experience} years</p>
                                <button
                                    onClick={() => addDoctorToHospital(doctor._id)}
                                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                    Add to Hospital
                                </button>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
} 