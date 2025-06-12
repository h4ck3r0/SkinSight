import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSimplePeer } from '../hooks/useSimplePeer';

const VideoCall = ({ 
    isActive, 
    onEndCall, 
    socket, 
    localUserId, 
    remoteUserId, 
    isInitiator = false 
}) => {
    const { Peer, loading, error } = useSimplePeer();
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [mediaError, setMediaError] = useState(null);
    
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const peerRef = useRef();
    const localStreamRef = useRef();

    // Initialize local stream when component becomes active
    useEffect(() => {
        if (isActive && !localStream && !loading && Peer && localUserId && remoteUserId) {
            startLocalStream();
        }
        
        return () => {
            cleanup();
        };
    }, [isActive, loading, Peer, localUserId, remoteUserId]);

    // Create peer connection when local stream is ready
    useEffect(() => {
        if (isActive && localStream && remoteUserId && Peer && !peerRef.current) {
            createPeer(isInitiator);
        }
        
        return () => {
            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
        };
    }, [isActive, localStream, remoteUserId, isInitiator, Peer]);

    // Cleanup when call becomes inactive
    useEffect(() => {
        if (!isActive) {
            cleanup();
        }
    }, [isActive]);

    // Update video elements when streams change
    useEffect(() => {
        if (localStream && localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
            console.log('Local video stream attached');
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteStream && remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            console.log('Remote video stream attached');
        }
    }, [remoteStream]);

    const cleanup = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        setLocalStream(null);
        setRemoteStream(null);
        setIsConnected(false);
        setIsConnecting(false);
        setMediaError(null);
    };

    const startLocalStream = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setMediaError('Camera/microphone not supported in this browser');
            return;
        }

        try {
            setMediaError(null);
            console.log('Requesting media access...');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            setLocalStream(stream);
            localStreamRef.current = stream;
            
            console.log('Media access granted successfully');
            toast.success('Camera and microphone connected');
            
        } catch (error) {
            console.error('Media access failed:', error);
            
            // Try audio-only as fallback
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: false
                });
                
                setLocalStream(audioStream);
                localStreamRef.current = audioStream;
                toast.info('Video unavailable, continuing with audio only');
                
            } catch (audioError) {
                console.error('Audio-only also failed:', audioError);
                setMediaError('Unable to access camera or microphone. Please check your browser permissions and try again.');
                toast.error('Media access denied');
            }
        }
    };

    const createPeer = (initiator) => {
        if (!Peer || !remoteUserId) return;

        console.log('Creating peer connection...');

        const peerConfig = {
            initiator,
            trickle: false
        };

        if (localStream) {
            peerConfig.stream = localStream;
        }

        const peer = new Peer(peerConfig);

        peer.on('signal', (data) => {
            if (peerRef.current && peerRef.current === peer) {
                socket.emit('videoCallSignal', {
                    signal: data,
                    from: localUserId,
                    to: remoteUserId
                });
            }
        });

        peer.on('stream', (stream) => {
            console.log('Received remote stream with tracks:', stream.getTracks().map(t => t.kind));
            setRemoteStream(stream);
            setIsConnected(true);
            setIsConnecting(false);
        });

        peer.on('connect', () => {
            console.log('Peer connection established');
            setIsConnected(true);
            setIsConnecting(false);
            toast.success('Call connected!');
        });

        peer.on('error', (error) => {
            console.error('Peer error:', error);
            toast.error('Connection error: ' + error.message);
            setIsConnecting(false);
        });

        peer.on('close', () => {
            console.log('Peer connection closed');
            setIsConnected(false);
            setIsConnecting(false);
        });

        peerRef.current = peer;
        setIsConnecting(true);
    };

    const handleSignal = (signal) => {
        if (!peerRef.current) {
            createPeer(false);
            setTimeout(() => {
                if (peerRef.current) {
                    peerRef.current.signal(signal);
                }
            }, 200);
        } else {
            try {
                peerRef.current.signal(signal);
            } catch (error) {
                console.error('Error signaling peer:', error);
            }
        }
    };

    const handleEndCall = () => {
        cleanup();
        onEndCall();
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
                toast(audioTrack.enabled ? 'Microphone unmuted' : 'Microphone muted');
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
                toast(videoTrack.enabled ? 'Camera turned on' : 'Camera turned off');
            }
        }
    };

    const retryMediaAccess = () => {
        setMediaError(null);
        startLocalStream();
    };

    // Video element event handlers
    const handleLocalVideoLoad = () => {
        console.log('Local video loaded');
    };

    const handleRemoteVideoLoad = () => {
        console.log('Remote video loaded');
    };

    const handleLocalVideoError = (e) => {
        console.error('Local video error:', e);
    };

    const handleRemoteVideoError = (e) => {
        console.error('Remote video error:', e);
    };

    // Expose handleSignal function to parent component
    useEffect(() => {
        const handler = (signal) => {
            if (isActive && peerRef.current) {
                handleSignal(signal);
            }
        };

        if (window.videoCallHandlers) {
            window.videoCallHandlers[localUserId] = handler;
        } else {
            window.videoCallHandlers = { [localUserId]: handler };
        }

        return () => {
            if (window.videoCallHandlers && window.videoCallHandlers[localUserId]) {
                delete window.videoCallHandlers[localUserId];
            }
        };
    }, [localUserId, isActive]);

    if (!isActive) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <span>Loading video call...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6">
                    <div className="text-red-600">
                        <p>Failed to load video call library</p>
                        <button 
                            onClick={onEndCall}
                            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">Video Call</h3>
                    <div className="flex items-center gap-2">
                        {isConnecting && (
                            <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                <span className="text-sm text-gray-600">Connecting...</span>
                            </div>
                        )}
                        {isConnected && (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-green-600">Connected</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Debug Info */}
                <div className="mb-2 text-xs text-gray-500">
                    Local Stream: {localStream ? '✅' : '❌'} | 
                    Remote Stream: {remoteStream ? '✅' : '❌'} | 
                    Connected: {isConnected ? '✅' : '❌'}
                </div>

                {/* Media Error Display */}
                {mediaError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <span className="text-sm font-medium text-red-700">Media Access Issue</span>
                                </div>
                                <p className="text-sm text-red-600 mb-2">{mediaError}</p>
                                <div className="text-xs text-red-500">
                                    <p className="mb-1"><strong>Troubleshooting:</strong></p>
                                    <ul className="list-disc list-inside space-y-1">
                                        <li>Check if your browser has permission to access camera/microphone</li>
                                        <li>Try refreshing the page and allowing permissions when prompted</li>
                                        <li>Ensure no other apps are using your camera/microphone</li>
                                        <li>Check your device's camera and microphone settings</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-4">
                                <button
                                    onClick={retryMediaAccess}
                                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                >
                                    Retry
                                </button>
                                <button
                                    onClick={handleEndCall}
                                    className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                >
                                    End Call
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Local Video */}
                    <div className="relative">
                        {localStream ? (
                            <video
                                ref={localVideoRef}
                                autoPlay
                                muted
                                playsInline
                                onLoadedMetadata={handleLocalVideoLoad}
                                onError={handleLocalVideoError}
                                className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="w-full h-64 bg-gray-900 rounded-lg flex items-center justify-center">
                                <div className="text-center text-white">
                                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm">No Camera</p>
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                            You
                        </div>
                    </div>

                    {/* Remote Video */}
                    <div className="relative">
                        {remoteStream ? (
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                onLoadedMetadata={handleRemoteVideoLoad}
                                onError={handleRemoteVideoError}
                                className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="w-full h-64 bg-gray-900 rounded-lg flex items-center justify-center">
                                <div className="text-center text-white">
                                    <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-sm">Waiting for {isInitiator ? 'Patient' : 'Doctor'}</p>
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                            {isInitiator ? 'Patient' : 'Doctor'}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                    {localStream && (
                        <>
                            <button
                                onClick={toggleMute}
                                className={`px-4 py-2 rounded-lg transition-colors ${
                                    isMuted 
                                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                                        : 'bg-gray-500 hover:bg-gray-600 text-white'
                                }`}
                            >
                                {isMuted ? 'Unmute' : 'Mute'}
                            </button>
                            {localStream.getVideoTracks().length > 0 && (
                                <button
                                    onClick={toggleVideo}
                                    className={`px-4 py-2 rounded-lg transition-colors ${
                                        isVideoOff 
                                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                                            : 'bg-gray-500 hover:bg-gray-600 text-white'
                                    }`}
                                >
                                    {isVideoOff ? 'Turn On Camera' : 'Turn Off Camera'}
                                </button>
                            )}
                        </>
                    )}
                    <button
                        onClick={handleEndCall}
                        className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                        End Call
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoCall; 