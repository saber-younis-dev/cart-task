import axios from 'axios';

// Use window._env_ for runtime config or fallback to '/api'
const API_URL = (window._env_ && window._env_.REACT_APP_API_URL) || '/api';
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Create axios instance with better config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    timeout: 10000  // Add timeout for better error handling
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = authService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Enhanced response interceptor with better error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle network errors
        if (!error.response) {
            console.error('Network Error:', error.message);
            return Promise.reject({
                message: 'Network error. Please check your connection and try again.'
            });
        }

        // Handle authentication errors
        if (error.response.status === 401) {
            // Only log out if not already on login page
            if (!window.location.pathname.includes('login')) {
                authService.clearAuthData();

                // Use a custom event instead of direct redirect
                // This allows components to react appropriately
                window.dispatchEvent(new CustomEvent('auth:unauthorized', {
                    detail: { redirect: true }
                }));
            }
        }

        // Format the error response consistently
        return Promise.reject(
            error.response?.data || { message: error.message || 'An unexpected error occurred' }
        );
    }
);

// Helper for secure storage operations
const secureStorage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Storage error (${key}):`, error);
            return false;
        }
    },

    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;

            // Try to parse as JSON, return as string if that fails
            try {
                return JSON.parse(item);
            } catch {
                return item;
            }
        } catch (error) {
            console.error(`Storage retrieval error (${key}):`, error);
            return defaultValue;
        }
    },

    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Storage removal error (${key}):`, error);
            return false;
        }
    }
};

const authService = {
    /**
     * Authenticate a user with email and password
     * @param {string} email User email
     * @param {string} password User password
     * @returns {Promise<Object>} Authentication result
     */
    login: async (email, password) => {
        try {
            const response = await api.post('/login', { email, password });
            const { success, token, user } = response.data;

            if (success && token) {
                secureStorage.set(TOKEN_KEY, token);
                secureStorage.set(USER_KEY, user);
                return { success: true, user };
            }

            return response.data;
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Authentication failed'
            };
        }
    },

    /**
     * Log out the current user
     * @returns {Promise<void>}
     */
    logout: async () => {
        const token = authService.getToken();

        // Only make API call if we have a token
        if (token) {
            try {
                await api.post('/logout');
            } catch (error) {
                console.error('Logout error:', error);
            }
        }

        authService.clearAuthData();
    },

    /**
     * Verify the current authentication status with the server
     * @returns {Promise<Object>} Authentication status and user data
     */
    checkAuth: async () => {
        if (!authService.getToken()) {
            return { authenticated: false, user: null };
        }

        try {
            const response = await api.get('/user/check-auth');
            return {
                authenticated: true,
                user: response.data.user
            };
        } catch (error) {
            authService.clearAuthData();
            return { authenticated: false, user: null };
        }
    },

    /**
     * Get the current authenticated user
     * @returns {Object|null} Current user or null
     */
    getCurrentUser: () => {
        return secureStorage.get(USER_KEY, null);
    },

    /**
     * Get the current authentication token
     * @returns {string|null} Auth token or null
     */
    getToken: () => {
        return secureStorage.get(TOKEN_KEY, null);
    },

    /**
     * Check if a user is currently authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated: () => {
        return !!authService.getToken();
    },

    /**
     * Clear all authentication data
     */
    clearAuthData: () => {
        secureStorage.remove(TOKEN_KEY);
        secureStorage.remove(USER_KEY);
    },

    /**
     * Update user data in storage
     * @param {Object} userData Updated user data
     */
    updateUserData: (userData) => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
            secureStorage.set(USER_KEY, { ...currentUser, ...userData });
            return true;
        }
        return false;
    }
};

export default authService;
export { api }; // Export the configured axios instance for other API calls
