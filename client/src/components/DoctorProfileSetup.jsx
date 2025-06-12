import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGeolocation } from '../hooks/useGeolocation';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'https://mycarebridge.onrender.com/api';

export default function DoctorProfileSetup() {
    const [loading, setLoading] = useState(false);
    const { location, error: locationError } = useGeolocation();
    const [formData, setFormData] = useState({
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
    const { token } = useAuth();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAvailabilityChange = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            availability: prev.availability.map((slot, i) => 
                i === index ? { ...slot, [field]: value } : slot
            )
        }));
    };

    const toggleAvailability = (index) => {
        setFormData(prev => ({
            ...prev,
            availability: prev.availability.map((slot, i) => 
                i === index ? { ...slot, isAvailable: !slot.isAvailable } : slot
            )
        }));
    };

    const handleLanguageChange = (e) => {
        const languages = e.target.value.split(',').map(lang => lang.trim());
        setFormData(prev => ({
            ...prev,
            languages
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Check if location is available
            if (!location || !location.lat || !location.lng) {
                toast.error('Please enable location access to create your profile');
                setLoading(false);
                return;
            }

            // Prepare location data
            const locationData = {
                type: 'Point',
                coordinates: [parseFloat(location.lng), parseFloat(location.lat)]
            };

            const profileData = {
                ...formData,
                location: locationData
            };

            const response = await axios.post(
                `${API_URL}/doctors/profile`,
                profileData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                toast.success('Doctor profile created successfully!');
                navigate('/hospital-selection');
            }
        } catch (error) {
            console.error('Error creating doctor profile:', error);
            toast.error(error.response?.data?.message || 'Failed to create doctor profile');
        } finally {
            setLoading(false);
        }
    };

    // Show location error if available
    if (locationError) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Location Access Required
                        </h1>
                        <p className="text-lg text-gray-600 mb-6">
                            Please enable location access to create your doctor profile.
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                            <p className="text-yellow-800">
                                {locationError}
                            </p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Retry with Location
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Complete Your Doctor Profile
                    </h1>
                    <p className="text-lg text-gray-600">
                        Please provide your professional information to continue
                    </p>
                    {location && (
                        <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Location detected
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-lg p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Specialization *
                                </label>
                                <input
                                    type="text"
                                    name="specialization"
                                    value={formData.specialization}
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
                                    value={formData.experience}
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
                                    value={formData.consultationFee}
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
                                    value={formData.languages.join(', ')}
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
                                value={formData.address}
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
                                value={formData.bio}
                                onChange={handleInputChange}
                                rows="4"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Tell us about your medical background and expertise..."
                            />
                        </div>

                        {/* Availability Schedule */}
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Weekly Availability</h3>
                            <div className="space-y-3">
                                {formData.availability.map((slot, index) => (
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
                                onClick={() => navigate('/login')}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !location}
                                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Creating Profile...' : 'Create Profile'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
} 