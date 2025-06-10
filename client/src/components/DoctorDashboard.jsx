import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [doctorProfile, setDoctorProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'appointments'
    const [appointments, setAppointments] = useState([]);
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
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        if (user) {
            fetchDoctorProfile();
        }
    }, [user]);

    useEffect(() => {
        if (doctorProfile) {
            fetchAppointments();
        }
    }, [doctorProfile]);

    const fetchDoctorProfile = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get("https://mycarebridge.onrender.com/api/doctors/profile", {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            if (response.data && response.data.doctor) {
                setDoctorProfile(response.data.doctor);
            }
        } catch (err) {
            console.error("Error fetching doctor profile:", err);
            if (err.response?.status === 404) {
                // Profile doesn't exist yet, that's okay
                setDoctorProfile(null);
            } else {
                setError(err.response?.data?.message || "Error fetching profile");
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchAppointments = async () => {
        if (!doctorProfile || !doctorProfile._id) {
            console.log("Waiting for doctor profile to load...");
            return;
        }

        try {
            console.log("Fetching appointments for doctor:", doctorProfile._id);
            const response = await axios.get(`https://mycarebridge.onrender.com/api/appointments/doctor/${doctorProfile._id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            console.log("Appointments response:", response.data);
            if (response.data && response.data.appointments) {
                setAppointments(response.data.appointments);
            }
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setError(err.response?.data?.message || "Error fetching appointments");
        }
    };

    const handleAppointmentAction = async (appointmentId, action) => {
        try {
            const response = await axios.put(
                `https://mycarebridge.onrender.com/api/appointments/update/${appointmentId}`,
                { 
                    status: action === 'approved' ? 'confirmed' : 'cancelled',
                    approvalStatus: action
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            if (response.data) {
                // Refresh appointments after action
                fetchAppointments();
            }
        } catch (err) {
            console.error("Error updating appointment:", err);
            setError(err.response?.data?.message || "Error updating appointment");
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex space-x-4 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`px-4 py-2 text-sm font-medium ${
                                activeTab === 'profile'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Profile
                        </button>
                        <button
                            onClick={() => setActiveTab('appointments')}
                            className={`px-4 py-2 text-sm font-medium ${
                                activeTab === 'appointments'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Appointments
                        </button>
                    </div>
                </div>

                {activeTab === 'profile' ? (
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                        <div className="px-6 py-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Doctor Profile</h2>
                            
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                                    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Name</p>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {doctorProfile.user.firstName} {doctorProfile.user.lastName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Email</p>
                                            <p className="mt-1 text-sm text-gray-900">{doctorProfile.user.email}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Professional Information</h3>
                                    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Specialization</p>
                                            <p className="mt-1 text-sm text-gray-900">{doctorProfile.profile.specialization}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Experience</p>
                                            <p className="mt-1 text-sm text-gray-900">{doctorProfile.profile.experience} years</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Consultation Fee</p>
                                            <p className="mt-1 text-sm text-gray-900">₹{doctorProfile.profile.consultationFee}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">Languages</p>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {Array.isArray(doctorProfile.profile.languages) 
                                                    ? doctorProfile.profile.languages.join(", ")
                                                    : doctorProfile.profile.languages}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Qualifications</h3>
                                    <div className="mt-2 space-y-2">
                                        {doctorProfile.profile.qualifications.map((qual, index) => (
                                            <div key={index} className="bg-gray-50 p-3 rounded">
                                                <p className="text-sm text-gray-900">
                                                    {qual.degree} from {qual.institution} ({qual.year})
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Bio</h3>
                                    <p className="mt-2 text-sm text-gray-900">{doctorProfile.profile.bio}</p>
                                </div>

                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Availability</h3>
                                    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {doctorProfile.profile.availability.map((slot, index) => (
                                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                                <p className="text-sm font-medium text-gray-900">{slot.day}</p>
                                                <p className="text-sm text-gray-500">
                                                    {slot.startTime} - {slot.endTime}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {slot.isAvailable ? "Available" : "Not Available"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                        <div className="px-6 py-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">Appointments</h2>
                            
                            <div className="space-y-6">
                                {appointments.length === 0 ? (
                                    <p className="text-gray-500 text-center">No appointments found</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-6">
                                        {appointments.map((appointment) => (
                                            <div key={appointment._id} className="bg-gray-50 p-6 rounded-lg">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Date</p>
                                                        <p className="mt-1 text-sm text-gray-900">
                                                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Time</p>
                                                        <p className="mt-1 text-sm text-gray-900">
                                                            {new Date(appointment.appointmentTime).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Patient</p>
                                                        <p className="mt-1 text-sm text-gray-900">
                                                            {appointment.patient?.firstName} {appointment.patient?.lastName}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Status</p>
                                                        <p className="mt-1 text-sm text-gray-900">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                                                appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                                {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                                                            </span>
                                                        </p>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <p className="text-sm font-medium text-gray-500">Reason</p>
                                                        <p className="mt-1 text-sm text-gray-900">{appointment.reason}</p>
                                                    </div>
                                                </div>

                                                {appointment.status === 'pending' && (
                                                    <div className="mt-4 flex justify-end space-x-4">
                                                        <button
                                                            onClick={() => handleAppointmentAction(appointment._id, 'rejected')}
                                                            className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                                        >
                                                            Reject
                                                        </button>
                                                        <button
                                                            onClick={() => handleAppointmentAction(appointment._id, 'approved')}
                                                            className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                        >
                                                            Approve
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
