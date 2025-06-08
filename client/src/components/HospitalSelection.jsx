import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function HospitalSelection() {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async () => {
        try {
            const response = await axios.get('/hospital/all');
            setHospitals(response.data.hospitals);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch hospitals');
        } finally {
            setLoading(false);
        }
    };

    const joinHospital = async (hospitalId) => {
        try {
            await axios.patch('/auth/updateMe', { hospitalId });
            const userResponse = await axios.get('/auth/me');
            const role = userResponse.data.user.role;
            
            if (role === 'doctor') {
                navigate('/doctor-dashboard');
            } else if (role === 'staff') {
                navigate('/staff-dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to join hospital');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-xl">Loading hospitals...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        Select a Hospital to Join
                    </h2>
                    <p className="mt-3 text-xl text-gray-500">
                        Choose the hospital you want to work with
                    </p>
                </div>

                <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {hospitals.map((hospital) => (
                        <div
                            key={hospital._id}
                            className="bg-white overflow-hidden shadow rounded-lg"
                        >
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {hospital.name}
                                </h3>
                                <div className="mt-2 text-sm text-gray-500">
                                    <p>{hospital.address}</p>
                                    <p className="mt-1">Phone: {hospital.phone}</p>
                                    <p className="mt-1">Email: {hospital.email}</p>
                                    <div className="mt-2">
                                        <span className="text-sm font-medium text-gray-500">
                                            Services:
                                        </span>
                                        <div className="mt-1 flex flex-wrap gap-2">
                                            {hospital.service.map((service, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                                >
                                                    {service}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <button
                                        onClick={() => joinHospital(hospital._id)}
                                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Join Hospital
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
} 