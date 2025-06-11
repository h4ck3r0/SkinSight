import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import HospitalDoctors from "./HospitalDoctors";
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-hot-toast';

export default function HospitalDashborad() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [queues, setQueues] = useState({});

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.role !== 'staff') {
            navigate('/login');
            return;
        }

        if (user.hospitalId) {
            fetchHospital();
        } else {
            setError("No hospital assigned to this account");
            setLoading(false);
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!socket || !user) return;

        // Listen for queue updates
        socket.on('queueUpdate', (data) => {
            console.log('Queue update received:', data);
            setQueues(prev => ({
                ...prev,
                [`${data.doctorId}:${data.hospitalId}`]: data.queue
            }));
        });

        return () => {
            socket.off('queueUpdate');
        };
    }, [socket, user]);

    const fetchHospital = async () => {
        if (!user?.hospitalId) {
            setError("No hospital ID found");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get(`https://mycarebridge.onrender.com/api/hospital/${user.hospitalId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.data && response.data.hospital) {
                const hospitalData = response.data.hospital;
                if (!hospitalData.doctors) {
                    hospitalData.doctors = [];
                }
                setHospital(hospitalData);
            }
        } catch (err) {
            console.error("Error fetching hospital:", err);
            setError(err.response?.data?.message || "Failed to fetch hospital details");
        } finally {
            setLoading(false);
        }
    };

    const handleDoctorAdded = () => {
        fetchHospital();
    };

    const getQueueStatus = (doctorId) => {
        if (!socket || !user) return;

        socket.emit('getQueueStatus', {
            doctorId,
            hospitalId: user.hospitalId
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            </div>
        );
    }

    if (!hospital) {
        return (
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
                    No hospital data found
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#A6DCEF]/10">
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Tab Navigation */}
                <div className="bg-white rounded-lg shadow-md p-4 mb-8">
                    <nav className="flex space-x-6">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                activeTab === 'overview'
                                    ? 'bg-[#2C3E50] text-white shadow-md hover:opacity-90'
                                    : 'text-[#2C3E50] hover:bg-[#A6DCEF]/10'
                            }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('doctors')}
                            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                activeTab === 'doctors'
                                    ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Doctors
                        </button>
                        <button
                            onClick={() => setActiveTab('queues')}
                            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                                activeTab === 'queues'
                                    ? 'bg-blue-500 text-white shadow-md hover:bg-blue-600'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Queue Management
                        </button>
                    </nav>
                </div>

                {activeTab === 'overview' && (
                    <div className="bg-white rounded-lg shadow-md p-8 mb-8 border border-gray-100">
                        <h1 className="text-3xl font-bold mb-6 text-gray-800 pb-2 border-b">{hospital.name}</h1>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h2 className="text-xl font-semibold mb-4 text-[#2C3E50]">Hospital Details</h2>
                                <div className="space-y-3">
                                    <p><span className="font-medium">Address:</span> {hospital.address}</p>
                                    <p><span className="font-medium">Phone:</span> {hospital.phone}</p>
                                    <p><span className="font-medium">Email:</span> {hospital.email}</p>
                                    <p><span className="font-medium">Services:</span> {hospital.service.join(", ")}</p>
                                </div>
                            </div>
                            
                            <div>
                                <h2 className="text-xl font-semibold mb-4 text-[#2C3E50]">Location</h2>
                                <div className="space-y-3">
                                    <p><span className="font-medium">Coordinates:</span> {hospital.location.coordinates.join(", ")}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'doctors' && (
                    <div className="bg-white rounded-lg shadow-md p-8 border border-gray-100">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 pb-2 border-b">Doctors</h2>
                        <HospitalDoctors 
                            hospitalId={hospital._id} 
                            onDoctorAdded={handleDoctorAdded}
                        />
                    </div>
                )}

                {activeTab === 'queues' && (
                    <div className="bg-white rounded-lg shadow-md p-8 border border-gray-100">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 pb-2 border-b">Queue Management</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(queues).map(([key, queue]) => {
                                const [doctorId, hospitalId] = key.split(':');
                                const doctor = hospital.doctors.find(d => d._id === doctorId);
                                return (
                                    <div key={key} className="border rounded-lg p-6 bg-gradient-to-r from-[#A6DCEF]/20 to-white shadow-sm hover:shadow-md transition-all duration-200">
                                        <h3 className="text-lg font-semibold mb-2">
                                            {doctor ? `${doctor.name} (${doctor.specialization})` : `Doctor ID: ${doctorId}`}
                                        </h3>
                                        <div className="space-y-2">
                                            <p>Total Patients: {queue.patients.length}</p>
                                            <p>Status: {queue.status}</p>
                                            <button
                                                onClick={() => getQueueStatus(doctorId)}
                                                className="bg-[#2C3E50] text-white px-3 py-1 rounded hover:opacity-90 transition-all duration-200"
                                            >
                                                Refresh Status
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {Object.keys(queues).length === 0 && (
                            <div className="text-center py-4">
                                <p className="text-gray-500">No active queues at the moment</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
