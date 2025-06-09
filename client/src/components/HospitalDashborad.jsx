import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import HospitalDoctors from "./HospitalDoctors";

export default function HospitalDashborad() {
    const navigate = useNavigate();
    const [hospital, setHospital] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Get user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            if (parsedUser.role !== 'staff') {
                navigate('/login');
            }
        } else {
            navigate('/login');
        }
    }, [navigate]);

    useEffect(() => {
        if (user && user.hospitalId) {
            fetchHospital();
        } else if (user && !user.hospitalId) {
            setError("No hospital assigned to this account");
            setLoading(false);
        }
    }, [user]);

    const fetchHospital = async () => {
        if (!user?.hospitalId) {
            setError("No hospital ID found");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get(`https://mycarebridge.onrender.com/api/hospital/${user.hospitalId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (response.data && response.data.hospital) {
                // Ensure doctors array exists and is properly populated
                const hospitalData = response.data.hospital;
                if (!hospitalData.doctors) {
                    hospitalData.doctors = [];
                }
                setHospital(hospitalData);
            }
        } catch (err) {
            console.error("Error fetching hospital:", err);
            setError(err.response?.data?.message || "Failed to fetch hospital details");
        } finally {
            setLoading(false);
        }
    };

    const handleDoctorAdded = () => {
        // Refresh hospital data after adding a doctor
        fetchHospital();
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
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            </div>
        );
    }

    if (!hospital) {
        return (
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
                    No hospital data found
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
                    <h1 className="text-3xl font-bold mb-6 text-gray-800">{hospital.name}</h1>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-gray-700">Hospital Details</h2>
                            <div className="space-y-3">
                                <p><span className="font-medium">Address:</span> {hospital.address}</p>
                                <p><span className="font-medium">Phone:</span> {hospital.phone}</p>
                                <p><span className="font-medium">Email:</span> {hospital.email}</p>
                                <p><span className="font-medium">Services:</span> {hospital.service.join(", ")}</p>
                            </div>
                        </div>
                        
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-gray-700">Location</h2>
                            <div className="space-y-3">
                                <p><span className="font-medium">Coordinates:</span> {hospital.location.coordinates.join(", ")}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Doctors</h2>
                    <HospitalDoctors 
                        hospitalId={hospital._id} 
                        onDoctorAdded={handleDoctorAdded}
                    />
                </div>
            </div>
        </div>
    );
}
