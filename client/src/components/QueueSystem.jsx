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
    const [eventLog, setEventLog] = useState([]);
    const [isConnected, setIsConnected] = useState(false);

    // Add event to log
    const addToLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setEventLog(prev => [...prev, { message, type, timestamp }]);
    };

    useEffect(() => {
        if (!socket) return;

        // Socket connection status
        socket.on('connect', () => {
            setIsConnected(true);
            addToLog('Connected to server', 'success');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            addToLog('Disconnected from server', 'error');
        });

        // Socket event listeners
        socket.on('queueUpdate', (data) => {
            if (data.doctorId === doctorId && data.hospitalId === hospitalId) {
                setQueueStatus(data.queue);
                setIsQueueActive(data.isActive);
                addToLog(`Queue updated: ${data.queue?.length || 0} patients in queue`, 'info');
            }
        });

        socket.on('positionUpdate', (data) => {
            if (data.patientId === user._id) {
                setCurrentPosition(data.position);
                setEstimatedWaitTime(data.estimatedWaitTime);
                addToLog(`Position updated: ${data.position}`, 'info');
            }
        });

        socket.on('patientCalled', (data) => {
            if (data.patientId === user._id) {
                toast.success('You are being called by the doctor!');
                setIsInQueue(false);
                addToLog('You have been called!', 'success');
            }
        });

        socket.on('queueStatus', (data) => {
            if (data.doctorId === doctorId && data.hospitalId === hospitalId) {
                setQueueStatus(data.queue);
                setIsQueueActive(data.isActive);
                addToLog(`Queue status: ${data.isActive ? 'Active' : 'Inactive'}`, 'info');
            }
        });

        socket.on('error', (error) => {
            addToLog(`Error: ${error}`, 'error');
            toast.error(error);
        });

        // Initial queue status check
        if (doctorId && hospitalId) {
            socket.emit('getQueueStatus', { doctorId, hospitalId });
        }

        return () => {
            socket.off('connect');
            socket.off('disconnect');
            socket.off('queueUpdate');
            socket.off('positionUpdate');
            socket.off('patientCalled');
            socket.off('queueStatus');
            socket.off('error');
        };
    }, [socket, doctorId, hospitalId, user._id]);

    const handleJoinQueue = () => {
        if (!isConnected) {
            toast.error('Not connected to server');
            return;
        }
        
        if (!doctorId || !hospitalId) {
            toast.error('Missing doctor or hospital ID');
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
        
        if (!doctorId || !hospitalId) {
            toast.error('Missing doctor or hospital ID');
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
        
        if (!doctorId || !hospitalId) {
            toast.error('Missing doctor or hospital ID');
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
        
        if (!doctorId || !hospitalId) {
            toast.error('Missing doctor or hospital ID');
            return;
        }
        
        socket.emit('completeConsultation', {
            doctorId,
            hospitalId,
            patientId
        });
        addToLog('Consultation completed', 'success');
    };

    const toggleQueueStatus = () => {
        if (!isConnected) {
            toast.error('Not connected to server');
            return;
        }
        
        if (!doctorId || !hospitalId) {
            toast.error('Missing doctor or hospital ID');
            return;
        }
        
        socket.emit('toggleQueueStatus', {
            doctorId,
            hospitalId,
            isActive: !isQueueActive
        });
        addToLog(`Toggling queue status...`, 'info');
    };

    return (
        <div className="space-y-6">
            {/* Connection Status */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium">
                        {isConnected ? 'Connected to server' : 'Disconnected'}
                    </span>
                </div>
            </div>

            {/* Queue Status Display */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Queue Management</h2>
                    {(role === 'doctor' || role === 'staff') && (
                        <button
                            onClick={toggleQueueStatus}
                            disabled={!isConnected}
                            className={`px-4 py-2 rounded ${
                                isQueueActive 
                                    ? 'bg-red-500 hover:bg-red-600' 
                                    : 'bg-green-500 hover:bg-green-600'
                            } text-white transition-colors disabled:bg-gray-400`}
                        >
                            {isQueueActive ? 'Stop Queue' : 'Start Queue'}
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Status</p>
                        <p className="text-lg font-medium">
                            {isQueueActive ? (
                                <span className="text-green-600">Active</span>
                            ) : (
                                <span className="text-red-600">Inactive</span>
                            )}
                        </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Total Patients</p>
                        <p className="text-lg font-medium">{queueStatus?.length || 0}</p>
                    </div>
                    {currentPosition && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Your Position</p>
                            <p className="text-lg font-medium">{currentPosition}</p>
                        </div>
                    )}
                    {estimatedWaitTime && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-600">Estimated Wait</p>
                            <p className="text-lg font-medium">{estimatedWaitTime} minutes</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow p-6">
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
                            Call Next Patient
                        </button>
                    )}
                </div>
            </div>

            {/* Queue List */}
            {queueStatus && queueStatus.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Current Queue</h3>
                    <div className="space-y-3">
                        {queueStatus.map((patient, index) => (
                            <div key={patient._id} className="border p-4 rounded-lg flex justify-between items-center bg-gray-50">
                                <div>
                                    <p className="font-medium">Position {index + 1}</p>
                                    <p className="text-gray-600">Patient: {patient.firstName}</p>
                                </div>
                                {(role === 'doctor' || role === 'staff') && (
                                    <button
                                        onClick={() => handleCompleteConsultation(patient._id)}
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
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Event Log</h3>
                <div className="h-48 overflow-y-auto bg-gray-50 rounded-lg p-4">
                    {eventLog.map((log, index) => (
                        <div
                            key={index}
                            className={`mb-2 p-2 rounded ${
                                log.type === 'error'
                                    ? 'bg-red-100 text-red-700'
                                    : log.type === 'success'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700'
                            }`}
                        >
                            <span className="text-xs text-gray-500">{log.timestamp}</span>
                            <p className="text-sm">{log.message}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QueueSystem; 