import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import useSocket from "../hooks/useSocket";

const socket = io("https://mycarebridge.onrender.com");

export default function QueueSystem({ doctorId, hospitalId, userRole }) {
    const [queue, setQueue] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPatient, setCurrentPatient] = useState(null);
    const [queueStatus, setQueueStatus] = useState(null);
    const socket = useSocket();

    useEffect(() => {
        const fetchQueueStatus = async () => {
            if (!doctorId || !hospitalId) return;

            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(`${API_URL}/api/queue/status`, {
                    params: {
                        doctorId: doctorId,
                        hospitalId: hospitalId
                    }
                });
                setQueueStatus(response.data.data);
            } catch (err) {
                console.error("Error fetching queue status:", err);
                setError(err.response?.data?.message || "Error fetching queue status");
            } finally {
                setLoading(false);
            }
        };

        fetchQueueStatus();

        // Join queue room
        if (socket && doctorId && hospitalId) {
            socket.emit('joinQueue', {
                doctorId: doctorId,
                hospitalId: hospitalId
            });
        }

        // Listen for queue updates
        if (socket) {
            socket.on('queueUpdate', (data) => {
                setQueueStatus(data.queue);
            });
        }

        return () => {
            if (socket) {
                socket.off('queueUpdate');
                if (doctorId && hospitalId) {
                    socket.emit('leaveQueue', {
                        doctorId: doctorId,
                        hospitalId: hospitalId
                    });
                }
            }
        };
    }, [doctorId, hospitalId, socket]);

    const startQueue = async () => {
        try {
            const response = await axios.post(
                "https://mycarebridge.onrender.com/api/queue/start",
                { doctorId, hospitalId },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setQueue(response.data.queue);
        } catch (err) {
            console.error("Error starting queue:", err);
            setError(err.response?.data?.message || "Error starting queue");
        }
    };

    const joinQueue = async () => {
        try {
            const response = await axios.post(
                "https://mycarebridge.onrender.com/api/queue/join",
                { doctorId, hospitalId, patientId: localStorage.getItem('userId') },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setQueue(response.data.queue);
        } catch (err) {
            console.error("Error joining queue:", err);
            setError(err.response?.data?.message || "Error joining queue");
        }
    };

    const getNextPatient = async () => {
        try {
            const response = await axios.post(
                "https://mycarebridge.onrender.com/api/queue/next",
                { doctorId, hospitalId },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setQueue(response.data.queue);
            setCurrentPatient(response.data.patient);
        } catch (err) {
            console.error("Error getting next patient:", err);
            setError(err.response?.data?.message || "Error getting next patient");
        }
    };

    const completeConsultation = async () => {
        try {
            const response = await axios.post(
                "https://mycarebridge.onrender.com/api/queue/complete",
                { doctorId, hospitalId, patientId: currentPatient.patient },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setQueue(response.data.queue);
            setCurrentPatient(null);
        } catch (err) {
            console.error("Error completing consultation:", err);
            setError(err.response?.data?.message || "Error completing consultation");
        }
    };

    const endQueue = async () => {
        try {
            const response = await axios.post(
                "https://mycarebridge.onrender.com/api/queue/end",
                { doctorId, hospitalId },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setQueue(response.data.queue);
        } catch (err) {
            console.error("Error ending queue:", err);
            setError(err.response?.data?.message || "Error ending queue");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                {error}
            </div>
        );
    }

    return (
        <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Queue System</h2>
                {queue ? (
                    <p className="text-sm text-gray-500">
                        Current Queue Number: {queue.currentNumber}
                    </p>
                ) : (
                    <p className="text-sm text-gray-500">No active queue</p>
                )}
            </div>

            {/* Doctor/Staff Controls */}
            {userRole === "doctor" && (
                <div className="space-y-4">
                    {!queue ? (
                        <button
                            onClick={startQueue}
                            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Start Queue
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={getNextPatient}
                                disabled={currentPatient}
                                className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                            >
                                Get Next Patient
                            </button>
                            {currentPatient && (
                                <button
                                    onClick={completeConsultation}
                                    className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                                >
                                    Complete Consultation
                                </button>
                            )}
                            <button
                                onClick={endQueue}
                                className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                End Queue
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Patient Controls */}
            {userRole === "patient" && queue && (
                <div className="space-y-4">
                    <button
                        onClick={joinQueue}
                        className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        Join Queue
                    </button>
                </div>
            )}

            {/* Queue Status */}
            {queue && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Queue Status</h3>
                    <div className="space-y-2">
                        {queue.patients.map((patient) => (
                            <div
                                key={patient._id}
                                className={`p-3 rounded ${
                                    patient.status === "in_consultation"
                                        ? "bg-yellow-100"
                                        : patient.status === "completed"
                                        ? "bg-green-100"
                                        : "bg-gray-100"
                                }`}
                            >
                                <p className="text-sm font-medium">
                                    Queue #{patient.queueNumber} - {patient.patient.firstName} {patient.patient.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Status: {patient.status.replace("_", " ")}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
} 