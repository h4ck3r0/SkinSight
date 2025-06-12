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
    const [token, setToken] = useState(localStorage.getItem('token'));

    axios.defaults.baseURL = 'https://mycarebridge.onrender.com/api';
    axios.defaults.withCredentials = true;
    axios.defaults.headers.common['Content-Type'] = 'application/json';

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (token) {
                    const response = await axios.get('/auth/me');
                    setUser(response.data.user);
                }
            } catch (err) {
                console.error('Auth check failed:', err);
                localStorage.removeItem('token');
                setToken(null);
                setUser(null);
                delete axios.defaults.headers.common['Authorization'];
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, [token]);

    const signup = async (userData) => {
        try {
            setError(null);
            const response = await axios.post('/auth/signup', userData);
            const { token: newToken, user } = response.data;
            localStorage.setItem('token', newToken);
            setToken(newToken);
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
            setLoading(true);
            setError(null);
            const response = await axios.post('/auth/signin', credentials);
            const { token: newToken, user: userData } = response.data;
            localStorage.setItem('token', newToken);
            setToken(newToken);
            
            setUser(userData);
            
            return userData;
        } catch (err) {
            setError(err.response?.data?.message || "Login failed");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const signout = async () => {
        try {
            // Try to call the server logout endpoint
            if (token) {
                await axios.get('/auth/signout');
            }
        } catch (err) {
            console.error('Server signout error:', err);
            // Continue with local cleanup even if server call fails
        } finally {
            // Always clean up local state
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
            setError(null);
            delete axios.defaults.headers.common['Authorization'];
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
        token,
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