import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { toast } from 'react-hot-toast';

const VideoCall = ({ 
    isActive, 
    onEndCall, 
    socket, 
    localUserId, 
    remoteUserId, 
    isInitiator = false 
}) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    
    const localVideoRef = useRef();
    const remoteVideoRef = useRef();
    const peerRef = useRef();
    const localStreamRef = useRef();

    useEffect(() => {
        if (isActive && !localStream) {
            startLocalStream();
        }
        
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
            }
            if (peerRef.current) {
                peerRef.current.destroy();
            }
        };
    }, [isActive]);

    const startLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });
            
            setLocalStream(stream);
            localStreamRef.current = stream;
            
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            
            if (isInitiator) {
                createPeer(true);
            }
        } catch (error) {
            console.error('Error accessing media devices:', error);
            toast.error('Could not access camera/microphone');
        }
    };

    const createPeer = (initiator) => {
        if (!localStream) return;

        const peer = new Peer({
            initiator,
            trickle: false,
            stream: localStream
        });

        peer.on('signal', (data) => {
            console.log('Sending signal to remote peer');
            socket.emit('videoCallSignal', {
                signal: data,
                from: localUserId,
                to: remoteUserId
            });
        });

        peer.on('stream', (stream) => {
            console.log('Received remote stream');
            setRemoteStream(stream);
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
            setIsConnected(true);
            setIsConnecting(false);
        });

        peer.on('connect', () => {
            console.log('Peer connection established');
            setIsConnected(true);
            setIsConnecting(false);
            toast.success('Video call connected!');
        });

        peer.on('error', (error) => {
            console.error('Peer error:', error);
            toast.error('Video call error: ' + error.message);
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
        if (peerRef.current) {
            peerRef.current.signal(signal);
        } else {
            createPeer(false);
            setTimeout(() => {
                if (peerRef.current) {
                    peerRef.current.signal(signal);
                }
            }, 100);
        }
    };

    const handleEndCall = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (peerRef.current) {
            peerRef.current.destroy();
        }
        setLocalStream(null);
        setRemoteStream(null);
        setIsConnected(false);
        setIsConnecting(false);
        onEndCall();
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                toast(audioTrack.enabled ? 'Microphone unmuted' : 'Microphone muted');
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                toast(videoTrack.enabled ? 'Camera turned on' : 'Camera turned off');
            }
        }
    };

    // Expose handleSignal function to parent component
    useEffect(() => {
        if (window.videoCallHandlers) {
            window.videoCallHandlers[localUserId] = handleSignal;
        } else {
            window.videoCallHandlers = { [localUserId]: handleSignal };
        }

        return () => {
            if (window.videoCallHandlers) {
                delete window.videoCallHandlers[localUserId];
            }
        };
    }, [localUserId]);

    if (!isActive) return null;

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

                <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Local Video */}
                    <div className="relative">
                        <video
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                            You
                        </div>
                    </div>

                    {/* Remote Video */}
                    <div className="relative">
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-64 bg-gray-900 rounded-lg object-cover"
                        />
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                            {isInitiator ? 'Patient' : 'Doctor'}
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex justify-center gap-4">
                    <button
                        onClick={toggleMute}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Mute/Unmute
                    </button>
                    <button
                        onClick={toggleVideo}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Camera On/Off
                    </button>
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