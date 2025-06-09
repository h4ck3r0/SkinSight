import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [doctorProfile, setDoctorProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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

    if (!doctorProfile) {
        return (
            <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Create Your Doctor Profile</h2>
                    <form onSubmit={handleCreateProfile} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Specialization</label>
                            <input
                                type="text"
                                name="specialization"
                                value={formData.specialization}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Experience (years)</label>
                            <input
                                type="number"
                                name="experience"
                                value={formData.experience}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Consultation Fee (₹)</label>
                            <input
                                type="number"
                                name="consultationFee"
                                value={formData.consultationFee}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Address</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                                placeholder="Enter your clinic/hospital address"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Bio</label>
                            <textarea
                                name="bio"
                                value={formData.bio}
                                onChange={handleInputChange}
                                rows="3"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Qualifications</label>
                            {formData.qualifications.map((qual, index) => (
                                <div key={index} className="grid grid-cols-3 gap-4 mb-2">
                                    <input
                                        type="text"
                                        name={`qualification_${index}_degree`}
                                        value={qual.degree}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="Degree"
                                        required
                                    />
                                    <input
                                        type="text"
                                        name={`qualification_${index}_institution`}
                                        value={qual.institution}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                        placeholder="Institution"
                                        required
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            name={`qualification_${index}_year`}
                                            value={qual.year}
                                            onChange={handleInputChange}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            placeholder="Year"
                                            required
                                        />
                                        {index > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => removeQualification(index)}
                                                className="mt-1 px-2 py-1 text-red-600 hover:text-red-800"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={addQualification}
                                className="mt-2 text-blue-600 hover:text-blue-800"
                            >
                                + Add Qualification
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Languages</label>
                            <input
                                type="text"
                                name="languages"
                                value={formData.languages.join(", ")}
                                onChange={handleLanguageChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="Enter languages separated by commas"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            Create Profile
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
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
            </div>
        </div>
    );
}
