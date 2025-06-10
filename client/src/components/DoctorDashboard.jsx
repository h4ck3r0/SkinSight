import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import QueueSystem from "./QueueSystem";
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { toast } from 'react-hot-toast';

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { socket } = useSocket();
    const [doctorProfile, setDoctorProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'appointments' or 'queue'
    const [appointments, setAppointments] = useState([]);
    const [currentQueue, setCurrentQueue] = useState([]);
    const [activePatients, setActivePatients] = useState([]);
    const [formData, setFormData] = useState({
        specialization: "",
        experience: "",
        consultationFee: "",
        bio: "",
        qualifications: [{
            degree: "",
            institution: "",
            year: ""
        }],
        languages: ["English"],
        availability: [
            {
                day: "Monday",
                startTime: "09:00",
                endTime: "17:00",
                isAvailable: true
            },
            {
                day: "Tuesday",
                startTime: "09:00",
                endTime: "17:00",
                isAvailable: true
            }
        ],
        address: "",
        location: {
            type: "Point",
            coordinates: [0, 0]
        }
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (user.role !== 'doctor') {
            navigate('/login');
            return;
        }

        fetchAppointments();
    }, [user, navigate]);

    useEffect(() => {
        if (user) {
            fetchDoctorProfile();
        }
    }, [user]);

    useEffect(() => {
        if (!socket || !user) return;

        // Join doctor's room
        socket.emit('joinRoom', { userId: user._id });

        // Listen for queue updates
        socket.on('queueUpdate', (data) => {
            if (data.doctorId === user._id) {
                setCurrentQueue(data.queue);
            }
        });

        // Listen for patient called events
        socket.on('patientCalled', (data) => {
            if (data.doctorId === user._id) {
                setActivePatients(prev => [...prev, data.patient]);
            }
        });

        // Listen for consultation complete events
        socket.on('consultationComplete', (data) => {
            if (data.doctorId === user._id) {
                setActivePatients(prev => prev.filter(p => p._id !== data.patientId));
            }
        });

        return () => {
            socket.off('queueUpdate');
            socket.off('patientCalled');
            socket.off('consultationComplete');
        };
    }, [socket, user]);

    const fetchDoctorProfile = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Please login to access your profile');
                return;
            }

            const response = await axios.get('/doctors/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.doctor) {
                setDoctorProfile(response.data.doctor);
                // Set appointments from the profile
                if (response.data.doctor.profile?.appointments) {
                    setAppointments(response.data.doctor.profile.appointments);
                }
            }
        } catch (error) {
            console.error('Error fetching doctor profile:', error);
            toast.error(error.response?.data?.message || 'Failed to load doctor profile');
            setError(error.response?.data?.message || 'Failed to load doctor profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`https://mycarebridge.onrender.com/api/appointments/doctor/${user._id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setAppointments(response.data.appointments);
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setError(err.response?.data?.message || "Failed to fetch appointments");
        } finally {
            setLoading(false);
        }
    };

    const handleAppointmentAction = async (appointmentId, action) => {
        try {
            const response = await axios.patch(
                `https://mycarebridge.onrender.com/api/appointments/${appointmentId}`,
                { status: action },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            
            if (response.data.success) {
                toast.success(`Appointment ${action} successfully`);
                fetchAppointments();
            }
        } catch (err) {
            console.error(`Error ${action}ing appointment:`, err);
            toast.error(err.response?.data?.message || `Failed to ${action} appointment`);
        }
    };

    const handleCreateProfile = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            const response = await axios.post("https://mycarebridge.onrender.com/api/doctors/profile", formData, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.data && response.data.doctor) {
                setDoctorProfile(response.data.doctor);
                setError(null);
            }
        } catch (err) {
            console.error("Error creating profile:", err);
            setError(err.response?.data?.message || "Error creating profile");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith('qualification_')) {
            const [_, index, field] = name.split('_');
            const newQualifications = [...formData.qualifications];
            newQualifications[index][field] = value;
            setFormData(prev => ({
                ...prev,
                qualifications: newQualifications
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const addQualification = () => {
        setFormData(prev => ({
            ...prev,
            qualifications: [...prev.qualifications, { degree: "", institution: "", year: "" }]
        }));
    };

    const removeQualification = (index) => {
        setFormData(prev => ({
            ...prev,
            qualifications: prev.qualifications.filter((_, i) => i !== index)
        }));
    };

    const handleLanguageChange = (e) => {
        const languages = e.target.value.split(',').map(lang => lang.trim());
        setFormData(prev => ({
            ...prev,
            languages
        }));
    };

    const callNextPatient = () => {
        if (!socket || !user) return;
        socket.emit('callNextPatient', { doctorId: user._id });
    };

    const completeConsultation = (patientId) => {
        if (!socket || !user) return;
        socket.emit('completeConsultation', { 
            doctorId: user._id,
            patientId: patientId
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-64 bg-gray-200 rounded mb-4"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Doctor Profile Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-2xl font-bold mb-4">Doctor Profile</h2>
                            {doctorProfile?.profile && (
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold">Personal Information</h3>
                                        <p>Name: {doctorProfile.user.firstName}</p>
                                        <p>Email: {doctorProfile.user.email}</p>
                                        <p>Specialization: {doctorProfile.profile.specialization}</p>
                                        <p>Experience: {doctorProfile.profile.experience} years</p>
                                        <p>Consultation Fee: ${doctorProfile.profile.consultationFee}</p>
                                    </div>
                                    
                                    <div>
                                        <h3 className="font-semibold">Qualifications</h3>
                                        {doctorProfile.profile.qualifications.map((qual, index) => (
                                            <div key={qual._id} className="ml-4">
                                                <p>Degree: {qual.degree}</p>
                                                <p>Institution: {qual.institution}</p>
                                                <p>Year: {qual.year}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div>
                                        <h3 className="font-semibold">Languages</h3>
                                        <p>{doctorProfile.profile.languages.join(', ')}</p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold">Bio</h3>
                                        <p>{doctorProfile.profile.bio}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Queue Management Section */}
                    <div className="lg:col-span-1">
                        <QueueSystem 
                            doctorId={user?._id}
                            hospitalId={doctorProfile?.profile?.hospital}
                            role="doctor"
                        />
                    </div>

                    {/* Appointments Section */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-2xl font-bold mb-4">Appointments</h2>
                            {appointments.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {appointments.map((appointment) => (
                                        <div key={appointment._id} className="border rounded p-4">
                                            <p className="font-semibold">
                                                {new Date(appointment.date).toLocaleDateString()}
                                            </p>
                                            <p>Time: {appointment.startTime} - {appointment.endTime}</p>
                                            <p>Status: {appointment.isAvailable ? 'Available' : 'Booked'}</p>
                                            {appointment.patient && (
                                                <p>Patient: {appointment.patient.firstName}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500">No appointments scheduled</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
