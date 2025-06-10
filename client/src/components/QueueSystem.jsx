import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";

const QueueSystem = ({ doctorId, hospitalId, role }) => {
    const { socket } = useSocket();
    const { user } = useAuth();
    const [queueStatus, setQueueStatus] = useState([]);
    const [isQueueActive, setIsQueueActive] = useState(false);
    const [currentPosition, setCurrentPosition] = useState(null);
    const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);
    const [isInQueue, setIsInQueue] = useState(false);
    const [eventLog, setEventLog] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    // Add event to log
    const addToLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setEventLog(prev => [...prev.slice(-9), { message, type, timestamp }]); // Keep only last 10 entries
    };

    // Debug logging
    useEffect(() => {
        console.log('QueueSystem Props:', { doctorId, hospitalId, role });
        console.log('User:', user);
        addToLog(`QueueSystem initialized for ${role}`, 'info');
    }, [doctorId, hospitalId, role, user]);

    useEffect(() => {
        if (!socket) {
            addToLog('Socket not available', 'error');
            return;
        }

        // Socket connection status
        const handleConnect = () => {
            setIsConnected(true);
            addToLog('Connected to server', 'success');
            
            // Join doctor's room if doctor role
            if (role === 'doctor' && doctorId) {
                socket.emit('joinRoom', doctorId);
                addToLog(`Joined doctor room: ${doctorId}`, 'info');
            }
            
            // Get initial queue status
            if (doctorId && hospitalId) {
                socket.emit('getQueueStatus', { doctorId, hospitalId });
                addToLog('Requesting initial queue status', 'info');
            }
        };

        const handleDisconnect = () => {
            setIsConnected(false);
            addToLog('Disconnected from server', 'error');
        };

        // Socket event listeners
        const handleQueueUpdate = (data) => {
            console.log('Queue update received:', data);
            if (data.doctorId === doctorId && data.hospitalId === hospitalId) {
                setQueueStatus(data.queue || []);
                setIsQueueActive(data.isActive || false);
                addToLog(`Queue updated: ${data.queue?.length || 0} patients`, 'info');
            }
        };

        const handlePositionUpdate = (data) => {
            console.log('Position update received:', data);
            if (role === 'patient' && data.patientId === user._id) {
                setCurrentPosition(data.position);
                setEstimatedWaitTime(data.estimatedWaitTime);
                addToLog(`Position updated: ${data.position}`, 'info');
            }
        };

        const handlePatientCalled = (data) => {
            console.log('Patient called:', data);
            if (role === 'patient' && data.patientId === user._id) {
                toast.success('You are being called by the doctor!');
                setIsInQueue(false);
                addToLog('You have been called!', 'success');
            }
        };

        const handleQueueStatus = (data) => {
            console.log('Queue status received:', data);
            if (data.doctorId === doctorId && data.hospitalId === hospitalId) {
                setQueueStatus(data.queue || []);
                setIsQueueActive(data.isActive || false);
                addToLog(`Queue status: ${data.isActive ? 'Active' : 'Inactive'}`, 'info');
            }
        };

        const handleError = (error) => {
            console.error('Socket error:', error);
            addToLog(`Error: ${error}`, 'error');
            toast.error(error);
        };

        // Check if already connected
        if (socket.connected) {
            handleConnect();
        }

        // Add event listeners
        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);
        socket.on('queueUpdate', handleQueueUpdate);
        socket.on('positionUpdate', handlePositionUpdate);
        socket.on('patientCalled', handlePatientCalled);
        socket.on('queueStatus', handleQueueStatus);
        socket.on('error', handleError);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('queueUpdate', handleQueueUpdate);
            socket.off('positionUpdate', handlePositionUpdate);
            socket.off('patientCalled', handlePatientCalled);
            socket.off('queueStatus', handleQueueStatus);
            socket.off('error', handleError);
        };
    }, [socket, doctorId, hospitalId, user._id, role]);

    // Validation check
    if (!doctorId || !hospitalId) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold">Queue System Error</h3>
                <p className="text-red-700">Missing required parameters:</p>
                <ul className="list-disc list-inside text-red-700 mt-2">
                    {!doctorId && <li>Doctor ID is required</li>}
                    {!hospitalId && <li>Hospital ID is required</li>}
                </ul>
            </div>
        );
    }

    const handleJoinQueue = () => {
        if (!isConnected) {
            toast.error('Not connected to server');
            return;
        }
        
        socket.emit('joinQueue', {
            doctorId,
            hospitalId,
            patientId: user._id
        });
        setIsInQueue(true);
        addToLog('Joining queue...', 'info');
    };

    const handleLeaveQueue = () => {
        if (!isConnected) {
            toast.error('Not connected to server');
            return;
        }
        
        socket.emit('leaveQueue', {
            doctorId,
            hospitalId,
            patientId: user._id
        });
        setIsInQueue(false);
        setCurrentPosition(null);
        setEstimatedWaitTime(null);
        addToLog('Leaving queue...', 'info');
    };

    const handleCallNextPatient = () => {
        if (!isConnected) {
            toast.error('Not connected to server');
            return;
        }
        
        if (!queueStatus || queueStatus.length === 0) {
            toast.error('No patients in queue');
            return;
        }
        
        socket.emit('callNextPatient', { doctorId, hospitalId });
        addToLog('Calling next patient...', 'info');
    };

    const handleCompleteConsultation = (patientId) => {
        if (!isConnected) {
            toast.error('Not connected to server');
            return;
        }
        
        socket.emit('completeConsultation', {
            doctorId,
            hospitalId,
            patientId
        });
        addToLog(`Completing consultation for patient: ${patientId}`, 'success');
    };

    const toggleQueueStatus = () => {
        if (!isConnected) {
            toast.error('Not connected to server');
            return;
        }
        
        const newStatus = !isQueueActive;
        socket.emit('toggleQueueStatus', {
            doctorId,
            hospitalId,
            isActive: newStatus
        });
        addToLog(`${newStatus ? 'Starting' : 'Stopping'} queue...`, 'info');
    };

    return (
        <div className="space-y-6">
            {/* Connection Status */}
            <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm font-medium">
                            {isConnected ? 'Connected to server' : 'Disconnected'}
                        </span>
                    </div>
                    <div className="text-xs text-gray-500">
                        Role: {role} | Doctor: {doctorId?.slice(-8)} | Hospital: {hospitalId?.slice(-8)}
                    </div>
                </div>
            </div>

            {/* Queue Status Display */}
            <div className="bg-white rounded-lg border p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Queue Status</h2>
                    {(role === 'doctor' || role === 'staff') && (
                        <button
                            onClick={toggleQueueStatus}
                            disabled={!isConnected}
                            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                isQueueActive 
                                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                                    : 'bg-green-500 hover:bg-green-600 text-white'
                            } disabled:bg-gray-400 disabled:cursor-not-allowed`}
                        >
                            {isQueueActive ? 'Stop Queue' : 'Start Queue'}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="text-lg font-bold">
                            {isQueueActive ? (
                                <span className="text-green-600">Active</span>
                            ) : (
                                <span className="text-red-600">Inactive</span>
                            )}
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-600">Total Patients</p>
                        <p className="text-lg font-bold">{queueStatus?.length || 0}</p>
                    </div>
                    {role === 'patient' && currentPosition && (
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-blue-600">Your Position</p>
                            <p className="text-lg font-bold text-blue-800">{currentPosition}</p>
                        </div>
                    )}
                    {role === 'patient' && estimatedWaitTime && (
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                            <p className="text-sm text-blue-600">Estimated Wait</p>
                            <p className="text-lg font-bold text-blue-800">{estimatedWaitTime} min</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Actions</h3>
                <div className="flex flex-wrap gap-3">
                    {role === 'patient' && (
                        <>
                            {!isInQueue ? (
                                <button
                                    onClick={handleJoinQueue}
                                    disabled={!isQueueActive || !isConnected}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                                >
                                    Join Queue
                                </button>
                            ) : (
                                <button
                                    onClick={handleLeaveQueue}
                                    disabled={!isConnected}
                                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 transition-colors"
                                >
                                    Leave Queue
                                </button>
                            )}
                        </>
                    )}
                    {(role === 'doctor' || role === 'staff') && (
                        <button
                            onClick={handleCallNextPatient}
                            disabled={!isQueueActive || !queueStatus?.length || !isConnected}
                            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400 transition-colors"
                        >
                            Call Next Patient ({queueStatus?.length || 0} waiting)
                        </button>
                    )}
                    <button
                        onClick={() => socket?.emit('getQueueStatus', { doctorId, hospitalId })}
                        disabled={!isConnected}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                    >
                        Refresh Status
                    </button>
                </div>
            </div>

            {/* Queue List */}
            {queueStatus && queueStatus.length > 0 && (
                <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold mb-4">Current Queue ({queueStatus.length} patients)</h3>
                    <div className="space-y-3">
                        {queueStatus.map((patientId, index) => (
                            <div key={patientId || index} className="border p-4 rounded-lg flex justify-between items-center bg-gray-50">
                                <div>
                                    <p className="font-medium">Position {index + 1}</p>
                                    <p className="text-gray-600">Patient ID: {patientId}</p>
                                    <p className="text-xs text-gray-500">Est. wait: {(index) * 15} minutes</p>
                                </div>
                                {(role === 'doctor' || role === 'staff') && (
                                    <button
                                        onClick={() => handleCompleteConsultation(patientId)}
                                        disabled={!isConnected}
                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 transition-colors"
                                    >
                                        Complete
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Event Log */}
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Event Log</h3>
                <div className="h-48 overflow-y-auto bg-gray-50 rounded-lg p-4">
                    {eventLog.length === 0 ? (
                        <p className="text-gray-500 text-center">No events yet...</p>
                    ) : (
                        eventLog.map((log, index) => (
                            <div
                                key={index}
                                className={`mb-2 p-2 rounded text-sm ${
                                    log.type === 'error'
                                        ? 'bg-red-100 text-red-700'
                                        : log.type === 'success'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-blue-100 text-blue-700'
                                }`}
                            >
                                <span className="text-xs opacity-75">[{log.timestamp}]</span>
                                <span className="ml-2">{log.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default QueueSystem;