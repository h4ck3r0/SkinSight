import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import QueueSystem from './QueueSystem';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const DoctorDashboard = () => {
    const { user } = useAuth();
    const [doctorProfile, setDoctorProfile] = useState(null);

    useEffect(() => {
        if (user?._id) {
            fetchDoctorProfile();
        }
    }, [user]);

    const fetchDoctorProfile = async () => {
        try {
            const response = await axios.get('/doctors/profile');
            setDoctorProfile(response.data.doctor);
        } catch (error) {
            console.error('Error fetching doctor profile:', error);
            toast.error('Failed to fetch doctor profile');
        }
    };

    const handleApproveAppointment = async (appointmentId) => {
        try {
            await axios.put(`/doctors/appointments/${appointmentId}/approve`);
            toast.success('Appointment approved');
            fetchDoctorProfile(); // Refresh profile to get updated appointments
        } catch (error) {
            console.error('Error approving appointment:', error);
            toast.error('Failed to approve appointment');
        }
    };

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

    // Filter today's appointments
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();
    
    console.log('Today:', today);
    console.log('All appointments:', doctorProfile?.profile?.appointments);
    
    const todaysAppointments = doctorProfile?.profile?.appointments?.filter(appointment => {
        const appointmentDate = new Date(appointment.date);
        console.log('Appointment date:', appointmentDate);
        return appointmentDate.getMonth() === todayMonth && 
               appointmentDate.getDate() === todayDate && 
               !appointment.isAvailable;
    }) || [];
    
    console.log('Filtered appointments:', todaysAppointments);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Doctor Dashboard</h1>
            
            {/* Doctor Profile Section */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Doctor Profile</h2>
                {doctorProfile?.profile && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-2">Personal Information</h3>
                            <p className="text-gray-600">Name: {doctorProfile.user.firstName}</p>
                            <p className="text-gray-600">Email: {doctorProfile.user.email}</p>
                            <p className="text-gray-600">Specialization: {doctorProfile.profile.specialization}</p>
                            <p className="text-gray-600">Experience: {doctorProfile.profile.experience} years</p>
                            <p className="text-gray-600">Consultation Fee: ${doctorProfile.profile.consultationFee}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Qualifications</h3>
                            {doctorProfile.profile.qualifications.map((qual, index) => (
                                <div key={qual._id} className="mb-2">
                                    <p className="text-gray-600">Degree: {qual.degree}</p>
                                    <p className="text-gray-600">Institution: {qual.institution}</p>
                                    <p className="text-gray-600">Year: {qual.year}</p>
                                </div>
                            ))}
                        </div>
                    </div>
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
                <QueueSystem 
                    doctorId={user._id}
                    hospitalId={user.hospitalId}
                    role="doctor"
                />
            </div>

            {/* All Appointments Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">All Appointments</h2>
                {doctorProfile?.profile?.appointments?.length > 0 ? (
                    <div className="space-y-4">
                        {doctorProfile.profile.appointments.map((appointment) => (
                            <div key={appointment._id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold">
                                            {appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : 'Patient Name Not Available'}
                                        </h3>
                                        <p className="text-gray-600">Date: {new Date(appointment.date).toLocaleDateString()}</p>
                                        <p className="text-gray-600">Time: {appointment.startTime} - {appointment.endTime}</p>
                                        <p className="text-gray-600">Status: {appointment.status || 'Scheduled'}</p>
                                    </div>
                                    {appointment.status === 'pending' && (
                                        <button
                                            onClick={() => handleApproveAppointment(appointment._id)}
                                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                        >
                                            Approve
                                        </button>
                                    )}
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
