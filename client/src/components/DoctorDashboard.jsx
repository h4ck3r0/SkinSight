import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useGeolocation } from '../hooks/useGeolocation';
import QueueSystem from './QueueSystem';
import Navigation from './Navigation';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'https://mycarebridge.onrender.com/api';

const DoctorDashboard = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const { location, error: locationError } = useGeolocation();
    const [doctorProfile, setDoctorProfile] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [updating, setUpdating] = useState(false);
    const [editForm, setEditForm] = useState({
        specialization: '',
        experience: '',
        consultationFee: '',
        bio: '',
        address: '',
        languages: ['English'],
        availability: [
            {
                day: 'Monday',
                startTime: '09:00',
                endTime: '17:00',
                isAvailable: true
            },
            {
                day: 'Tuesday',
                startTime: '09:00',
                endTime: '17:00',
                isAvailable: true
            },
            {
                day: 'Wednesday',
                startTime: '09:00',
                endTime: '17:00',
                isAvailable: true
            },
            {
                day: 'Thursday',
                startTime: '09:00',
                endTime: '17:00',
                isAvailable: true
            },
            {
                day: 'Friday',
                startTime: '09:00',
                endTime: '17:00',
                isAvailable: true
            }
        ]
    });
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.role !== 'doctor') {
            navigate('/login');
            return;
        }

        // Check if doctor profile exists
        checkDoctorProfile();
    }, [user, navigate]);

    // Socket connection and room joining
    useEffect(() => {
        if (socket && user) {
            socket.on('connect', () => {
                console.log('Connected to socket server');
                setIsSocketConnected(true);
                
                // Join user's room
                socket.emit('joinRoom', user._id);
            });

            socket.on('disconnect', () => {
                console.log('Disconnected from socket server');
                setIsSocketConnected(false);
            });

            return () => {
                socket.off('connect');
                socket.off('disconnect');
            };
        }
    }, [socket, user]);

    const checkDoctorProfile = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/doctors/profile`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.doctor) {
                setDoctorProfile(response.data.doctor);
                
                // Initialize edit form with current data
                setEditForm({
                    specialization: response.data.doctor.specialization || '',
                    experience: response.data.doctor.experience || '',
                    consultationFee: response.data.doctor.consultationFee || '',
                    bio: response.data.doctor.bio || '',
                    address: response.data.doctor.address || '',
                    languages: response.data.doctor.languages || ['English'],
                    availability: response.data.doctor.availability || [
                        {
                            day: 'Monday',
                            startTime: '09:00',
                            endTime: '17:00',
                            isAvailable: true
                        },
                        {
                            day: 'Tuesday',
                            startTime: '09:00',
                            endTime: '17:00',
                            isAvailable: true
                        },
                        {
                            day: 'Wednesday',
                            startTime: '09:00',
                            endTime: '17:00',
                            isAvailable: true
                        },
                        {
                            day: 'Thursday',
                            startTime: '09:00',
                            endTime: '17:00',
                            isAvailable: true
                        },
                        {
                            day: 'Friday',
                            startTime: '09:00',
                            endTime: '17:00',
                            isAvailable: true
                        }
                    ]
                });
            }
            
            // Fetch appointments regardless of profile status
            await fetchDoctorAppointments();
        } catch (error) {
            console.error('Error checking doctor profile:', error);
            if (error.response?.status === 404) {
                // Profile doesn't exist, redirect to profile setup
                navigate('/doctor-profile-setup');
                return;
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchDoctorAppointments = async () => {
        try {
            const response = await axios.get(`${API_URL}/doctors/appointments`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data && response.data.appointments) {
                setAppointments(response.data.appointments);
            }
        } catch (error) {
            console.error('Error fetching appointments:', error);
        }
    };

    const handleApproveAppointment = async (appointmentId) => {
        try {
            const response = await axios.put(`${API_URL}/doctors/approve-appointment/${appointmentId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data) {
                toast.success('Appointment approved successfully!');
                await fetchDoctorAppointments();
            }
        } catch (error) {
            console.error('Error approving appointment:', error);
            toast.error('Failed to approve appointment');
        }
    };

    const handleRejectAppointment = async (appointmentId) => {
        try {
            const response = await axios.put(`${API_URL}/doctors/reject-appointment/${appointmentId}`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.data) {
                toast.success('Appointment rejected successfully!');
                await fetchDoctorAppointments();
            }
        } catch (error) {
            console.error('Error rejecting appointment:', error);
            toast.error('Failed to reject appointment');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvailabilityChange = (index, field, value) => {
        setEditForm(prev => ({
            ...prev,
            availability: prev.availability.map((slot, i) => 
                i === index ? { ...slot, [field]: value } : slot
            )
        }));
    };

    const toggleAvailability = (index) => {
        setEditForm(prev => ({
            ...prev,
            availability: prev.availability.map((slot, i) => 
                i === index ? { ...slot, isAvailable: !slot.isAvailable } : slot
            )
        }));
    };

    const handleLanguageChange = (e) => {
        const languages = e.target.value.split(',').map(lang => lang.trim());
        setEditForm(prev => ({
            ...prev,
            languages
        }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);

        try {
            // Check if location is available for update
            if (!location || !location.lat || !location.lng) {
                toast.error('Please enable location access to update your profile');
                setUpdating(false);
                return;
            }

            // Prepare location data
            const locationData = {
                type: 'Point',
                coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
            };

            const profileData = {
                ...editForm,
                location: locationData
            };

            const response = await axios.put(
                `${API_URL}/doctors/profile`,
                profileData,
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                toast.success('Profile updated successfully!');
                await checkDoctorProfile(); // Refresh profile data
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!user?.hospitalId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                <Navigation />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <h2 className="mt-4 text-xl font-semibold text-red-600">No Hospital Assigned</h2>
                            <p className="mt-2 text-gray-600">Please contact your administrator to assign you to a hospital.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const today = new Date();
    const todayString = today.toDateString();
    
    const todaysAppointments = appointments.filter(appointment => {
        if (!appointment.appointmentDate) return false;
        
        const appointmentDate = new Date(appointment.appointmentDate);
        const appointmentString = appointmentDate.toDateString();
        
        return appointmentString === todayString;
    });

    const pendingAppointments = appointments.filter(appointment => 
        appointment.status === 'pending'
    );

    const approvedAppointments = appointments.filter(appointment => 
        appointment.status === 'confirmed'
    );

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
                                    Welcome, Dr. {doctorProfile?.name || user?.name || 'Doctor'}! 👨‍⚕️
                                </h1>
                                <p className="text-gray-600">
                                    Manage your appointments, patient queues, and consultations.
                                </p>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <div className={`w-3 h-3 rounded-full ${isSocketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                    <span className={isSocketConnected ? 'text-green-600' : 'text-red-600'}>
                                        {isSocketConnected ? 'Connected' : 'Disconnected'}
                                    </span>
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
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                                <p className="text-2xl font-bold text-gray-900">{todaysAppointments.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{pendingAppointments.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                                <p className="text-2xl font-bold text-gray-900">{approvedAppointments.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                        <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                                <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
                            </div>
                        </div>
                    </div>
                </div>
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
                                    <span>Queue Management</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('profile')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                                    activeTab === 'profile'
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center space-x-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span>Profile</span>
                                </div>
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'overview' && (
                            <div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Today's Appointments */}
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                                        <div className="p-6 border-b border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
                                        </div>
                                        <div className="p-6">
                                            {todaysAppointments.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments today</h3>
                                                    <p className="mt-1 text-sm text-gray-500">You have a free schedule today.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {todaysAppointments.slice(0, 5).map((appointment) => (
                                                        <div key={appointment._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                                            <div>
                                                                <p className="font-medium text-gray-900">
                                                                    {appointment.patient?.firstName || ''} {appointment.patient?.lastName || ''}
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    {new Date(appointment.appointmentTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {appointment.reason}
                                                                </p>
                                                            </div>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                                appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {appointment.status}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pending Approvals */}
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                                        <div className="p-6 border-b border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
                                        </div>
                                        <div className="p-6">
                                            {pendingAppointments.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
                                                    <p className="mt-1 text-sm text-gray-500">All appointments are processed.</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    {pendingAppointments.slice(0, 5).map((appointment) => (
                                                        <div key={appointment._id} className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <p className="font-medium text-gray-900">
                                                                    {appointment.patient?.firstName || ''} {appointment.patient?.lastName || ''}
                                                                </p>
                                                                <span className="text-xs text-yellow-800 bg-yellow-100 px-2 py-1 rounded-full">
                                                                    Pending
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-gray-600 mb-3">
                                                                {new Date(appointment.appointmentDate).toLocaleDateString()} at {new Date(appointment.appointmentTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </p>
                                                            <p className="text-sm text-gray-600 mb-3">
                                                                Reason: {appointment.reason}
                                                            </p>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    onClick={() => handleApproveAppointment(appointment._id)}
                                                                    className="px-3 py-1 text-xs font-medium text-green-600 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectAppointment(appointment._id)}
                                                                    className="px-3 py-1 text-xs font-medium text-red-600 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appointments' && (
                            <div>
                                <div className="mb-6">
                                    <h2 className="text-xl font-semibold text-gray-900 mb-4">All Appointments</h2>
                                    {appointments.length === 0 ? (
                                        <div className="text-center py-12">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
                                            <p className="mt-1 text-sm text-gray-500">You haven't received any appointments yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {appointments.map((appointment) => (
                                                <div key={appointment._id} className="bg-white border border-gray-200 rounded-lg p-6">
                                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                                                        <div className="flex-1">
                                                            <h3 className="text-lg font-medium text-gray-900">
                                                                {appointment.patient?.firstName || ''} {appointment.patient?.lastName || ''}
                                                            </h3>
                                                            <p className="text-sm text-gray-600">
                                                                {appointment.hospital?.name || 'Unknown Hospital'}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                {new Date(appointment.appointmentDate).toLocaleDateString()} at {new Date(appointment.appointmentTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                            </p>
                                                            <p className="text-sm text-gray-600">
                                                                Reason: {appointment.reason}
                                                            </p>
                                                            {appointment.approvalMessage && (
                                                                <p className="text-sm text-gray-500">
                                                                    Note: {appointment.approvalMessage}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="mt-4 md:mt-0 md:ml-4">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                                                appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                                appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
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
                                {user?.hospitalId ? (
                                    <QueueSystem
                                        doctorId={user._id}
                                        hospitalId={user.hospitalId}
                                        role="doctor"
                                    />
                                ) : (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hospital assigned</h3>
                                        <p className="mt-1 text-sm text-gray-500">Please contact your administrator to assign you to a hospital.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div>
                                <div className="max-w-4xl mx-auto">
                                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                                        <div className="p-6 border-b border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-900">Update Doctor Profile</h3>
                                            <p className="text-sm text-gray-600 mt-1">Update your professional information and availability</p>
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

                                            <form onSubmit={handleUpdateProfile} className="space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Specialization *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="specialization"
                                                            value={editForm.specialization}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="e.g., Cardiology, Pediatrics"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Years of Experience *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            name="experience"
                                                            value={editForm.experience}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="5"
                                                            min="0"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Consultation Fee (₹) *
                                                        </label>
                                                        <input
                                                            type="number"
                                                            name="consultationFee"
                                                            value={editForm.consultationFee}
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="500"
                                                            min="0"
                                                            required
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            Languages *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            name="languages"
                                                            value={editForm.languages.join(', ')}
                                                            onChange={handleLanguageChange}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="English, Hindi, Spanish"
                                                            required
                                                        />
                                                    </div>
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
                                                        placeholder="Your clinic address"
                                                        required
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Bio
                                                    </label>
                                                    <textarea
                                                        name="bio"
                                                        value={editForm.bio}
                                                        onChange={handleInputChange}
                                                        rows="4"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Tell us about your medical background and expertise..."
                                                    />
                                                </div>

                                                {/* Availability Schedule */}
                                                <div>
                                                    <h4 className="text-lg font-medium text-gray-900 mb-4">Weekly Availability</h4>
                                                    <div className="space-y-3">
                                                        {editForm.availability.map((slot, index) => (
                                                            <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                                                                <div className="flex items-center space-x-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={slot.isAvailable}
                                                                        onChange={() => toggleAvailability(index)}
                                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                                    />
                                                                    <span className="text-sm font-medium text-gray-700 w-20">
                                                                        {slot.day}
                                                                    </span>
                                                                </div>
                                                                
                                                                {slot.isAvailable && (
                                                                    <>
                                                                        <input
                                                                            type="time"
                                                                            value={slot.startTime}
                                                                            onChange={(e) => handleAvailabilityChange(index, 'startTime', e.target.value)}
                                                                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                                                                        />
                                                                        <span className="text-gray-500">to</span>
                                                                        <input
                                                                            type="time"
                                                                            value={slot.endTime}
                                                                            onChange={(e) => handleAvailabilityChange(index, 'endTime', e.target.value)}
                                                                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                                                                        />
                                                                    </>
                                                                )}
                                                                
                                                                {!slot.isAvailable && (
                                                                    <span className="text-sm text-gray-500">Not available</span>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
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
                                                        {updating ? 'Updating...' : 'Update Profile'}
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
};

export default DoctorDashboard;