import { useEffect, useState } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import axios from "axios";

export default function PatientDashBroad() {
    const { location, error: locationError } = useGeolocation();
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (location?.lat && location?.lng) {
            GetnearByHospital();
        }
    }, [location]);

    async function GetnearByHospital() {
        if (!location?.lat || !location?.lng) {
            setError("Location not available");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`https://mycarebridge.onrender.com/api/hospital/getnearBy/${location.lat}/${location.lng}`);
            setHospitals(response.data.hospitals || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch nearby hospitals");
            console.error("Error fetching hospitals:", err);
        } finally {
            setLoading(false);
        }
    }

    if (locationError) {
        return (
            <div className="bg-amber-700 text-white h-screen flex flex-col justify-center items-center">
                <h1 className="text-3xl font-bold mb-10 text-blue-300">Patient Dashboard</h1>
                <div className="text-red-500">
                    Error: {locationError}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-amber-700 text-white h-screen flex flex-col justify-center items-center">
            <h1 className="text-3xl font-bold mb-10 text-blue-300">Patient Dashboard</h1>

            <div className="w-full max-w-4xl p-4">
                <h2 className="text-2xl mb-4">Nearby Hospitals</h2>
                
                {loading && <div>Loading hospitals...</div>}
                
                {error && (
                    <div className="text-red-500 mb-4">
                        {error}
                    </div>
                )}

                {!loading && !error && hospitals.length === 0 && (
                    <div>No hospitals found nearby</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hospitals.map((hospital) => (
                        <div key={hospital._id} className="bg-white text-gray-800 p-4 rounded-lg shadow">
                            <h3 className="text-xl font-bold">{hospital.name}</h3>
                            <p>{hospital.address}</p>
                            <p>Phone: {hospital.phone}</p>
                            <p>Services: {hospital.service.join(", ")}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
