import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import HospitalDoctors from "./HospitalDoctors";

export default function HospitalDashBoard() {
    const [name, Setname] = useState("");
    const [phone, SetPhone] = useState("");
    const [address, SetAddress] = useState("");
    const [location, Setlocation] = useState("");
    const [email, Setemail] = useState("");
    const [service, Setservice] = useState("");
    const [hospital, Sethospital] = useState([]);
    const [err, Seterr] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const { token, user } = useAuth();

    useEffect(() => {
        if (user?.hospitalId) {
            localStorage.setItem('hospitalId', user.hospitalId);
            hospitaldetails();
        } else if (user?.role === 'staff') {
            createInitialHospital();
        }
    }, [user, token]);

    async function createInitialHospital() {
        try {
            const locationData = {
                type: "Point",
                coordinates: [0, 0]
            };

            const response = await axios.post(
                "https://mycarebridge.onrender.com/api/hospital/addhospital",
                {
                    name: `${user.firstName}'s Hospital`,
                    phone: "Not set",
                    address: "Not set",
                    location: locationData,
                    email: user.email,
                    service: ["General Medicine"]
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.hospital) {
                Sethospital([response.data.hospital]);
                localStorage.setItem('hospitalId', response.data.hospital._id);
                try {
                    await axios.patch('/auth/updateMe', 
                        { hospitalId: response.data.hospital._id },
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                } catch (updateErr) {
                    console.error("Failed to update user's hospitalId:", updateErr);
                }
            }
        } catch (err) {
            console.error("Create initial hospital error:", err);
            if (err.response?.status === 400) {
                Seterr(err.response.data.message || "Failed to create hospital profile. Please try again.");
            } else {
                Seterr("Failed to create hospital profile. Please try again later.");
            }
        }
    }

    async function hospitaldetails() {
        try {
            const hospitalId = user.hospitalId;
            const response = await axios.get(`https://mycarebridge.onrender.com/api/hospital/${hospitalId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const hospitalData = response.data.hospital;
            Sethospital([hospitalData]);
            // Pre-fill form data
            Setname(hospitalData.name);
            SetPhone(hospitalData.phone);
            SetAddress(hospitalData.address);
            Setlocation(JSON.stringify({ lat: hospitalData.location.coordinates[1], lng: hospitalData.location.coordinates[0] }));
            Setemail(hospitalData.email);
            Setservice(Array.isArray(hospitalData.service) ? hospitalData.service.join(", ") : "");
        } catch (err) {
            console.error("Hospital details error:", err);
            Seterr(err.response?.data?.message || "Failed to fetch hospital details");
        }
    }

    async function updateHospital() {
        try {
            // Validate required fields
            if (!name || !phone || !address || !email) {
                Seterr("Please fill in all required fields");
                return;
            }

            // Validate location format
            let locationData;
            try {
                const parsedLocation = JSON.parse(location);
                if (!parsedLocation.lat || !parsedLocation.lng) {
                    throw new Error("Location must include lat and lng");
                }
                locationData = {
                    type: "Point",
                    coordinates: [parsedLocation.lng, parsedLocation.lat]
                };
            } catch (e) {
                Seterr("Location must be in valid JSON format with lat and lng. Example: {\"lat\": 12.9716, \"lng\": 77.5946}");
                return;
            }

            // Prepare services array
            const servicesArray = service ? service.split(',').map(s => s.trim()).filter(s => s) : [];

            const response = await axios.patch(
                `https://mycarebridge.onrender.com/api/hospital/${user.hospitalId}`,
                {
                    name,
                    phone,
                    address,
                    location: locationData,
                    email,
                    service: servicesArray
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.hospital) {
                Sethospital([response.data.hospital]);
                setIsEditing(false);
            }
        } catch (err) {
            console.error("Update hospital error:", err);
            Seterr(err.response?.data?.message || "Failed to update hospital profile");
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">Hospital Dashboard</h1>

                {/* Hospital Details and Edit Form */}
                {hospital.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold">Hospital Details</h2>
                            <button 
                                onClick={() => setIsEditing(!isEditing)}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                            </button>
                        </div>

                        {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                    className="border p-2 rounded"
                                    placeholder="Hospital Name" 
                                    value={name}
                                    onChange={(e) => Setname(e.target.value)}
                                />
                                <input 
                                    className="border p-2 rounded"
                                    placeholder="Phone" 
                                    value={phone}
                                    onChange={(e) => SetPhone(e.target.value)}
                                />
                                <input 
                                    className="border p-2 rounded"
                                    placeholder="Address" 
                                    value={address}
                                    onChange={(e) => SetAddress(e.target.value)}
                                />
                                <input 
                                    className="border p-2 rounded"
                                    placeholder='Location ({"lat": 12.9716, "lng": 77.5946})' 
                                    value={location}
                                    onChange={(e) => Setlocation(e.target.value)}
                                />
                                <input 
                                    className="border p-2 rounded"
                                    placeholder="Email" 
                                    value={email}
                                    onChange={(e) => Setemail(e.target.value)}
                                />
                                <input 
                                    className="border p-2 rounded"
                                    placeholder="Services (comma-separated)" 
                                    value={service}
                                    onChange={(e) => Setservice(e.target.value)}
                                />
                                <div className="col-span-2">
                                    <button 
                                        onClick={updateHospital}
                                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="font-semibold">Name:</p>
                                    <p>{hospital[0].name}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Phone:</p>
                                    <p>{hospital[0].phone}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Address:</p>
                                    <p>{hospital[0].address}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Email:</p>
                                    <p>{hospital[0].email}</p>
                                </div>
                                <div>
                                    <p className="font-semibold">Services:</p>
                                    <p>{Array.isArray(hospital[0].service) ? hospital[0].service.join(", ") : hospital[0].service}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Hospital Doctors Management */}
                {hospital.length > 0 && (
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <HospitalDoctors />
                    </div>
                )}

                {err && (
                    <div className="text-red-500 mt-4 p-4 bg-red-50 rounded">
                        {err}
                    </div>
                )}
            </div>
        </div>
    );
}
