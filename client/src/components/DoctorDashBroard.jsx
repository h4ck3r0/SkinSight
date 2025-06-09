import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [doctorProfile, setDoctorProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateProfile, setShowCreateProfile] = useState(false);
    const [formData, setFormData] = useState({
        specialization: "",
        qualifications: [{ degree: "", institution: "", year: "" }],
        experience: 0,
        consultationFee: 500,
        languages: ["English"],
        bio: "",
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
        ]
    });

    useEffect(() => {
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            fetchDoctorProfile(parsedUser._id);
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const fetchDoctorProfile = async (userId) => {
        try {
            setLoading(true);
            const response = await axios.get(`https://mycarebridge.onrender.com/api/doctors/profile/${userId}`);
            if (response.data) {
                setDoctorProfile(response.data);
                setShowCreateProfile(false);
            }
        } catch (err) {
            console.error("Error fetching doctor profile:", err);
            if (err.response?.status === 404) {
                setShowCreateProfile(true);
            } else {
                setError(err.response?.data?.message || "Error fetching profile");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProfile = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await axios.post(
                "https://mycarebridge.onrender.com/api/doctors/create",
                {
                    ...formData,
                    user: user._id
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            if (response.data) {
                setDoctorProfile(response.data);
                setShowCreateProfile(false);
                setError(null);
            }
        } catch (err) {
            console.error("Error creating profile:", err);
            setError(err.response?.data?.message || "Error creating profile");
        } finally {
            setLoading(false);
        }
    };

    const handleQualificationChange = (index, field, value) => {
        const newQualifications = [...formData.qualifications];
        newQualifications[index][field] = value;
        setFormData({ ...formData, qualifications: newQualifications });
    };

    const addQualification = () => {
        setFormData({
            ...formData,
            qualifications: [...formData.qualifications, { degree: "", institution: "", year: "" }]
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-gray-800">Doctor Dashboard</h1>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                        {error}
                    </div>
                )}

                {showCreateProfile ? (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-semibold mb-6">Create Your Doctor Profile</h2>
                        <form onSubmit={handleCreateProfile} className="space-y-6">
                            <div>
                                <label className="block text-gray-700 mb-2">Specialization</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.specialization}
                                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-2">Experience (years)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.experience}
                                    onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-2">Consultation Fee (₹)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.consultationFee}
                                    onChange={(e) => setFormData({ ...formData, consultationFee: parseInt(e.target.value) })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-2">Bio</label>
                                <textarea
                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    rows="4"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-2">Qualifications</label>
                                {formData.qualifications.map((qual, index) => (
                                    <div key={index} className="grid grid-cols-3 gap-4 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Degree"
                                            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={qual.degree}
                                            onChange={(e) => handleQualificationChange(index, 'degree', e.target.value)}
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Institution"
                                            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={qual.institution}
                                            onChange={(e) => handleQualificationChange(index, 'institution', e.target.value)}
                                            required
                                        />
                                        <input
                                            type="number"
                                            placeholder="Year"
                                            className="p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={qual.year}
                                            onChange={(e) => handleQualificationChange(index, 'year', e.target.value)}
                                            required
                                        />
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addQualification}
                                    className="mt-2 text-blue-500 hover:text-blue-700"
                                >
                                    + Add Qualification
                                </button>
                            </div>

                            <div>
                                <label className="block text-gray-700 mb-2">Languages</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.languages.join(", ")}
                                    onChange={(e) => setFormData({ ...formData, languages: e.target.value.split(",").map(lang => lang.trim()) })}
                                    placeholder="Enter languages separated by commas"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                            >
                                Create Profile
                            </button>
                        </form>
                    </div>
                ) : doctorProfile ? (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-semibold mb-6">Your Profile</h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-medium text-gray-700">Personal Information</h3>
                                <p className="text-gray-600">Name: {user.firstName} {user.lastName}</p>
                                <p className="text-gray-600">Email: {user.email}</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-700">Professional Information</h3>
                                <p className="text-gray-600">Specialization: {doctorProfile.specialization}</p>
                                <p className="text-gray-600">Experience: {doctorProfile.experience} years</p>
                                <p className="text-gray-600">Consultation Fee: ₹{doctorProfile.consultationFee}</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-700">Qualifications</h3>
                                <ul className="list-disc list-inside text-gray-600">
                                    {doctorProfile.qualifications.map((qual, index) => (
                                        <li key={index}>
                                            {qual.degree} from {qual.institution} ({qual.year})
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-700">Languages</h3>
                                <p className="text-gray-600">{doctorProfile.languages.join(", ")}</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-700">Bio</h3>
                                <p className="text-gray-600">{doctorProfile.bio}</p>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-700">Availability</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {doctorProfile.availability.map((slot, index) => (
                                        <div key={index} className="bg-gray-50 p-3 rounded">
                                            <p className="font-medium">{slot.day}</p>
                                            <p className="text-gray-600">
                                                {slot.isAvailable ? 
                                                    `${slot.startTime} - ${slot.endTime}` : 
                                                    "Not Available"}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {doctorProfile.hospital && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-700">Current Hospital</h3>
                                    <p className="text-gray-600">Name: {doctorProfile.hospital.name}</p>
                                    <p className="text-gray-600">Address: {doctorProfile.hospital.address}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600">No profile found. Please create your doctor profile.</p>
                        <button
                            onClick={() => setShowCreateProfile(true)}
                            className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
                        >
                            Create Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
} 