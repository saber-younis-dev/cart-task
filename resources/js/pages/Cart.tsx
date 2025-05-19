import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { api } from '../services/authService';

// Constants moved outside component to prevent recreations
const CURRENT_DATE = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
});

// Storage keys as constants for better maintainability
const STORAGE_KEYS = {
    CART: 'cart',
    PENDING_CART: 'pendingCart'
};

const Cart = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, loading, user } = useAuth();

    // Initialize cart with proper fallback handling
    const [cartItems, setCartItems] = useState(() => {
        // First check location state
        if (location.state?.cart) {
            return location.state.cart;
        }

        // Then check localStorage with safe parsing
        try {
            const savedCart = localStorage.getItem(STORAGE_KEYS.CART);
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (error) {
            console.error('Error parsing cart from localStorage:', error);
            return [];
        }
    });

    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'info'
    });

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(cartItems));
        } catch (error) {
            console.error('Error saving cart to localStorage:', error);
            setNotification({
                open: true,
                message: 'Failed to save your cart. Please check browser storage settings.',
                severity: 'warning'
            });
        }
    }, [cartItems]);

    // Show welcome notification if redirected from login
    useEffect(() => {
        if (location.state?.fromLogin && isAuthenticated && user) {
            setNotification({
                open: true,
                message: `Welcome back${user.name ? ', ' + user.name : ''}! You can now place your order.`,
                severity: 'success'
            });

            // Clear the fromLogin state to prevent showing the notification again
            navigate(location.pathname, {
                state: { ...location.state, fromLogin: undefined },
                replace: true
            });
        }
    }, [location.state, isAuthenticated, user, navigate]);

    // Memoized cart operations for better performance
    const handleQtyChange = useCallback((id, delta) => {
        setCartItems(prevItems =>
            prevItems
                .map(item =>
                    item.id === id
                        ? { ...item, qty: Math.max(1, item.qty + delta) }
                        : item
                )
                .filter(item => item.qty > 0)
        );
    }, []);

    const handleRemove = useCallback((id) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    }, []);

    // Close notification handler (memoized)
    const handleCloseNotification = useCallback(() => {
        setNotification(prev => ({ ...prev, open: false }));
    }, []);

    // Calculate totals with useMemo for better performance
    const orderSummary = useMemo(() => {
        const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.qty, 0);
        const shipping = cartItems.length > 0 ? 15 : 0; // No shipping if cart is empty
        const tax = subtotal * 0.05; // 5% tax

        return {
            subtotal,
            shipping,
            tax,
            total: subtotal + shipping + tax
        };
    }, [cartItems]);

    // Handle place order button click
    const handlePlaceOrder = useCallback(async () => {
        if (!isAuthenticated) {
            // Show notification
            setNotification({
                open: true,
                message: 'Please log in to complete your order',
                severity: 'info'
            });

            // Save cart to localStorage before redirecting
            try {
                localStorage.setItem(STORAGE_KEYS.PENDING_CART, JSON.stringify(cartItems));
            } catch (error) {
                console.error('Error saving pending cart:', error);
            }

            // Redirect to login page with return URL
            navigate('/login', {
                state: {
                    returnUrl: '/cart',
                    message: 'Please log in to complete your order'
                }
            });
            return;
        }

        // Process order for authenticated user
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
            const response = await api.post('/orders', { products });

            // Handle successful order
            setNotification({
                open: true,
                message: 'Order placed successfully!',
                severity: 'success'
            });

            // Clear the cart after successful order
            setCartItems([]);
            localStorage.removeItem(STORAGE_KEYS.CART);

            // Redirect to order confirmation page
            setTimeout(() => {
                navigate(`/orders/${response.data.id}`, {
                    state: { orderDetails: response.data }
                });
            }, 1500);

        } catch (error) {
            console.error('Order processing failed:', error);

            // Extract error message with better fallbacks
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Failed to process order. Please try again.';

            setNotification({
                open: true,
                message: errorMessage,
                severity: 'error'
            });
        }
    }, [cartItems, isAuthenticated, navigate]);

    // Render empty cart message to avoid repetition
    const renderEmptyCart = () => (
        <Paper
            elevation={0}
            sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: '#f7f8fa'
            }}
        >
            <Typography sx={{ color: 'grey.600', fontSize: 16, mb: 2 }}>
                Your cart is empty
            </Typography>
            <Button
                variant="outlined"
                onClick={() => navigate('/products')}
                sx={{
                    mt: 1,
                    fontWeight: 600,
                    borderColor: '#000',
                    color: '#000',
                    '&:hover': { borderColor: '#222', bgcolor: 'rgba(0,0,0,0.04)' }
                }}
            >
                Continue Shopping
            </Button>
        </Paper>
    );

    // Render cart item to avoid repetition
    const renderCartItem = (item) => (
        <Card
            key={item.id}
            sx={{
                mb: 3,
                p: 2,
                borderRadius: 2,
                boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
                '&:hover': {
                    boxShadow: '0 4px 12px 0 rgba(0,0,0,0.08)'
                }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CardMedia
                    component="img"
                    image={item.image}
                    alt={item.name}
                    sx={{
                        width: 120,
                        height: 120,
                        objectFit: 'cover',
                        borderRadius: 2,
                        mr: 3,
                        bgcolor: '#f7f8fa'
                    }}
                />
                <Box sx={{ flex: 1 }}>
                    <Typography
                        fontWeight={600}
                        sx={{
                            fontSize: 18,
                            mb: 0.5,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {item.name}
                        <Chip
                            label={item.type}
                            size="small"
                            sx={{
                                ml: 1,
                                fontSize: 11,
                                fontWeight: 600,
                                bgcolor: '#f7f8fa'
                            }}
                        />
                    </Typography>
                    <Typography fontWeight={700} sx={{ fontSize: 16, mb: 0.5 }}>
                        ${parseFloat(item.price).toFixed(2)}
                    </Typography>
                    <Typography sx={{ color: 'grey.500', fontSize: 14, mb: 1 }}>
                        Stock: {item.stock}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                            size="small"
                            onClick={() => handleQtyChange(item.id, -1)}
                            aria-label="Decrease quantity"
                        >
                            <RemoveIcon fontSize="small" />
                        </IconButton>
                        <Typography sx={{ minWidth: 24, textAlign: 'center', fontSize: 16 }}>
                            {item.qty}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => handleQtyChange(item.id, 1)}
                            disabled={item.qty >= item.stock}
                            aria-label="Increase quantity"
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
                <IconButton
                    size="large"
                    sx={{ color: 'error.main', ml: 2 }}
                    onClick={() => handleRemove(item.id)}
                    aria-label="Remove item"
                >
                    <DeleteIcon />
                </IconButton>
            </Box>
        </Card>
    );

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 8 }}>
            <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start', flexDirection: { xs: 'column', md: 'row' } }}>
                {/* Left: Cart Items */}
                <Box sx={{ flex: 3, width: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                        <Box>
                            <Box sx={{ color: 'grey.600', fontSize: 14, mb: 2 }}>
                                Home / <b>Cart</b>
                            </Box>
                            <Typography variant="h4" fontWeight={700}>
                                Your cart
                            </Typography>
                        </Box>
                        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                            <Typography sx={{ color: 'grey.600', fontWeight: 600 }}>
                                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                            </Typography>
                        </Box>
                    </Box>

                    {cartItems.length === 0
                        ? renderEmptyCart()
                        : cartItems.map(renderCartItem)
                    }
                </Box>

                {/* Right: Order Summary */}
                <Box sx={{
                    flex: 1,
                    minWidth: 300,
                    width: { xs: '100%', md: 350 },
                    mt: { xs: 4, md: 0 },
                    position: { md: 'sticky' },
                    top: { md: 24 }
                }}>
                    <Paper sx={{
                        p: 3,
                        borderRadius: 2,
                        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)'
                    }}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2
                        }}>
                            <Typography fontWeight={700} fontSize={18}>
                                Order Summary
                            </Typography>
                            <Typography color="primary" fontSize={14}>
                                {CURRENT_DATE}
                            </Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography color="text.secondary" fontSize={15}>
                                Subtotal
                            </Typography>
                            <Typography fontWeight={600} fontSize={15}>
                                ${orderSummary.subtotal.toFixed(2)}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography color="text.secondary" fontSize={15}>
                                Shipping
                            </Typography>
                            <Typography fontWeight={600} fontSize={15}>
                                ${orderSummary.shipping.toFixed(2)}
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography color="text.secondary" fontSize={15}>
                                Tax
                            </Typography>
                            <Typography fontWeight={600} fontSize={15}>
                                ${orderSummary.tax.toFixed(2)}
                            </Typography>
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Typography fontWeight={700} fontSize={16}>
                                Total
                            </Typography>
                            <Typography fontWeight={700} fontSize={16}>
                                ${orderSummary.total.toFixed(2)}
                            </Typography>
                        </Box>

                        <Button
                            variant="contained"
                            fullWidth
                            disabled={cartItems.length === 0 || loading}
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
                            {loading ? 'Loading...' :
                                isAuthenticated ? 'Place order' :
                                    'Sign in to place order'}
                        </Button>

                        {!isAuthenticated && !loading && (
                            <Typography
                                color="text.secondary"
                                align="center"
                                sx={{ mt: 2, fontSize: 14 }}
                            >
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
                    variant="filled"
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default React.memo(Cart);
