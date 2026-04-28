import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/services/api';
import {
    getAuthToken,
    setAuthToken,
    removeAuthToken,
    getUserFromToken
} from '@/lib/utils';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Session hydration on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = getAuthToken();

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Verify token and get user data
                const response = await authAPI.me();
                setUser(response.data);
            } catch (error) {
                console.error('Session hydration failed:', error);
                removeAuthToken();
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (credentials) => {
        try {
            // Step 1: Login to get token
            const loginResponse = await authAPI.login(credentials);
            const token = loginResponse.data.access_token || loginResponse.data.token;

            if (!token) {
                throw new Error('No token received from server');
            }

            setAuthToken(token);

            // Step 2: Fetch user data with the token
            const userResponse = await authAPI.me();
            const userData = userResponse.data;

            setUser(userData);

            // Role-based redirect
            const role = userData.role;
            if (role === 'driver') {
                navigate('/map');
            } else if (role === 'station_owner') {
                navigate('/owner/dashboard');
            } else if (role === 'admin') {
                navigate('/admin/console');
            } else {
                navigate('/');
            }

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);

            // Clear any partial auth state
            removeAuthToken();
            setUser(null);

            // Detailed error message
            let errorMessage = 'Login failed';

            if (error.response) {
                // Server responded with error
                errorMessage = error.response.data?.detail || error.response.data?.message || `Server error: ${error.response.status}`;
            } else if (error.request) {
                // Request made but no response
                errorMessage = 'Cannot connect to server. Please check if the backend is running.';
            } else {
                // Something else happened
                errorMessage = error.message || 'An unexpected error occurred';
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    };

    const register = async (data) => {
        try {
            // Step 1: Register (returns UserRead, not token)
            const registerResponse = await authAPI.register(data);
            console.log('Register response:', registerResponse.data);

            // Step 2: Login to get token
            const loginResponse = await authAPI.login({
                email: data.email,
                password: data.password
            });
            const token = loginResponse.data.access_token || loginResponse.data.token;

            if (!token) {
                throw new Error('No token received from server');
            }

            setAuthToken(token);

            // Step 3: Fetch user data with the token
            const userResponse = await authAPI.me();
            const userData = userResponse.data;

            setUser(userData);

            // Auto-login after registration
            const role = userData.role;
            if (role === 'driver') {
                navigate('/map');
            } else if (role === 'station_owner') {
                navigate('/owner/dashboard');
            } else {
                navigate('/');
            }

            return { success: true };
        } catch (error) {
            console.error('Registration error:', error);

            // Clear any partial auth state
            removeAuthToken();
            setUser(null);

            // Detailed error message
            let errorMessage = 'Registration failed';

            if (error.response) {
                // Server responded with error
                errorMessage = error.response.data?.detail || error.response.data?.message || `Server error: ${error.response.status}`;
            } else if (error.request) {
                // Request made but no response
                errorMessage = 'Cannot connect to server. Please check if the backend is running.';
            } else {
                // Something else happened
                errorMessage = error.message || 'An unexpected error occurred';
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            removeAuthToken();
            setUser(null);
            navigate('/login');
        }
    };

    const value = {
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};