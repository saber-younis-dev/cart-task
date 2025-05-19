import React, { useState, useEffect } from 'react';
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
import authService from '../services/authService';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get return URL and message from location state if available
    // If no returnUrl is specified, default to '/cart' instead of '/'
    const returnUrl = location.state?.returnUrl || '/cart';
    const message = location.state?.message || '';

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Check if already authenticated
    useEffect(() => {
        const checkAuth = async () => {
            if (authService.isAuthenticated()) {
                setIsAuthenticated(true);
                // Redirect to return URL if already logged in
                setTimeout(() => handleSuccessfulLogin(), 1000);
            }
        };

        checkAuth();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Call login from auth service
            const result = await authService.login(formData.email, formData.password);

            if (result.success) {
                handleSuccessfulLogin();
            } else {
                setError(result.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login failed:', error);
            setError(error.message || 'Login failed. Please check your credentials and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessfulLogin = () => {
        // Check if there's a pending cart in localStorage
        const pendingCart = localStorage.getItem('pendingCart');

        if (pendingCart) {
            // Restore cart and remove from localStorage
            localStorage.removeItem('pendingCart');
            navigate('/cart', {
                state: {
                    cart: JSON.parse(pendingCart),
                    fromLogin: true // Add flag to indicate coming from login
                }
            });
        } else {
            // Just navigate to the return URL (which defaults to '/cart')
            navigate(returnUrl, {
                state: {
                    fromLogin: true // Add flag to indicate coming from login
                }
            });
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper sx={{ p: 4, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
                <Typography variant="h4" fontWeight={700} align="center" gutterBottom>
                    Sign In
                </Typography>

                {message && (
                    <Alert severity="info" sx={{ mb: 3 }}>
                        {message}
                    </Alert>
                )}

                {isAuthenticated ? (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <CircularProgress size={40} />
                        <Typography sx={{ mt: 2 }}>
                            You're already signed in. Redirecting to cart...
                        </Typography>
                    </Box>
                ) : (
                    <Box component="form" onSubmit={handleSubmit}>
                        {error && (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                {error}
                            </Alert>
                        )}

                        <TextField
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
                        />

                        <TextField
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
                )}
            </Paper>
        </Container>
    );
};

export default Login;
