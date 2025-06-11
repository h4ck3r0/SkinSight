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
    
    // New state for online consultation
    const [isInConsultation, setIsInConsultation] = useState(false);
    const [isOnlineMode, setIsOnlineMode] = useState(false);
    const [currentPatient, setCurrentPatient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isVideoCallActive, setIsVideoCallActive] = useState(false);
    const [showChat, setShowChat] = useState(false);

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
            
            // Join user's room (both doctor and patient join with their user ID)
            if (user._id) {
                socket.emit('joinRoom', user._id);
                addToLog(`Joined user room: ${user._id}`, 'info');
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
            console.log('Current role:', role);
            console.log('Current user ID:', user._id);
            console.log('Data patient ID:', data.patientId);
            
            if (role === 'patient' && data.patientId === user._id) {
                toast.success('You are being called by the doctor!');
                setIsInQueue(false);
                setIsInConsultation(true);
                addToLog('You have been called!', 'success');
            }
            if (role === 'doctor' && data.patientId) {
                console.log('Setting current patient for doctor:', data.patientId);
                setCurrentPatient(data.patientId);
                setIsInConsultation(true);
                addToLog(`Patient ${data.patientId} called for consultation`, 'success');
            }
        };

        const handleConsultationComplete = (data) => {
            console.log('Consultation complete:', data);
            if (role === 'patient' && data.patientId === user._id) {
                setIsInConsultation(false);
                setIsOnlineMode(false);
                setShowChat(false);
                setIsVideoCallActive(false);
                setMessages([]);
                toast.success('Consultation completed!');
                addToLog('Consultation completed', 'success');
            }
            if (role === 'doctor' && data.patientId === currentPatient) {
                setIsInConsultation(false);
                setCurrentPatient(null);
                setIsOnlineMode(false);
                setShowChat(false);
                setIsVideoCallActive(false);
                setMessages([]);
                addToLog('Consultation completed', 'success');
            }
        };

        const handleOnlineModeToggle = (data) => {
            console.log('Online mode toggle:', {
                role,
                user_id: user._id,
                currentPatient,
                patientId: data.patientId,
                newOnlineMode: data.isOnline
            });
            
            if (role === 'patient' && data.patientId === user._id) {
                console.log('Patient handling online mode toggle');
                setIsOnlineMode(data.isOnline);
                if (data.isOnline) {
                    setShowChat(true);
                    toast.success('Online consultation mode activated!');
                    addToLog('Online consultation mode activated', 'success');
                } else {
                    setShowChat(false);
                    setIsVideoCallActive(false);
                    addToLog('Online consultation mode deactivated', 'info');
                }
            }
            if (role === 'doctor' && data.patientId === currentPatient) {
                console.log('Doctor handling online mode toggle');
                setIsOnlineMode(data.isOnline);
                if (data.isOnline) {
                    setShowChat(true);
                    addToLog('Patient activated online mode', 'success');
                } else {
                    setShowChat(false);
                    setIsVideoCallActive(false);
                    addToLog('Patient deactivated online mode', 'info');
                }
            }
            
            // Additional check for doctor - if no currentPatient is set, still handle the event
            if (role === 'doctor' && !currentPatient && data.patientId) {
                console.log('Doctor handling online mode toggle (no currentPatient set)');
                setCurrentPatient(data.patientId);
                setIsOnlineMode(data.isOnline);
                if (data.isOnline) {
                    setShowChat(true);
                    addToLog('Patient activated online mode', 'success');
                } else {
                    setShowChat(false);
                    setIsVideoCallActive(false);
                    addToLog('Patient deactivated online mode', 'info');
                }
            }
        };

        const handleNewMessage = (data) => {
            console.log('New message received:', data);
            setMessages(prev => [...prev, {
                id: Date.now(),
                sender: data.sender,
                message: data.message,
                timestamp: new Date().toLocaleTimeString()
            }]);
        };

        const handleVideoCallRequest = (data) => {
            console.log('Video call request:', data);
            if (role === 'patient' && data.patientId === user._id) {
                toast.success('Doctor is requesting a video call!');
                addToLog('Video call request received', 'success');
            }
            if (role === 'doctor' && data.patientId === currentPatient) {
                addToLog('Video call request sent', 'success');
            }
        };

        const handleVideoCallResponse = (data) => {
            console.log('Video call response:', data);
            if (data.accepted) {
                setIsVideoCallActive(true);
                toast.success('Video call started!');
                addToLog('Video call started', 'success');
            } else {
                toast.error('Video call declined');
                addToLog('Video call declined', 'error');
            }
        };

        const handleVideoCallEnded = (data) => {
            console.log('Video call ended:', data);
            setIsVideoCallActive(false);
            toast.info('Video call ended');
            addToLog('Video call ended', 'info');
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
        socket.on('consultationComplete', handleConsultationComplete);
        socket.on('onlineModeToggle', handleOnlineModeToggle);
        socket.on('newMessage', handleNewMessage);
        socket.on('videoCallRequest', handleVideoCallRequest);
        socket.on('videoCallResponse', handleVideoCallResponse);
        socket.on('videoCallEnded', handleVideoCallEnded);
        socket.on('error', handleError);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('queueUpdate', handleQueueUpdate);
            socket.off('positionUpdate', handlePositionUpdate);
            socket.off('patientCalled', handlePatientCalled);
            socket.off('queueStatus', handleQueueStatus);
            socket.off('consultationComplete', handleConsultationComplete);
            socket.off('onlineModeToggle', handleOnlineModeToggle);
            socket.off('newMessage', handleNewMessage);
            socket.off('videoCallRequest', handleVideoCallRequest);
            socket.off('videoCallResponse', handleVideoCallResponse);
            socket.off('videoCallEnded', handleVideoCallEnded);
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

    // Online consultation functions
    const handleToggleOnlineMode = () => {
        if (!isConnected) {
            toast.error('Not connected to server');
            return;
        }
        
        const newOnlineMode = !isOnlineMode;
        const patientId = role === 'patient' ? user._id : currentPatient;
        
        console.log('Toggling online mode:', {
            role,
            user_id: user._id,
            currentPatient,
            patientId,
            newOnlineMode
        });
        
        if (role === 'doctor' && !currentPatient) {
            toast.error('No patient in consultation');
            return;
        }
        
        socket.emit('toggleOnlineMode', {
            doctorId,
            hospitalId,
            patientId,
            isOnline: newOnlineMode
        });
        setIsOnlineMode(newOnlineMode);
        addToLog(`${newOnlineMode ? 'Activating' : 'Deactivating'} online mode`, 'info');
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !isConnected) return;
        
        const messageData = {
            doctorId,
            hospitalId,
            sender: role === 'patient' ? user._id : currentPatient,
            receiver: role === 'patient' ? doctorId : user._id,
            message: newMessage.trim()
        };
        
        socket.emit('sendMessage', messageData);
        setNewMessage('');
        addToLog('Message sent', 'info');
    };

    const handleRequestVideoCall = () => {
        if (!isConnected) {
            toast.error('Not connected to server');
            return;
        }
        
        socket.emit('requestVideoCall', {
            doctorId,
            hospitalId,
            patientId: role === 'patient' ? user._id : currentPatient
        });
        addToLog('Video call request sent', 'info');
    };

    const handleAcceptVideoCall = () => {
        if (!isConnected) {
            toast.error('Not connected to server');
            return;
        }
        
        socket.emit('videoCallResponse', {
            doctorId,
            hospitalId,
            patientId: user._id,
            accepted: true
        });
        addToLog('Video call accepted', 'success');
    };

    const handleDeclineVideoCall = () => {
        if (!isConnected) {
            toast.error('Not connected to server');
            return;
        }
        
        socket.emit('videoCallResponse', {
            doctorId,
            hospitalId,
            patientId: user._id,
            accepted: false
        });
        addToLog('Video call declined', 'info');
    };

    const handleEndVideoCall = () => {
        if (!isConnected) {
            toast.error('Not connected to server');
            return;
        }
        
        socket.emit('endVideoCall', {
            doctorId,
            hospitalId,
            patientId: role === 'patient' ? user._id : currentPatient
        });
        setIsVideoCallActive(false);
        addToLog('Video call ended', 'info');
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

            {/* Consultation Status */}
            {isInConsultation && (
                <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold mb-4">Consultation Status</h3>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-medium text-green-700">In Consultation</span>
                        </div>
                        <div className="flex gap-2">
                            {(role === 'patient' || role === 'doctor') && (
                                <button
                                    onClick={handleToggleOnlineMode}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        isOnlineMode 
                                            ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                                    }`}
                                >
                                    {isOnlineMode ? 'Online Mode: ON' : 'Online Mode: OFF'}
                                </button>
                            )}
                            {(role === 'doctor' || role === 'staff') && (
                                <button
                                    onClick={() => handleCompleteConsultation(currentPatient)}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    Complete Consultation
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {role === 'doctor' && currentPatient && (
                        <p className="text-gray-600">Consulting with Patient: {currentPatient}</p>
                    )}
                </div>
            )}

            {/* Online Consultation Features */}
            {isInConsultation && (isOnlineMode || role === 'doctor') && (
                <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold mb-4">Online Consultation</h3>
                    
                    {/* Video Call Interface */}
                    {isVideoCallActive && (
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                            <h4 className="font-medium mb-3">Video Call</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                                    <div className="text-white text-center">
                                        <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <p className="text-sm">You</p>
                                    </div>
                                </div>
                                <div className="bg-black rounded-lg aspect-video flex items-center justify-center">
                                    <div className="text-white text-center">
                                        <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <p className="text-sm">{role === 'patient' ? 'Doctor' : 'Patient'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-center mt-4">
                                <button
                                    onClick={handleEndVideoCall}
                                    className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    End Call
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Video Call Controls */}
                    <div className="mb-6">
                        <h4 className="font-medium mb-3">Video Call</h4>
                        <div className="flex gap-3">
                            {!isVideoCallActive ? (
                                <>
                                    <button
                                        onClick={handleRequestVideoCall}
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                                    >
                                        {role === 'doctor' ? 'Start Video Call' : 'Request Video Call'}
                                    </button>
                                    {role === 'patient' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleAcceptVideoCall}
                                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                                            >
                                                Accept Call
                                            </button>
                                            <button
                                                onClick={handleDeclineVideoCall}
                                                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                                            >
                                                Decline Call
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <button
                                    onClick={handleEndVideoCall}
                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                                >
                                    End Video Call
                                </button>
                            )}
                        </div>
                        {isVideoCallActive && (
                            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-green-700 font-medium">Video call is active</span>
                                </div>
                                <p className="text-green-600 text-sm mt-1">You can now see and hear each other</p>
                            </div>
                        )}
                    </div>

                    {/* Chat Interface */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium">Chat</h4>
                            <button
                                onClick={() => setShowChat(!showChat)}
                                className="text-blue-500 hover:text-blue-600 text-sm"
                            >
                                {showChat ? 'Hide Chat' : 'Show Chat'}
                            </button>
                        </div>
                        
                        {showChat && (
                            <div className="border rounded-lg">
                                {/* Messages */}
                                <div className="h-64 overflow-y-auto p-4 bg-gray-50">
                                    {messages.length === 0 ? (
                                        <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
                                    ) : (
                                        messages.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`mb-3 ${
                                                    msg.sender === (role === 'patient' ? user._id : currentPatient)
                                                        ? 'text-right'
                                                        : 'text-left'
                                                }`}
                                            >
                                                <div
                                                    className={`inline-block max-w-xs px-3 py-2 rounded-lg ${
                                                        msg.sender === (role === 'patient' ? user._id : currentPatient)
                                                            ? 'bg-blue-500 text-white'
                                                            : 'bg-white text-gray-800 border'
                                                    }`}
                                                >
                                                    <p className="text-sm">{msg.message}</p>
                                                    <p className="text-xs opacity-75 mt-1">{msg.timestamp}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                
                                {/* Message Input */}
                                <form onSubmit={handleSendMessage} className="p-4 border-t">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            placeholder="Type your message..."
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newMessage.trim()}
                                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                        >
                                            Send
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default QueueSystem;