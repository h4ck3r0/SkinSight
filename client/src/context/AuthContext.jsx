import { createContext, useContext, useEffect, useState } from "react";
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Configure axios defaults
    axios.defaults.baseURL = 'https://mycarebridge.onrender.com/api';
    axios.defaults.withCredentials = true;
    axios.defaults.headers.common['Content-Type'] = 'application/json';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const response = await axios.get('/auth/me');
                    setUser(response.data.user);
                }
            } catch (err) {
                console.error('Auth check failed:', err);
                localStorage.removeItem('token');
                delete axios.defaults.headers.common['Authorization'];
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const signup = async (userData) => {
        try {
            setError(null);
            const response = await axios.post('/auth/signup', userData);
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            return user;
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Signup failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const signin = async (credentials) => {
        try {
            setError(null);
            const response = await axios.post('/auth/signin', credentials);
            const { token, user } = response.data;
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(user);
            return user;
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Signin failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const signout = async () => {
        try {
            await axios.get('/auth/signout');
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
        } catch (err) {
            console.error('Signout error:', err);
        }
    };

    const updateProfile = async (userData) => {
        try {
            setError(null);
            const response = await axios.patch('/auth/updateMe', userData);
            setUser(response.data);
            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Profile update failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    };

    const value = {
        user,
        loading,
        error,
        signup,
        signin,
        signout,
        updateProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};