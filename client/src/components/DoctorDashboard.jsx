import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import QueueSystem from './QueueSystem';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const DoctorDashboard = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [doctorProfile, setDoctorProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSocketConnected, setIsSocketConnected] = useState(false);

    useEffect(() => {
        if (user?._id) {
            fetchDoctorProfile();
        }
    }, [user]);

    // Socket connection and room joining
    useEffect(() => {
        if (socket && user?._id) {
            // Check socket connection status
            setIsSocketConnected(socket.connected);

            // Join the doctor's room for receiving queue updates
            socket.emit('joinRoom', user._id);

            // Socket event listeners
            socket.on('connect', () => {
                setIsSocketConnected(true);
                socket.emit('joinRoom', user._id);
                console.log('Doctor connected to socket and joined room:', user._id);
            });

            socket.on('disconnect', () => {
                setIsSocketConnected(false);
                console.log('Doctor disconnected from socket');
            });

            socket.on('error', (error) => {
                console.error('Socket error:', error);
                toast.error(`Socket error: ${error}`);
            });

            return () => {
                socket.off('connect');
                socket.off('disconnect');
                socket.off('error');
            };
        }
    }, [socket, user?._id]);

    const fetchDoctorProfile = async () => {
        try {
            setLoading(true);
            // Set base URL for axios
            axios.defaults.baseURL = 'https://mycarebridge.onrender.com/api';
            
            const response = await axios.get('/doctors/profile', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`, // Add auth token if needed
                }
            });
            
            setDoctorProfile(response.data.doctor);
            console.log('Doctor profile fetched:', response.data.doctor);
        } catch (error) {
            console.error('Error fetching doctor profile:', error);
            toast.error('Failed to fetch doctor profile');
            
            // If it's an auth error, you might want to redirect to login
            if (error.response?.status === 401) {
                toast.error('Please login again');
                // Add redirect to login if needed
            }
        } finally {
            setLoading(false);
        }
    };

    const handleApproveAppointment = async (appointmentId) => {
        try {
            await axios.put(`/doctors/appointments/${appointmentId}/approve`, {}, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            toast.success('Appointment approved');
            fetchDoctorProfile(); // Refresh profile to get updated appointments
        } catch (error) {
            console.error('Error approving appointment:', error);
            toast.error('Failed to approve appointment');
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Check if user has hospital assigned
    if (!user?.hospitalId) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-red-600">No Hospital Assigned</h2>
                    <p className="mt-2">Please contact your administrator to assign you to a hospital.</p>
                </div>
            </div>
        );
    }

    // Filter today's appointments - Fixed logic
    const today = new Date();
    const todayString = today.toDateString();
    
    console.log('Today:', todayString);
    console.log('All appointments:', doctorProfile?.profile?.appointments);
    
    const todaysAppointments = doctorProfile?.profile?.appointments?.filter(appointment => {
        if (!appointment.date) return false;
        
        const appointmentDate = new Date(appointment.date);
        const appointmentString = appointmentDate.toDateString();
        
        console.log('Appointment date string:', appointmentString);
        console.log('Matches today:', appointmentString === todayString);
        
        return appointmentString === todayString && !appointment.isAvailable;
    }) || [];
    
    console.log('Filtered today\'s appointments:', todaysAppointments);

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
                
                {/* Socket Connection Status */}
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">
                        {isSocketConnected ? 'Connected' : 'Disconnected'}
                    </span>
                </div>
            </div>
            
            {/* Doctor Profile Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Doctor Profile</h2>
                {doctorProfile?.profile ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">Personal Information</h3>
                            <p className="text-gray-600">Email: {doctorProfile.user?.email || 'N/A'}</p>
                            <p className="text-gray-600">Specialization: {doctorProfile.profile?.specialization || 'N/A'}</p>
                            <p className="text-gray-600">Experience: {doctorProfile.profile?.experience || 0} years</p>
                            <p className="text-gray-600">Consultation Fee: ${doctorProfile.profile?.consultationFee || 0}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Qualifications</h3>
                            {doctorProfile.profile?.qualifications?.length > 0 ? (
                                doctorProfile.profile.qualifications.map((qual, index) => (
                                    <div key={qual._id || index} className="mb-2">
                                        <p className="text-gray-600">Degree: {qual.degree || 'N/A'}</p>
                                        <p className="text-gray-600">Institution: {qual.institution || 'N/A'}</p>
                                        <p className="text-gray-600">Year: {qual.year || 'N/A'}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">No qualifications added</p>
                            )}
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-500">Profile information not available</p>
                )}
            </div>

            {/* Today's Appointments Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Today's Appointments</h2>
                {todaysAppointments.length > 0 ? (
                    <div className="space-y-4">
                        {todaysAppointments.map((appointment) => (
                            <div key={appointment._id} className="border rounded-lg p-4 bg-blue-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold">
                                            {appointment.patient ? 
                                                `${appointment.patient.firstName} ${appointment.patient.lastName}` : 
                                                'Patient Name Not Available'
                                            }
                                        </h3>
                                        <p className="text-gray-600">Date: {new Date(appointment.date).toLocaleDateString()}</p>
                                        <p className="text-gray-600">Time: {appointment.startTime} - {appointment.endTime}</p>
                                        <p className="text-gray-600">Status: {appointment.status || 'Scheduled'}</p>
                                    </div>
                                    {appointment.status === 'pending' && (
                                        <button
                                            onClick={() => handleApproveAppointment(appointment._id)}
                                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                                        >
                                            Approve
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No appointments scheduled for today</p>
                )}
            </div>

            {/* Queue Management */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Queue Management</h2>
                    <div className="text-sm text-gray-600">
                        Hospital ID: {user.hospitalId}
                    </div>
                </div>
                
                {/* Only show queue system if doctor ID and hospital ID are available */}
                {user._id && user.hospitalId ? (
                    <QueueSystem 
                        doctorId={user._id}
                        hospitalId={user.hospitalId}
                        role="doctor"
                    />
                ) : (
                    <div className="text-red-500">
                        Missing required information for queue management
                    </div>
                )}
            </div>

            {/* All Appointments Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">All Appointments</h2>
                {doctorProfile?.profile?.appointments?.length > 0 ? (
                    <div className="space-y-4">
                        {doctorProfile.profile.appointments
                            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
                            .map((appointment) => (
                            <div key={appointment._id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold">
                                            {appointment.patient ? 
                                                `${appointment.patient.firstName} ${appointment.patient.lastName}` : 
                                                'Patient Name Not Available'
                                            }
                                        </h3>
                                        <p className="text-gray-600">Date: {new Date(appointment.date).toLocaleDateString()}</p>
                                        <p className="text-gray-600">Time: {appointment.startTime} - {appointment.endTime}</p>
                                        <p className="text-gray-600">Status: 
                                            <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                                appointment.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {appointment.status || 'Scheduled'}
                                            </span>
                                        </p>
                                        {appointment.reason && (
                                            <p className="text-gray-600">Reason: {appointment.reason}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {appointment.status === 'pending' && (
                                            <button
                                                onClick={() => handleApproveAppointment(appointment._id)}
                                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                                            >
                                                Approve
                                            </button>
                                        )}
                                        {/* You can add more action buttons here if needed */}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">No appointments scheduled</p>
                )}
            </div>
        </div>
    );
};

export default DoctorDashboard;