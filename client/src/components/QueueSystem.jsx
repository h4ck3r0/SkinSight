import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import VideoCall from "./VideoCall";

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
    
    // Video call state
    const [videoCallData, setVideoCallData] = useState({
        isActive: false,
        isInitiator: false,
        remoteUserId: null
    });
    
    // Track who initiated the call
    const [callInitiator, setCallInitiator] = useState(null);
    
    // Add debounce for video call state changes
    const [isVideoCallStateChanging, setIsVideoCallStateChanging] = useState(false);

    // Add event to log
    const addToLog = (message, type = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setEventLog(prev => [...prev.slice(-9), { message, type, timestamp }]); // Keep only last 10 entries
    };

    // Debug logging
    useEffect(() => {
        console.log('QueueSystem Props:', { doctorId, hospitalId, role });
        console.log('User:', user);
        console.log('Doctor ID type:', typeof doctorId);
        console.log('Doctor ID value:', doctorId);
        console.log('Hospital ID type:', typeof hospitalId);
        console.log('Hospital ID value:', hospitalId);
        console.log('Socket connection status:', socket?.connected);
        console.log('Socket ID:', socket?.id);
        addToLog(`QueueSystem initialized for ${role}`, 'info');
    }, [doctorId, hospitalId, role, user, socket]);

    useEffect(() => {
        if (!socket) {
            addToLog('Socket not available', 'error');
            return;
        }

        // Socket connection status
        const handleConnect = () => {
            setIsConnected(true);
            addToLog('Connected to server', 'success');
            
            // Join user's room using MongoDB user ID (long ID)
            if (user && user._id) {
                socket.emit('joinRoom', user._id);
                addToLog(`Joined user room with MongoDB ID: ${user._id}`, 'info');
            } else {
                console.error('User ID not available for room joining');
                addToLog('User ID not available for room joining', 'error');
            }
            
            // Get initial queue status
            if (doctorId && hospitalId) {
                socket.emit('getQueueStatus', { doctorId, hospitalId });
                addToLog('Requesting initial queue status', 'info');
            } else {
                console.error('Doctor ID or Hospital ID not available for queue status');
                addToLog('Doctor ID or Hospital ID not available for queue status', 'error');
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
            if (role === 'patient' && user && data.patientId === user._id) {
                setCurrentPosition(data.position);
                setEstimatedWaitTime(data.estimatedWaitTime);
                addToLog(`Position updated: ${data.position}`, 'info');
            }
        };

        const handlePatientCalled = (data) => {
            console.log('Patient called:', data);
            console.log('Current role:', role);
            console.log('Current user ID:', user?._id);
            console.log('Data patient ID:', data.patientId);
            
            if (role === 'patient' && user && data.patientId === user._id) {
                console.log('Patient entering consultation mode');
                toast.success('You are being called by the doctor!');
                setIsInQueue(false);
                setIsInConsultation(true);
                addToLog('You have been called!', 'success');
            }
            if (role === 'doctor' && data.patientId) {
                console.log('Setting current patient for doctor:', data.patientId);
                console.log('Doctor entering consultation mode');
                setCurrentPatient(data.patientId);
                setIsInConsultation(true);
                addToLog(`Patient ${data.patientId} called for consultation`, 'success');
            }
        };

        const handleConsultationComplete = (data) => {
            console.log('Consultation complete:', data);
            if (role === 'patient' && user && data.patientId === user._id) {
                console.log('Patient leaving consultation mode');
                setIsInConsultation(false);
                setIsOnlineMode(false);
                setShowChat(false);
                setIsVideoCallActive(false);
                setMessages([]);
                toast.success('Consultation completed!');
                addToLog('Consultation completed', 'success');
            }
            if (role === 'doctor' && data.patientId === currentPatient) {
                console.log('Doctor completing consultation');
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
            console.log('Online mode toggle received:', {
                role,
                user_id: user?._id,
                currentPatient,
                patientId: data.patientId,
                newOnlineMode: data.isOnline,
                isInConsultation
            });
            
            if (role === 'patient' && user && data.patientId === user._id) {
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
            console.log('Current user ID:', user?._id);
            console.log('Message sender:', data.sender);
            console.log('Is own message:', data.sender === user?._id);
            
            if (user && data.sender !== user._id) {
                console.log('Adding message to local state');
                setMessages(prev => {
                    const newMessages = [...prev, {
                        id: Date.now(),
                        sender: data.sender,
                        message: data.message,
                        timestamp: new Date().toLocaleTimeString()
                    }];
                    console.log('Updated messages array:', newMessages);
                    return newMessages;
                });
                addToLog('Message received', 'info');
            } else {
                console.log('Ignoring own message or no user available');
            }
        };

        const handleVideoCallRequestReceived = (data) => {
            console.log('Video call request received:', data);
            
            if (isVideoCallStateChanging) {
                console.log('Video call state is changing, ignoring request');
                return;
            }
            
            toast.success('Video call request received - starting call...');
            addToLog('Video call request received', 'info');
            
            setIsVideoCallStateChanging(true);
            
            // Get the correct remote user ID from the request data
            const remoteUserId = role === 'patient' ? data.doctorId : data.patientId;
            
            // Set the call initiator (the person who sent the request)
            setCallInitiator(data.patientId);
            
            // Start video call as receiver (NOT initiator)
            setVideoCallData({
                isActive: true,
                isInitiator: false,
                remoteUserId
            });
            
            // Send acceptance response
            socket.emit('videoCallResponse', {
                doctorId,
                hospitalId,
                patientId: user._id,
                accepted: true
            });
            
            // Reset the debounce after a short delay
            setTimeout(() => {
                setIsVideoCallStateChanging(false);
            }, 1000);
            
            addToLog('Video call accepted and started', 'success');
        };

        const handleVideoCallSignal = (data) => {
            console.log('Video call signal received:', data);
            console.log('Current user ID:', user._id);
            console.log('Available handlers:', window.videoCallHandlers);
            
            try {
                if (!data || !data.signal) {
                    console.error('Invalid signal data received:', data);
                    addToLog('Invalid video call signal data', 'error');
                    return;
                }
                
                if (!user || !user._id) {
                    console.error('User not available for signal handling');
                    addToLog('User not available for video call signal', 'error');
                    return;
                }
                
                if (window.videoCallHandlers && window.videoCallHandlers[user._id]) {
                    console.log('Calling signal handler for user:', user._id);
                    try {
                        window.videoCallHandlers[user._id](data.signal);
                    } catch (handlerError) {
                        console.error('Error in signal handler:', handlerError);
                        
                        // Handle specific error types
                        if (handlerError && handlerError.message && handlerError.message.includes('destroyed')) {
                            console.log('Peer was destroyed, removing handler');
                            if (window.videoCallHandlers && window.videoCallHandlers[user._id]) {
                                delete window.videoCallHandlers[user._id];
                            }
                        } else {
                            // Log other errors but don't remove handler
                            console.error('Signal handler error:', handlerError);
                            const errorMsg = handlerError?.message || 'Unknown signal handler error';
                            addToLog(`Signal error: ${errorMsg}`, 'error');
                        }
                    }
                } else {
                    console.log('No signal handler found for user:', user._id);
                    addToLog('No video call handler available', 'warning');
                }
            } catch (error) {
                console.error('Unexpected error in handleVideoCallSignal:', error);
                addToLog('Unexpected video call signal error', 'error');
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
            console.error('Socket error received:', error);
            
            // Handle different types of error objects
            let errorMessage = 'Unknown socket error';
            
            try {
                if (typeof error === 'string') {
                    errorMessage = error;
                } else if (error && typeof error === 'object') {
                    if (error.message) {
                        errorMessage = error.message;
                    } else if (error.toString && typeof error.toString === 'function') {
                        errorMessage = error.toString();
                    } else if (error.name) {
                        errorMessage = `${error.name}: ${error.message || 'Unknown error'}`;
                    } else {
                        errorMessage = JSON.stringify(error);
                    }
                } else if (error !== null && error !== undefined) {
                    errorMessage = String(error);
                }
            } catch (parseError) {
                console.error('Error parsing socket error:', parseError);
                errorMessage = 'Socket communication error';
            }
            
            console.log('Processed error message:', errorMessage);
            addToLog(`Error: ${errorMessage}`, 'error');
            toast.error(errorMessage);
        };

        const handleVideoCallResponse = (data) => {
            console.log('Video call response received:', data);
            if (data.accepted) {
                // Only update video call data if this user is the initiator (the one who sent the request)
                if (callInitiator === user._id) {
                    const remoteUserId = role === 'patient' ? data.doctorId : data.patientId;
                    setVideoCallData({
                        isActive: true,
                        isInitiator: true,
                        remoteUserId
                    });
                }
                // The receiver's video call data should already be set by handleVideoCallRequestReceived
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
            setVideoCallData({
                isActive: false,
                isInitiator: false,
                remoteUserId: null
            });
            toast.success('Video call ended');
            addToLog('Video call ended', 'info');
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
        socket.on('videoCallRequest', handleVideoCallRequestReceived);
        socket.on('videoCallResponse', handleVideoCallResponse);
        socket.on('videoCallEnded', handleVideoCallEnded);
        socket.on('videoCallSignal', handleVideoCallSignal);
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
            socket.off('videoCallRequest', handleVideoCallRequestReceived);
            socket.off('videoCallResponse', handleVideoCallResponse);
            socket.off('videoCallEnded', handleVideoCallEnded);
            socket.off('videoCallSignal', handleVideoCallSignal);
            socket.off('error', handleError);
        };
    }, [socket, doctorId, hospitalId, user._id, role]);

    const handleRequestVideoCall = () => {
        if (!isConnected) {
            toast.error('Not connected to server');
            return;
        }
        
        if (!user || !user._id) {
            toast.error('User not available for video call');
            return;
        }
        
        if (isVideoCallStateChanging) {
            console.log('Video call state is changing, ignoring request');
            return;
        }
        
        // Determine the correct remote user ID based on role
        let remoteUserId;
        if (role === 'patient') {
            remoteUserId = doctorId;
        } else if (role === 'doctor') {
            if (!currentPatient) {
                toast.error('No patient in consultation to call');
                return;
            }
            remoteUserId = currentPatient;
        } else {
            toast.error('Invalid role for video call');
            return;
        }
        
        setIsVideoCallStateChanging(true);
        
        setCallInitiator(user._id);
        
        socket.emit('requestVideoCall', {
            doctorId,
            hospitalId,
            patientId: role === 'patient' ? user._id : currentPatient
        });
        
        setVideoCallData({
            isActive: true,
            isInitiator: true,
            remoteUserId
        });
        
        setTimeout(() => {
            setIsVideoCallStateChanging(false);
        }, 1000);
        
        addToLog('Video call request sent', 'info');
    };

    const handleAcceptVideoCall = () => {
        if (!isConnected) {
            toast.error('Not connected to server');
            return;
        }
        
        if (!user || !user._id) {
            toast.error('User not available for video call');
            return;
        }
        
        // Determine the correct remote user ID based on role
        let remoteUserId;
        if (role === 'patient') {
            remoteUserId = doctorId;
        } else if (role === 'doctor') {
            if (!currentPatient) {
                toast.error('No patient in consultation to call');
                return;
            }
            remoteUserId = currentPatient;
        } else {
            toast.error('Invalid role for video call');
            return;
        }
        
        socket.emit('videoCallResponse', {
            doctorId,
            hospitalId,
            patientId: user._id,
            accepted: true
        });
        
        // Start video call as receiver
        setVideoCallData({
            isActive: true,
            isInitiator: false,
            remoteUserId
        });
        
        addToLog('Video call accepted', 'success');
    };

    const handleDeclineVideoCall = () => {
        if (!isConnected) {
            toast.error('Not connected to server');
            return;
        }
        
        if (!user || !user._id) {
            toast.error('User not available for video call');
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
        
        setVideoCallData({
            isActive: false,
            isInitiator: false,
            remoteUserId: null
        });
        
        // Reset call initiator
        setCallInitiator(null);
        
        addToLog('Video call ended', 'info');
    };

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
        
        if (!user || !user._id) {
            toast.error('User not available to join queue');
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
        
        if (!user || !user._id) {
            toast.error('User not available to leave queue');
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
        
        // Check if in consultation
        if (!isInConsultation) {
            toast.error('You must be in consultation to use online mode');
            return;
        }
        
        const newOnlineMode = !isOnlineMode;
        const patientId = role === 'patient' ? user._id : currentPatient;
        
        console.log('Toggling online mode:', {
            role,
            user_id: user._id,
            currentPatient,
            patientId,
            newOnlineMode,
            isInConsultation
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
        
        if (!user || !user._id) {
            toast.error('User not available to send message');
            return;
        }
        
        console.log('Sending message:', {
            message: newMessage.trim(),
            sender: user._id,
            receiver: role === 'patient' ? doctorId : currentPatient,
            role: role
        });
        
        const messageData = {
            doctorId,
            hospitalId,
            sender: user._id, // Always use current user as sender
            receiver: role === 'patient' ? doctorId : currentPatient, // Receiver is the other person
            message: newMessage.trim()
        };
        
        // Add message to local messages array immediately for instant feedback
        setMessages(prev => {
            const newMessages = [...prev, {
                id: Date.now(),
                sender: user._id,
                message: newMessage.trim(),
                timestamp: new Date().toLocaleTimeString()
            }];
            console.log('Added message to local state:', newMessages);
            return newMessages;
        });
        
        socket.emit('sendMessage', messageData);
        setNewMessage('');
        addToLog('Message sent', 'info');
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
                        Role: {role} | Doctor: {typeof doctorId === 'string' ? doctorId?.slice(-8) : 'Invalid ID'} | Hospital: {typeof hospitalId === 'string' ? hospitalId?.slice(-8) : 'Invalid ID'}
                        <br />
                        <span className="text-xs text-gray-400">
                            Full Doctor ID: {doctorId} | Full Hospital ID: {hospitalId}
                        </span>
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
                    {(role === 'patient' || role === 'doctor') && (
                        <div className={`p-4 rounded-lg text-center ${
                            isInConsultation ? 'bg-green-50' : 'bg-gray-50'
                        }`}>
                            <p className="text-sm text-gray-600">Consultation</p>
                            <p className={`text-lg font-bold ${
                                isInConsultation ? 'text-green-600' : 'text-gray-600'
                            }`}>
                                {isInConsultation ? 'In Progress' : 'Not Started'}
                            </p>
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
                    {(role === 'doctor' || role === 'staff') && isInConsultation && currentPatient && (
                        <button
                            onClick={() => {
                                console.log('Manual test: Sending online mode toggle');
                                socket.emit('toggleOnlineMode', {
                                    doctorId,
                                    hospitalId,
                                    patientId: currentPatient,
                                    isOnline: true
                                });
                            }}
                            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                        >
                            Test Online Mode
                        </button>
                    )}
                    <button
                        onClick={() => socket?.emit('getQueueStatus', { doctorId, hospitalId })}
                        disabled={!isConnected}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                    >
                        Refresh Status
                    </button>
                    <button
                        onClick={() => {
                            console.log('Testing socket connection...');
                            console.log('Socket connected:', socket?.connected);
                            console.log('Socket ID:', socket?.id);
                            console.log('Socket transport:', socket?.io?.engine?.transport?.name);
                            addToLog(`Socket test - Connected: ${socket?.connected}, ID: ${socket?.id?.slice(-4)}`, 'info');
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                        Test Connection
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

            {/* Debug Info */}
            <div className="bg-white rounded-lg border p-6">
                <h3 className="text-lg font-semibold mb-4">Debug Info</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">Role</p>
                        <p className="text-gray-600">{role}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">MongoDB User ID</p>
                        <p className="text-gray-600 text-xs break-all">{user._id}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">Socket ID</p>
                        <p className="text-gray-600">{socket?.id?.slice(-4) || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">In Consultation</p>
                        <p className="text-gray-600">{isInConsultation ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">Online Mode</p>
                        <p className="text-gray-600">{isOnlineMode ? 'ON' : 'OFF'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">Current Patient (MongoDB ID)</p>
                        <p className="text-gray-600 text-xs break-all">{currentPatient || 'None'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">In Queue</p>
                        <p className="text-gray-600">{isInQueue ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">Queue Active</p>
                        <p className="text-gray-600">{isQueueActive ? 'Yes' : 'No'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                        <p className="font-medium">Connected</p>
                        <p className="text-gray-600">{isConnected ? 'Yes' : 'No'}</p>
                    </div>
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
                    
                    {/* Video Call Controls */}
                    <div className="mb-6">
                        <h4 className="font-medium mb-3">Video Call</h4>
                        <div className="flex gap-3">
                            {!videoCallData.isActive ? (
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
                        {videoCallData.isActive && (
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
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">
                                    Messages: {messages.length} | User: {user?._id?.slice(-8)} | Role: {role}
                                </span>
                                <button
                                    onClick={() => setShowChat(!showChat)}
                                    className="text-blue-500 hover:text-blue-600 text-sm"
                                >
                                    {showChat ? 'Hide Chat' : 'Show Chat'}
                                </button>
                            </div>
                        </div>
                        
                        {showChat && (
                            <div className="border rounded-lg">
                                {/* Messages */}
                                <div className="h-64 overflow-y-auto p-4 bg-gray-50">
                                    {messages.length === 0 ? (
                                        <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
                                    ) : (
                                        messages.map((msg) => {
                                            const isOwnMessage = msg.sender === user._id;
                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`mb-3 ${isOwnMessage ? 'text-right' : 'text-left'}`}
                                                >
                                                    <div
                                                        className={`inline-block max-w-xs px-3 py-2 rounded-lg ${
                                                            isOwnMessage
                                                                ? 'bg-blue-500 text-white'
                                                                : 'bg-white text-gray-800 border'
                                                        }`}
                                                    >
                                                        <p className="text-sm">{msg.message}</p>
                                                        <p className="text-xs opacity-75 mt-1">{msg.timestamp}</p>
                                                    </div>
                                                </div>
                                            );
                                        })
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

            {/* Video Call Component */}
            <VideoCall
                isActive={videoCallData.isActive}
                onEndCall={handleEndVideoCall}
                socket={socket}
                localUserId={user._id}
                remoteUserId={videoCallData.remoteUserId}
                isInitiator={videoCallData.isInitiator}
            />
        </div>
    );
};

export default QueueSystem;