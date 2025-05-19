import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Container,
    Paper,
    Divider,
    Alert,
    Link as MuiLink,
    CircularProgress
} from '@mui/material';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, loading: authLoading, login } = useAuth();

    // Get return URL and message from location state with improved defaults
    const returnUrl = location.state?.returnUrl || '/cart';
    const message = location.state?.message || '';

    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Memoize the login success handler to prevent unnecessary recreations
    const handleSuccessfulLogin = useCallback(() => {
        try {
            // Check if there's a pending cart in localStorage
            const pendingCart = localStorage.getItem('pendingCart');

            if (pendingCart) {
                // Parse once to avoid multiple parsing operations
                const parsedCart = JSON.parse(pendingCart);
                // Clear the pending cart
                localStorage.removeItem('pendingCart');

                navigate('/cart', {
                    state: {
                        cart: parsedCart,
                        fromLogin: true
                    },
                    // Replace instead of push to avoid back-button issues
                    replace: true
                });
            } else {
                navigate(returnUrl, {
                    state: { fromLogin: true },
                    replace: true
                });
            }
        } catch (err) {
            console.error('Navigation error:', err);
            // Fallback navigation if there's an error with the cart
            navigate('/cart', { replace: true });
        }
    }, [navigate, returnUrl]);

    // Redirect if already authenticated
    useEffect(() => {
        let isMounted = true;

        if (isAuthenticated && isMounted) {
            handleSuccessfulLogin();
        }

        // Cleanup function to prevent memory leaks
        return () => {
            isMounted = false;
        };
    }, [isAuthenticated, handleSuccessfulLogin]);

    // Use event memoization for better performance
    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return; // Prevent multiple submissions

        setLoading(true);
        setError('');

        try {
            // Use the login function from context instead of service directly
            const result = await login(formData.email, formData.password);

            if (!result.success) {
                setError(result.message || 'Login failed. Please try again.');
            }
            // No need for else block - the useEffect will handle successful login
        } catch (error) {
            console.error('Login failed:', error);
            setError(
                error.message ||
                'Authentication failed. Please check your credentials and try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Show loading state if auth is still initializing
    if (authLoading) {
        return (
            <Container maxWidth="sm" sx={{ mt: 8 }}>
                <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <CircularProgress size={40} />
                        <Typography sx={{ mt: 2 }}>
                            Checking authentication status...
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        );
    }

    // Already authenticated view
    if (isAuthenticated) {
        return (
            <Container maxWidth="sm" sx={{ mt: 8 }}>
                <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <CircularProgress size={40} />
                        <Typography sx={{ mt: 2 }}>
                            You're already signed in. Redirecting...
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        );
    }

    // Normal login view
    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
            >
                <Typography variant="h4" fontWeight={700} align="center" gutterBottom>
                    Sign In
                </Typography>

                {message && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        {message}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        id="email"
                        name="email"
                        label="Email Address"
                        variant="outlined"
                        fullWidth
                        required
                        margin="normal"
                        value={formData.email}
                        onChange={handleChange}
                        type="email"
                        autoComplete="email"
                        inputProps={{ maxLength: 100 }}
                    />

                    <TextField
                        id="password"
                        name="password"
                        label="Password"
                        variant="outlined"
                        fullWidth
                        required
                        margin="normal"
                        value={formData.password}
                        onChange={handleChange}
                        type="password"
                        autoComplete="current-password"
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loading}
                        sx={{
                            mt: 3,
                            mb: 2,
                            py: 1.5,
                            fontWeight: 600,
                            bgcolor: '#000',
                            color: '#fff',
                            '&:hover': { bgcolor: '#222' }
                        }}
                    >
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                    </Button>

                    <Box sx={{ textAlign: 'right', mb: 2 }}>
                        <MuiLink component={Link} to="/forgot-password" variant="body2">
                            Forgot password?
                        </MuiLink>
                    </Box>

                    <Divider sx={{ my: 3 }}>
                        <Typography color="text.secondary" variant="body2">OR</Typography>
                    </Divider>

                    <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Don't have an account?
                        </Typography>
                        <Button
                            component={Link}
                            to="/register"
                            variant="outlined"
                            fullWidth
                            sx={{
                                py: 1.5,
                                fontWeight: 600,
                                borderColor: '#000',
                                color: '#000',
                                '&:hover': { borderColor: '#222', bgcolor: 'rgba(0,0,0,0.04)' }
                            }}
                        >
                            Create Account
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default React.memo(Login);  // Prevent unnecessary re-renders
