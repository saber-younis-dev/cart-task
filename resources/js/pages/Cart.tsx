import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardMedia,
    Typography,
    Button,
    Container,
    IconButton,
    Chip,
    Divider,
    Paper,
    Snackbar,
    Alert
} from '@mui/material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService, { api } from '../services/authService';

const orderNumber = 123;
const orderDate = new Date(2025, 4, 5).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

const Cart = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Check if there's cart data in location state or restore from localStorage
    const savedCart = localStorage.getItem('cart');
    const initialCart = location.state?.cart || (savedCart ? JSON.parse(savedCart) : []);

    const [cartItems, setCartItems] = useState(initialCart);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

    // Use the auth context
    const { isAuthenticated, loading, user } = useAuth();

    // Add a local auth state that will be used for UI rendering
    const [authState, setAuthState] = useState({
        isAuthenticated: isAuthenticated,
        loading: loading
    });

    // Update local auth state whenever the auth context changes
    useEffect(() => {
        setAuthState({
            isAuthenticated: isAuthenticated,
            loading: loading
        });
    }, [isAuthenticated, loading]);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cartItems));
    }, [cartItems]);

    // Show welcome notification if redirected from login
    useEffect(() => {
        if (location.state?.fromLogin && isAuthenticated) {
            setNotification({
                open: true,
                message: `Welcome back${user?.name ? ', ' + user.name : ''}! You can now place your order.`,
                severity: 'success'
            });

            // Clear the fromLogin state to prevent showing the notification again on page refresh
            const newState = { ...location.state };
            delete newState.fromLogin;
            navigate(location.pathname, {
                state: newState,
                replace: true
            });
        }
    }, [location.state, isAuthenticated]);

    const handleQtyChange = (id, delta) => {
        setCartItems((prev) =>
            prev
                .map((item) =>
                    item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
                )
                .filter((item) => item.qty > 0)
        );
    };

    const handleRemove = (id) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    };

    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = 15;
    const tax = 12.5;
    const total = subtotal + shipping + tax;

    // Handle place order button click
    const handlePlaceOrder = () => {
        if (!authState.isAuthenticated) {
            // Show notification
            setNotification({
                open: true,
                message: 'Please log in to complete your order',
                severity: 'info'
            });

            // Save cart to localStorage before redirecting
            localStorage.setItem('pendingCart', JSON.stringify(cartItems));

            // Redirect to login page with return URL
            navigate('/login', {
                state: {
                    returnUrl: '/cart',
                    message: 'Please log in to complete your order'
                }
            });
        } else {
            // Process order for authenticated user
            processOrder();
        }
    };

    // Process the order for authenticated users
    const processOrder = async () => {
        try {
            setNotification({
                open: true,
                message: 'Processing your order...',
                severity: 'info'
            });

            // Format cart items to match the API requirements
            const products = cartItems.map(item => ({
                id: item.id,
                quantity: item.qty
            }));

            // Use the configured api instance with auth token
            const response = await api.post('/orders', {
                products: products
            });

            // Handle successful order
            setNotification({
                open: true,
                message: 'Order placed successfully!',
                severity: 'success'
            });

            // Clear the cart after successful order
            setCartItems([]);
            localStorage.removeItem('cart');

            // Redirect to order confirmation page
            setTimeout(() => {
                navigate(`/orders/${response.data.id}`, {
                    state: { orderDetails: response.data }
                });
            }, 1500);

        } catch (error) {
            console.error('Order processing failed:', error);

            // Check for specific error messages from the API
            const errorMessage = error.response?.data?.error || 'Failed to process order. Please try again.';

            setNotification({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        }
    };

    // Close notification
    const handleCloseNotification = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    // Force refresh auth state - can be useful when returning from login
    const refreshAuthState = () => {
        setAuthState({
            isAuthenticated: isAuthenticated,
            loading: loading
        });
    };

    // Check auth state on mount and when the component becomes visible
    useEffect(() => {
        refreshAuthState();

        // Also refresh when the window regains focus (e.g., after returning from login)
        const handleFocus = () => refreshAuthState();
        window.addEventListener('focus', handleFocus);

        return () => window.removeEventListener('focus', handleFocus);
    }, []);

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Left: Cart Items */}
                <Box sx={{ flex: 3, width: '100%' }}>
                    <Box sx={{ color: 'grey.600', fontSize: 14, mb: 2 }}>Home / <b>Cart</b></Box>
                    <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>Your cart</Typography>
                    {cartItems.length === 0 ? (
                        <Typography align="center" sx={{ color: 'grey.600', fontSize: 15, mb: 2 }}>
                            No items in cart.
                        </Typography>
                    ) : (
                        cartItems.map((item) => (
                            <Card key={item.id} sx={{ mb: 3, p: 2, borderRadius: 3, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <CardMedia
                                        component="img"
                                        image={item.image}
                                        alt={item.name}
                                        sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 2, mr: 3, bgcolor: '#f7f8fa' }}
                                    />
                                    <Box sx={{ flex: 1 }}>
                                        <Typography fontWeight={600} sx={{ fontSize: 18, mb: 0.5, display: 'flex', alignItems: 'center' }}>
                                            {item.name}
                                            <Chip label={item.type} size="small" sx={{ ml: 1, fontSize: 11, fontWeight: 600, bgcolor: '#f7f8fa' }} />
                                        </Typography>
                                        <Typography fontWeight={700} sx={{ fontSize: 16, mb: 0.5 }}>${item.price}</Typography>
                                        <Typography sx={{ color: 'grey.500', fontSize: 14, mb: 1 }}>Stock: {item.stock}</Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <IconButton size="small" onClick={() => handleQtyChange(item.id, -1)}>
                                                <RemoveIcon fontSize="small" />
                                            </IconButton>
                                            <Typography sx={{ minWidth: 24, textAlign: 'center', fontSize: 16 }}>{item.qty}</Typography>
                                            <IconButton size="small" onClick={() => handleQtyChange(item.id, 1)}>
                                                <AddIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                    <IconButton size="large" sx={{ color: 'red', ml: 2 }} onClick={() => handleRemove(item.id)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Card>
                        ))
                    )}
                </Box>
                {/* Right: Order Summary */}
                <Box sx={{ flex: 1, minWidth: 300, width: { xs: '100%', md: 350 }, mt: { xs: 4, md: 0 } }}>
                    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography fontWeight={700} fontSize={18}>Order Summary</Typography>
                            <Typography color="primary" fontSize={14}>{orderDate}</Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography color="text.secondary" fontSize={15}>Subtotal</Typography>
                            <Typography fontWeight={600} fontSize={15}>${subtotal.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography color="text.secondary" fontSize={15}>Shipping</Typography>
                            <Typography fontWeight={600} fontSize={15}>${shipping.toFixed(2)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography color="text.secondary" fontSize={15}>Tax</Typography>
                            <Typography fontWeight={600} fontSize={15}>${tax.toFixed(2)}</Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Typography fontWeight={700} fontSize={16}>Total</Typography>
                            <Typography fontWeight={700} fontSize={16}>${total.toFixed(2)}</Typography>
                        </Box>
                        <Button
                            variant="contained"
                            fullWidth
                            disabled={cartItems.length === 0 || authState.loading}
                            onClick={handlePlaceOrder}
                            sx={{
                                fontWeight: 600,
                                borderRadius: 1,
                                py: 1.5,
                                fontSize: 15,
                                bgcolor: '#000',
                                color: '#fff',
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#222' }
                            }}
                        >
                            {authState.loading ? 'Loading...' : authService.isAuthenticated() ? 'Place order' : 'Sign in to place order'}
                        </Button>

                        {!authService.isAuthenticated && !authState.loading && (
                            <Typography color="text.secondary" align="center" sx={{ mt: 2, fontSize: 14 }}>
                                You'll need to sign in to complete your purchase
                            </Typography>
                        )}
                    </Paper>
                </Box>
            </Box>

            {/* Notification Snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Cart;
