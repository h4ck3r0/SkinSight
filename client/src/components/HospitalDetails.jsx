import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navigation from './Navigation';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://mycarebridge.onrender.com/api';

export default function HospitalDetails() {
    const { hospitalId } = useParams();
    const navigate = useNavigate();
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [showAppointmentForm, setShowAppointmentForm] = useState(false);
    const [appointmentDate, setAppointmentDate] = useState('');
    const [appointmentTime, setAppointmentTime] = useState('');
    const [appointmentReason, setAppointmentReason] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
        } else {
            navigate('/login');
            return;
        }

        if (hospitalId) {
            fetchHospitalDetails();
        }
    }, [hospitalId, navigate]);

    const fetchHospitalDetails = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await axios.get(`${API_URL}/hospital/${hospitalId}`);
            
            if (response.data && response.data.hospital) {
                setHospital(response.data.hospital);
            } else {
                setError('Hospital not found');
            }
        } catch (err) {
            console.error('Error fetching hospital details:', err);
            setError(err.response?.data?.message || 'Failed to fetch hospital details');
        } finally {
            setLoading(false);
        }
    };

    const handleBookAppointment = (doctor) => {
        setSelectedDoctor(doctor);
        setShowAppointmentForm(true);
        setAppointmentDate('');
        setAppointmentTime('');
        setAppointmentReason('');
    };

    const handleJoinQueue = (doctor) => {
        const doctorId = doctor.user?._id || doctor._id;
        
        if (!doctorId) {
            toast.error('Doctor ID is missing. Please try again.');
            return;
        }
        
        if (!hospital._id) {
            toast.error('Hospital ID is missing. Please try again.');
            return;
        }
        
        // Navigate to patient dashboard with queue tab active
        navigate('/patient', { 
            state: { 
                activeTab: 'queue',
                selectedHospital: hospital,
                selectedDoctor: { ...doctor, _id: doctorId }
            }
        });
    };

    const handleAppointmentSubmit = async (e) => {
        e.preventDefault();
        
        const doctorId = selectedDoctor.user?._id || selectedDoctor._id;
        
        if (!doctorId || !hospital?._id) {
            toast.error("Please select a doctor and hospital");
            return;
        }

        if (!appointmentDate || !appointmentTime || !appointmentReason) {
            toast.error("Please fill in all appointment details");
            return;
        }

        setLoading(true);
        setError(null);
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${API_URL}/appointments/create`,
                {
                    doctor: doctorId,
                    patient: user._id,
                    hospital: hospital._id,
                    appointmentDate,
                    appointmentTime,
                    reason: appointmentReason
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                toast.success("Appointment created successfully!");
                setShowAppointmentForm(false);
                setAppointmentDate('');
                setAppointmentTime('');
                setAppointmentReason('');
                setSelectedDoctor(null);
            }
        } catch (err) {
            console.error("Error creating appointment:", err);
            const errorMessage = err.response?.data?.message || "Failed to create appointment";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
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
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="text-center">
                            <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <h2 className="mt-4 text-xl font-semibold text-red-600">Error</h2>
                            <p className="mt-2 text-gray-600">{error}</p>
                            <button
                                onClick={() => navigate('/patient')}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
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
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-gray-900">Hospital not found</h2>
                            <button
                                onClick={() => navigate('/patient')}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <Navigation />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate('/patient')}
                        className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">{hospital.name}</h1>
                    <p className="text-lg text-gray-600 mt-2">{hospital.address}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Hospital Information */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Hospital Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Address</label>
                                    <p className="text-gray-900">{hospital.address}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Phone</label>
                                    <p className="text-gray-900">{hospital.phone}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-600">Email</label>
                                    <p className="text-gray-900">{hospital.email}</p>
                                </div>
                                {hospital.service && hospital.service.length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Services</label>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {hospital.service.map((service, index) => (
                                                <span
                                                    key={index}
                                                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                                >
                                                    {service}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Doctors List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Available Doctors</h2>
                            
                            {hospital.doctors && hospital.doctors.length > 0 ? (
                                <div className="space-y-4">
                                    {hospital.doctors.map((doctor) => (
                                        <div key={doctor._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        Dr. {doctor.user ? 
                                                            `${doctor.user.firstName || ''} ${doctor.user.lastName || ''}`.trim() || 'Unknown Doctor' 
                                                            : doctor.name || 'Unknown Doctor'
                                                        }
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mt-1">{doctor.specialization}</p>
                                                    {doctor.experience && (
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            Experience: {doctor.experience} years
                                                        </p>
                                                    )}
                                                    {doctor.consultationFee && (
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            Consultation Fee: ₹{doctor.consultationFee}
                                                        </p>
                                                    )}
                                                    {doctor.languages && doctor.languages.length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="text-sm text-gray-500">Languages:</p>
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {doctor.languages.map((language, index) => (
                                                                    <span
                                                                        key={index}
                                                                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                                                    >
                                                                        {language}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {doctor.bio && (
                                                        <p className="text-sm text-gray-600 mt-2">{doctor.bio}</p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col space-y-2 ml-4">
                                                    <button
                                                        onClick={() => handleBookAppointment(doctor)}
                                                        className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                                                    >
                                                        Book Appointment
                                                    </button>
                                                    <button
                                                        onClick={() => handleJoinQueue(doctor)}
                                                        className="px-4 py-2 text-sm font-medium text-green-600 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
                                                    >
                                                        Join Queue
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No doctors available</h3>
                                    <p className="mt-1 text-sm text-gray-500">This hospital currently has no doctors assigned.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Appointment Form Modal */}
            {showAppointmentForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Book Appointment</h3>
                        <form onSubmit={handleAppointmentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Hospital
                                </label>
                                <input
                                    type="text"
                                    value={hospital?.name || ''}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Doctor
                                </label>
                                <input
                                    type="text"
                                    value={selectedDoctor ? 
                                        `Dr. ${selectedDoctor.user ? 
                                            `${selectedDoctor.user.firstName || ''} ${selectedDoctor.user.lastName || ''}`.trim() || 'Unknown Doctor' 
                                            : selectedDoctor.name || 'Unknown Doctor'
                                        }` : ''
                                    }
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={appointmentDate}
                                    onChange={(e) => setAppointmentDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Time
                                </label>
                                <input
                                    type="time"
                                    value={appointmentTime}
                                    onChange={(e) => setAppointmentTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Reason for Visit
                                </label>
                                <textarea
                                    value={appointmentReason}
                                    onChange={(e) => setAppointmentReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Please describe your symptoms or reason for visit"
                                    required
                                />
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAppointmentForm(false)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Booking...' : 'Book Appointment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 