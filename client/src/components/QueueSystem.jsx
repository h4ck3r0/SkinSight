import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const QueueSystem = ({ doctorId, hospitalId, role }) => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [queueStatus, setQueueStatus] = useState(null);
    const [isQueueActive, setIsQueueActive] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(null);
    const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
    const [isInQueue, setIsInQueue] = useState(false);

    useEffect(() => {
        if (!socket || !doctorId || !hospitalId) return;

        // Socket event listeners
        socket.on('queueUpdate', (data) => {
            if (data.doctorId === doctorId && data.hospitalId === hospitalId) {
                setQueueStatus(data.queue);
                setIsQueueActive(data.isActive);
            }
        });

        socket.on('positionUpdate', (data) => {
            if (data.patientId === user._id) {
                setCurrentPosition(data.position);
                setEstimatedWaitTime(data.estimatedWaitTime);
            }
        });

        socket.on('patientCalled', (data) => {
            if (data.patientId === user._id) {
                toast.success('You are being called by the doctor!');
                setIsInQueue(false);
            }
        });

        socket.on('queueStatus', (data) => {
            if (data.doctorId === doctorId && data.hospitalId === hospitalId) {
                setQueueStatus(data.queue);
                setIsQueueActive(data.isActive);
            }
        });

        // Initial queue status check
        socket.emit('getQueueStatus', { doctorId, hospitalId });

        return () => {
            socket.off('queueUpdate');
            socket.off('positionUpdate');
            socket.off('patientCalled');
            socket.off('queueStatus');
        };
    }, [socket, doctorId, hospitalId, user._id]);

    const handleJoinQueue = () => {
        if (!socket || !doctorId || !hospitalId) return;
        
        socket.emit('joinQueue', {
            doctorId,
            hospitalId,
            patientId: user._id
        });
        setIsInQueue(true);
        toast.success('Joined the queue successfully!');
    };

    const handleLeaveQueue = () => {
        if (!socket || !doctorId || !hospitalId) return;
        
        socket.emit('leaveQueue', {
            doctorId,
            hospitalId,
            patientId: user._id
        });
        setIsInQueue(false);
        setCurrentPosition(null);
        setEstimatedWaitTime(null);
        toast.success('Left the queue successfully!');
    };

    const handleCallNextPatient = () => {
        if (!socket || !doctorId || !hospitalId) return;
        
        socket.emit('callNextPatient', { doctorId, hospitalId });
    };

    const handleCompleteConsultation = (patientId) => {
        if (!socket || !doctorId || !hospitalId) return;
        
        socket.emit('completeConsultation', {
            doctorId,
            hospitalId,
            patientId
        });
    };

    const toggleQueueStatus = () => {
        if (!socket || !doctorId || !hospitalId) return;
        
        socket.emit('toggleQueueStatus', {
            doctorId,
            hospitalId,
            isActive: !isQueueActive
        });
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Queue Management</h2>
                {(role === 'doctor' || role === 'staff') && (
                    <button
                        onClick={toggleQueueStatus}
                        className={`px-4 py-2 rounded ${
                            isQueueActive 
                                ? 'bg-red-500 hover:bg-red-600' 
                                : 'bg-green-500 hover:bg-green-600'
                        } text-white`}
                    >
                        {isQueueActive ? 'Stop Queue' : 'Start Queue'}
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {/* Queue Status */}
                <div className="bg-gray-50 p-4 rounded">
                    <h3 className="font-semibold mb-2">Queue Status</h3>
                    <p>Total Patients: {queueStatus?.length || 0}</p>
                    <p>Status: {isQueueActive ? 'Active' : 'Inactive'}</p>
                    {currentPosition && (
                        <>
                            <p>Your Position: {currentPosition}</p>
                            <p>Estimated Wait Time: {estimatedWaitTime} minutes</p>
                        </>
                    )}
                </div>

                {/* Patient Actions */}
                {role === 'patient' && (
                    <div className="space-y-2">
                        {!isInQueue ? (
                            <button
                                onClick={handleJoinQueue}
                                disabled={!isQueueActive}
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
                            >
                                Join Queue
                            </button>
                        ) : (
                            <button
                                onClick={handleLeaveQueue}
                                className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                            >
                                Leave Queue
                            </button>
                        )}
                    </div>
                )}

                {/* Doctor/Staff Actions */}
                {(role === 'doctor' || role === 'staff') && (
                    <div className="space-y-2">
                        <button
                            onClick={handleCallNextPatient}
                            disabled={!isQueueActive || !queueStatus?.length}
                            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:bg-gray-400"
                        >
                            Call Next Patient
                        </button>
                    </div>
                )}

                {/* Queue List */}
                {queueStatus && queueStatus.length > 0 && (
                    <div className="mt-4">
                        <h3 className="font-semibold mb-2">Current Queue</h3>
                        <div className="space-y-2">
                            {queueStatus.map((patient, index) => (
                                <div key={patient._id} className="border p-3 rounded flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">Position {index + 1}</p>
                                        <p>Patient: {patient.firstName}</p>
                                    </div>
                                    {(role === 'doctor' || role === 'staff') && (
                                        <button
                                            onClick={() => handleCompleteConsultation(patient._id)}
                                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                        >
                                            Complete
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QueueSystem; 