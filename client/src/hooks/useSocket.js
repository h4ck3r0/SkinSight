import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const useSocket = () => {
    const socketRef = useRef(null);

    useEffect(() => {
        // Initialize socket connection with more resilient configuration
        socketRef.current = io(import.meta.env.VITE_SERVER_URL || 'https://mycarebridge.onrender.com', {
            withCredentials: true,
            transports: ['websocket', 'polling'], // Allow fallback to polling
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            forceNew: true,
            autoConnect: true
        });

        // Connection event handlers
        socketRef.current.on('connect', () => {
            console.log('Socket connected successfully');
        });

        socketRef.current.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            // Attempt to reconnect with polling if websocket fails
            if (socketRef.current.io.opts.transports[0] === 'websocket') {
                console.log('Falling back to polling transport');
                socketRef.current.io.opts.transports = ['polling', 'websocket'];
            }
        });

        socketRef.current.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            if (reason === 'io server disconnect') {
                // Server initiated disconnect, try to reconnect
                socketRef.current.connect();
            }
        });

        socketRef.current.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
        });

        socketRef.current.on('reconnect_error', (error) => {
            console.error('Socket reconnection error:', error);
        });

        socketRef.current.on('reconnect_failed', () => {
            console.error('Socket reconnection failed after all attempts');
        });

        // Cleanup on unmount
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    return socketRef.current;
};

export default useSocket; 