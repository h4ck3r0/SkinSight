import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        // Use the correct backend URL
        const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'https://mycarebridge.onrender.com';
        
        const newSocket = io(SOCKET_URL, {
            transports: ['websocket', 'polling'], // Allow fallback to polling
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 10000,
            withCredentials: true,
            autoConnect: true,
            forceNew: true
        });

        newSocket.on('connect', () => {
            console.log('Socket connected successfully');
            if (user) {
                // Join user's room for private messages
                newSocket.emit('joinRoom', user._id);
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
            
            // Try to fallback to polling if websocket fails
            if (newSocket.io.opts.transports[0] === 'websocket') {
                console.log('WebSocket failed, falling back to polling');
                newSocket.io.opts.transports = ['polling', 'websocket'];
            }
            
            toast.error('Failed to connect to server. Please try again later.');
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            if (reason === 'io server disconnect') {
                // Server initiated disconnect, try to reconnect
                newSocket.connect();
            }
        });

        newSocket.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
            if (user) {
                newSocket.emit('joinRoom', user._id);
            }
        });

        newSocket.on('reconnect_error', (error) => {
            console.error('Socket reconnection error:', error);
        });

        newSocket.on('reconnect_failed', () => {
            console.error('Socket reconnection failed after all attempts');
            toast.error('Failed to reconnect to server');
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [user]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};

export default SocketContext; 