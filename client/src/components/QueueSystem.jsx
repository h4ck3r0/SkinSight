import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";
import useSocket from "../hooks/useSocket";

const QueueSystem = ({ selectedDoctor, selectedHospital }) => {
    const [queueStatus, setQueueStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const socket = useSocket();

    useEffect(() => {
        if (socket && selectedDoctor && selectedHospital) {
            // Join queue room
            socket.emit('joinQueue', {
                doctorId: selectedDoctor._id,
                hospitalId: selectedHospital._id
            });

            // Listen for queue updates
            socket.on('queueUpdate', (data) => {
                console.log('Queue update received:', data);
                setQueueStatus(data);
            });

            // Listen for position updates
            socket.on('positionUpdate', (data) => {
                console.log('Position update received:', data);
                setQueueStatus(prev => ({
                    ...prev,
                    position: data.position
                }));
            });

            return () => {
                socket.off('queueUpdate');
                socket.off('positionUpdate');
            };
        }
    }, [socket, selectedDoctor, selectedHospital]);

    const fetchQueueStatus = async () => {
        if (!selectedDoctor || !selectedHospital) {
            setError("Please select both a doctor and hospital");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/queue/status`, {
                params: {
                    doctorId: selectedDoctor._id,
                    hospitalId: selectedHospital._id
                },
                withCredentials: true
            });
            console.log("Queue status response:", response.data);
            setQueueStatus(response.data.data);
        } catch (err) {
            console.error("Error fetching queue status:", err);
            setError(err.response?.data?.message || "Failed to get queue status");
        } finally {
            setLoading(false);
        }
    };

    const joinQueue = async () => {
        if (!selectedDoctor || !selectedHospital) {
            setError("Please select both a doctor and hospital");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/queue/join`,
                {
                    doctorId: selectedDoctor._id,
                    hospitalId: selectedHospital._id
                },
                { withCredentials: true }
            );
            console.log("Join queue response:", response.data);
            setQueueStatus(response.data.data);
        } catch (err) {
            console.error("Error joining queue:", err);
            setError(err.response?.data?.message || "Failed to join queue");
        } finally {
            setLoading(false);
        }
    };

    const leaveQueue = async () => {
        if (!queueStatus) return;

        setLoading(true);
        setError(null);
        try {
            const response = await axios.post(
                `${import.meta.env.VITE_SERVER_URL}/api/queue/leave`,
                {
                    queueId: queueStatus._id
                },
                { withCredentials: true }
            );
            console.log("Leave queue response:", response.data);
            setQueueStatus(null);
        } catch (err) {
            console.error("Error leaving queue:", err);
            setError(err.response?.data?.message || "Failed to leave queue");
        } finally {
            setLoading(false);
        }
    };

    if (!selectedDoctor || !selectedHospital) {
        return (
            <div className="text-center p-4">
                <p className="text-gray-600">Please select a doctor and hospital first</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Queue Status</h2>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading...</p>
                </div>
            ) : queueStatus ? (
                <div>
                    <div className="mb-4">
                        <p className="text-lg">
                            Your position in queue: <span className="font-semibold">{queueStatus.position}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                            Estimated wait time: {queueStatus.estimatedWaitTime} minutes
                        </p>
                    </div>
                    <button
                        onClick={leaveQueue}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                    >
                        Leave Queue
                    </button>
                </div>
            ) : (
                <div>
                    <p className="text-gray-600 mb-4">
                        You are not currently in the queue. Join to get in line.
                    </p>
                    <button
                        onClick={joinQueue}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    >
                        Join Queue
                    </button>
                </div>
            )}
        </div>
    );
};

export default QueueSystem; 