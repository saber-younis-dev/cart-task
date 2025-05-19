import React, { createContext, useState, useEffect, useContext, useMemo, useCallback } from 'react';
import authService from '../services/authService';

// Create context with default values
const AuthContext = createContext({
    user: null,
    isAuthenticated: false,
    loading: true,
    login: async () => ({}),
    logout: async () => {},
    register: async () => ({}),
    updateUser: () => {}
});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

    // Initialize auth state on mount
    useEffect(() => {
        let isMounted = true;

        const initAuth = async () => {
            try {
                // Only check with server if we have a token
                if (authService.isAuthenticated()) {
                    const { authenticated, user } = await authService.checkAuth();

                    if (isMounted) {
                        setIsAuthenticated(authenticated);
                        setUser(user);
                    }
                } else {
                    // Clear any potential invalid data
                    if (isMounted) {
                        setIsAuthenticated(false);
                        setUser(null);
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);

                // Clear potentially invalid tokens
                authService.clearAuthData();

                if (isMounted) {
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                    setInitialized(true);
                }
            }
        };

        initAuth();

        // Set up event listener for unauthorized events
        const handleUnauthorized = () => {
            if (isMounted) {
                setIsAuthenticated(false);
                setUser(null);
            }
        };

        window.addEventListener('auth:unauthorized', handleUnauthorized);

        // Cleanup function
        return () => {
            isMounted = false;
            window.removeEventListener('auth:unauthorized', handleUnauthorized);
        };
    }, []);

    // Memoized login function
    const login = useCallback(async (email, password) => {
        try {
            const result = await authService.login(email, password);

            if (result.success) {
                setUser(result.user);
                setIsAuthenticated(true);
            }

            return result;
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Login failed'
            };
        }
    }, []);

    // Memoized logout function
    const logout = useCallback(async () => {
        try {
            await authService.logout();
        } finally {
            setUser(null);
            setIsAuthenticated(false);
        }
    }, []);

    // Memoized register function
    const register = useCallback(async (userData) => {
        try {
            // Call registration API (not implemented in provided code)
            const result = await authService.register(userData);

            if (result.success) {
                setUser(result.user);
                setIsAuthenticated(true);
            }

            return result;
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Registration failed'
            };
        }
    }, []);

    // Function to update user data
    const updateUser = useCallback((userData) => {
        if (!userData) return false;

        const updated = authService.updateUserData(userData);

        if (updated) {
            setUser(prevUser => ({
                ...prevUser,
                ...userData
            }));
            return true;
        }

        return false;
    }, []);

    // Memoize context value to prevent unnecessary re-renders
    const contextValue = useMemo(() => ({
        user,
        isAuthenticated,
        loading,
        initialized,
        login,
        logout,
        register,
        updateUser
    }), [
        user,
        isAuthenticated,
        loading,
        initialized,
        login,
        logout,
        register,
        updateUser
    ]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook for using auth context
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};
