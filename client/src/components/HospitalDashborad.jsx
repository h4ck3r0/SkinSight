import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import HospitalDoctors from "./HospitalDoctors";
import QueueSystem from "./QueueSystem";
import Navigation from "./Navigation";
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://mycarebridge.onrender.com/api';

export default function HospitalDashborad() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();
    const { location, error: locationError } = useGeolocation();
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [queues, setQueues] = useState({});
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        service: []
    });

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
            const response = await axios.get(`${API_URL}/hospital/${user.hospitalId}`, {
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
                
                // Initialize edit form with current data
                setEditForm({
                    name: hospitalData.name || '',
                    address: hospitalData.address || '',
                    phone: hospitalData.phone || '',
                    email: hospitalData.email || '',
                    service: hospitalData.service || []
                });
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleServiceChange = (e) => {
        const services = e.target.value.split(',').map(service => service.trim()).filter(service => service);
        setEditForm(prev => ({
            ...prev,
            service: services
        }));
    };

    const handleUpdateHospital = async (e) => {
        e.preventDefault();
        setUpdating(true);

        try {
            // Check if location is available for update
            if (!location || !location.lat || !location.lng) {
                toast.error('Please enable location access to update hospital details');
                setUpdating(false);
                return;
            }

            // Prepare location data
            const locationData = {
                type: 'Point',
                coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
            };

            const updateData = {
                ...editForm,
                location: locationData
            };

            const response = await axios.put(
                `${API_URL}/hospital/${hospital._id}`,
                updateData,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                toast.success('Hospital details updated successfully!');
                await fetchHospital(); // Refresh hospital data
            }
        } catch (error) {
            console.error('Error updating hospital:', error);
            toast.error(error.response?.data?.message || 'Failed to update hospital details');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!hospital) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg">
                        No hospital data found
                    </div>
                </div>
            </div>
        );
    }

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
                                    {hospital?.name || 'Hospital'} 🏥
                                </h1>
                                <p className="text-gray-600">
                                    Manage your hospital operations, doctors, and patient queues.
                                </p>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span>Hospital Management System</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Doctors</p>
                                <p className="text-2xl font-bold text-gray-900">{hospital?.doctors?.length || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Queues</p>
                                <p className="text-2xl font-bold text-gray-900">{Object.keys(queues).length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Services</p>
                                <p className="text-2xl font-bold text-gray-900">{hospital?.service?.length || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Appointments</p>
                                <p className="text-2xl font-bold text-gray-900">-</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6" aria-label="Tabs">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                    activeTab === 'overview'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                    <span>Overview</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('doctors')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                    activeTab === 'doctors'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Doctors</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('queues')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                    activeTab === 'queues'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span>Queue Management</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                    activeTab === 'settings'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span>Hospital Settings</span>
                                </div>
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Hospital Details */}
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                                        <div className="p-6 border-b border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-900">Hospital Information</h3>
                                        </div>
                                        <div className="p-6">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Address</label>
                                                    <p className="text-gray-900">{hospital?.address}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Phone</label>
                                                    <p className="text-gray-900">{hospital?.phone}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Email</label>
                                                    <p className="text-gray-900">{hospital?.email}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Services</label>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {hospital?.service?.map((service, index) => (
                                                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                {service}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                                        <div className="p-6 border-b border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                                        </div>
                                        <div className="p-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Hospital system online</p>
                                                        <p className="text-xs text-gray-500">Just now</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Queue management active</p>
                                                        <p className="text-xs text-gray-500">2 minutes ago</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Doctors connected</p>
                                                        <p className="text-xs text-gray-500">5 minutes ago</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'doctors' && (
                            <div>
                                <HospitalDoctors 
                                    hospitalId={hospital?._id} 
                                    onDoctorAdded={handleDoctorAdded}
                                />
                            </div>
                        )}

                        {activeTab === 'queues' && (
                            <div>
                                {hospital?.doctors && hospital.doctors.length > 0 ? (
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-900">Doctor Queues</h3>
                                        {hospital.doctors.map((doctor) => (
                                            <div key={doctor._id} className="bg-white border border-gray-200 rounded-lg p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h4 className="text-lg font-medium text-gray-900">Dr. {doctor.name}</h4>
                                                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedDoctor(doctor)}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        View Queue
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {selectedDoctor && (
                                            <div className="mt-8">
                                                <QueueSystem
                                                    doctorId={selectedDoctor._id}
                                                    hospitalId={hospital._id}
                                                    role="staff"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No doctors assigned</h3>
                                        <p className="mt-1 text-sm text-gray-500">Add doctors to start managing queues.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div>
                                <div className="max-w-2xl mx-auto">
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                                        <div className="p-6 border-b border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-900">Update Hospital Information</h3>
                                            <p className="text-sm text-gray-600 mt-1">Update your hospital details and location</p>
                                        </div>
                                        <div className="p-6">
                                            {locationError ? (
                                                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                    <p className="text-yellow-800">
                                                        {locationError}
                                                    </p>
                                                    <button
                                                        onClick={() => window.location.reload()}
                                                        className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
                                                    >
                                                        Retry with Location
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="mb-6 flex items-center px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                                                    <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span className="text-green-800 text-sm">Location access granted</span>
                                                </div>
                                            )}

                                            <form onSubmit={handleUpdateHospital} className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Hospital Name *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={editForm.name}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Hospital Name"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Address *
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="address"
                                                        value={editForm.address}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Hospital Address"
                                                        required
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Phone Number *
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            name="phone"
                                                            value={editForm.phone}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="Phone Number"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Email *
                                                        </label>
                                                        <input
                                                            type="email"
                                                            name="email"
                                                            value={editForm.email}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="hospital@example.com"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Services (comma-separated)
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="service"
                                                        value={editForm.service.join(', ')}
                                                        onChange={handleServiceChange}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Cardiology, Pediatrics, Emergency Care"
                                                    />
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Enter services separated by commas
                                                    </p>
                                                </div>

                                                <div className="flex justify-end space-x-4 pt-6">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('overview')}
                                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={updating || !location}
                                                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {updating ? 'Updating...' : 'Update Hospital'}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
