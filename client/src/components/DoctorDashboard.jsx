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
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSocketConnected, setIsSocketConnected] = useState(false);

    useEffect(() => {
        if (user?._id) {
            fetchDoctorProfile();
            fetchDoctorAppointments();
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

    const fetchDoctorAppointments = async () => {
        try {
            console.log('Fetching appointments for doctor ID:', user._id);
            
            const response = await axios.get(`/appointments/doctor/${user._id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            
            console.log('Full response:', response);
            
            if (response.data && response.data.appointments) {
                setAppointments(response.data.appointments);
                console.log('Doctor appointments fetched:', response.data.appointments);
            } else {
                console.log('No appointments found');
                setAppointments([]);
            }
        } catch (error) {
            console.error('Error fetching doctor appointments:', error);
            console.error('Error response:', error.response);
            toast.error('Failed to fetch appointments');
            setAppointments([]);
        }
    };

    const handleApproveAppointment = async (appointmentId) => {
        try {
            await axios.put(`/doctors/appointments/${appointmentId}/approve`, {
                approvalStatus: 'approved',
                approvalMessage: 'Appointment approved by doctor'
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            toast.success('Appointment approved successfully');
            fetchDoctorAppointments(); // Refresh appointments
        } catch (error) {
            console.error('Error approving appointment:', error);
            toast.error('Failed to approve appointment');
        }
    };

    const handleRejectAppointment = async (appointmentId) => {
        try {
            await axios.put(`/doctors/appointments/${appointmentId}/approve`, {
                approvalStatus: 'rejected',
                approvalMessage: 'Appointment rejected by doctor'
            }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            toast.success('Appointment rejected successfully');
            fetchDoctorAppointments(); // Refresh appointments
        } catch (error) {
            console.error('Error rejecting appointment:', error);
            toast.error('Failed to reject appointment');
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

    // Filter today's appointments from actual appointments
    const today = new Date();
    const todayString = today.toDateString();
    
    const todaysAppointments = appointments.filter(appointment => {
        if (!appointment.appointmentDate) return false;
        
        const appointmentDate = new Date(appointment.appointmentDate);
        const appointmentString = appointmentDate.toDateString();
        
        return appointmentString === todayString;
    });

    return (
        <div className="min-h-screen bg-[#A6DCEF]/10">
            <div className="container mx-auto px-6 py-8">
                <div className="flex justify-between items-center mb-8 bg-white rounded-lg shadow-md p-6">
                    <h1 className="text-3xl font-bold text-[#2C3E50]">Doctor Dashboard</h1>
                    
                    <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-full">
                        <div className={`w-3 h-3 rounded-full ${isSocketConnected ? 'bg-[#2C3E50] animate-pulse' : 'bg-red-500'}`}></div>
                        <span className={`text-sm font-medium ${isSocketConnected ? 'text-[#2C3E50]' : 'text-red-600'}`}>
                            {isSocketConnected ? 'Connected' : 'Disconnected'}
                        </span>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-100">
                    <h2 className="text-2xl font-semibold mb-6 text-[#2C3E50] pb-2 border-b border-[#A6DCEF]">Doctor Profile</h2>
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

                <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-100">
                    <h2 className="text-2xl font-semibold mb-6 text-[#2C3E50] pb-2 border-b border-[#A6DCEF]">Today's Appointments</h2>
                    {todaysAppointments.length > 0 ? (
                        <div className="space-y-4">
                            {todaysAppointments.map((appointment) => (
                                <div key={appointment._id} className="border rounded-lg p-6 bg-gradient-to-r from-[#A6DCEF]/20 to-white shadow-sm hover:shadow-md transition-shadow duration-200">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold">
                                                {appointment.patient ? 
                                                    `${appointment.patient.firstName} ${appointment.patient.lastName}` : 
                                                    'Patient Name Not Available'
                                                }
                                            </h3>
                                            <p className="text-gray-600">Date: {new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                                            <p className="text-gray-600">Time: {new Date(appointment.appointmentTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            <p className="text-gray-600">Status: 
                                                <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                                    appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
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
                                        {appointment.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApproveAppointment(appointment._id)}
                                                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-all duration-200"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectAppointment(appointment._id)}
                                                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-all duration-200"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No appointments scheduled for today</p>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-100">
                    <div className="flex justify-between items-center mb-6 pb-2 border-b">
                        <h2 className="text-2xl font-semibold text-[#2C3E50]">Queue Management</h2>
                        <div className="px-4 py-2 bg-[#A6DCEF]/10 rounded-full">
                            <span className="text-sm font-medium text-[#2C3E50]">
                                Hospital ID: <span className="text-[#2C3E50] font-bold">{user.hospitalId}</span>
                            </span>
                        </div>
                    </div>
                    
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

                <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                    <h2 className="text-2xl font-semibold mb-6 text-[#2C3E50] pb-2 border-b border-[#A6DCEF]">All Appointments</h2>
                    {appointments.length > 0 ? (
                        <div className="space-y-4">
                            {appointments
                                .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
                                .map((appointment) => (
                                    <div key={appointment._id} className="border rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-semibold">
                                                    {appointment.patient ? 
                                                        `${appointment.patient.firstName} ${appointment.patient.lastName}` : 
                                                        'Patient Name Not Available'
                                                    }
                                                </h3>
                                                <p className="text-gray-600">Date: {new Date(appointment.appointmentDate).toLocaleDateString()}</p>
                                                <p className="text-gray-600">Time: {new Date(appointment.appointmentTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                                <p className="text-gray-600">Status: 
                                                    <span className={`ml-1 px-2 py-1 rounded text-xs ${
                                                        appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
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
                                                    <>
                                                        <button
                                                            onClick={() => handleApproveAppointment(appointment._id)}
                                                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-all duration-200"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectAppointment(appointment._id)}
                                                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-all duration-200"
                                                        >
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
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
        </div>
    );
};

export default DoctorDashboard;