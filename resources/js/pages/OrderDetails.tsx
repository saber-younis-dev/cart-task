import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Paper,
    Divider,
    Chip,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const OrderDetails = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();

    // If we have order details from navigation state, use those initially
    const initialOrderDetails = location.state?.orderDetails || null;

    const [order, setOrder] = useState(initialOrderDetails);
    const [loading, setLoading] = useState(!initialOrderDetails);
    const [error, setError] = useState('');
    const [debugInfo, setDebugInfo] = useState(null);

    useEffect(() => {
        // If not authenticated, redirect to login
        if (!authLoading && !isAuthenticated) {
            navigate('/login', {
                state: {
                    returnUrl: `/orders/${id}`,
                    message: 'Please sign in to view your order'
                }
            });
            return;
        }

        // Otherwise, fetch order details (always fetch to ensure we have latest data)
        const fetchOrderDetails = async () => {
            try {
                setLoading(true);
                console.log('Fetching order details for ID:', id);

                const response = await api.get(`/orders/${id}`);
                console.log('API Response:', response.data);

                // Store debug info
                setDebugInfo({
                    responseData: response.data,
                    hasProducts: !!response.data.products,
                    productsLength: response.data.products ? response.data.products.length : 0
                });

                setOrder(response.data);
                setError('');
            } catch (err) {
                console.error('Failed to fetch order details:', err);
                setDebugInfo({
                    error: err.message,
                    response: err.response?.data,
                    status: err.response?.status
                });
                setError(err.response?.data?.message || 'Failed to load order details. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchOrderDetails();
        }
    }, [id, isAuthenticated, authLoading]);

    // Calculate totals
    const calculateSubtotal = () => {
        if (!order?.products || !Array.isArray(order.products)) return 0;
        return order.products.reduce((sum, product) => {
            // Check if product has pivot property (for Laravel relationships)
            if (product.pivot && typeof product.price === 'number') {
                return sum + (product.price * product.pivot.quantity);
            } else if (product.quantity && typeof product.price === 'number') {
                // Alternative format
                return sum + (product.price * product.quantity);
            }
            return sum;
        }, 0);
    };

    const subtotal = calculateSubtotal();
    // Assuming fixed values for tax and shipping for this example
    const shipping = 15;
    const tax = subtotal * 0.1; // 10% tax

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading || authLoading) {
        return (
            <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
                <CircularProgress size={60} />
                <Typography sx={{ mt: 2 }}>Loading order details...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 8 }}>
                <Alert severity="error">{error}</Alert>
                {debugInfo && (
                    <Paper sx={{ p: 2, mt: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                        <Typography variant="subtitle2">Debug Information:</Typography>
                        <pre style={{ overflow: 'auto', maxHeight: '200px' }}>
                            {JSON.stringify(debugInfo, null, 2)}
                        </pre>
                    </Paper>
                )}
                <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/orders')}
                >
                    Back to Orders
                </Button>
            </Container>
        );
    }

    if (!order) {
        return (
            <Container maxWidth="md" sx={{ mt: 8 }}>
                <Alert severity="warning">Order not found</Alert>
                <Button
                    variant="contained"
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/')}
                >
                    Continue Shopping
                </Button>
            </Container>
        );
    }

    // Debug view for Order structure
    if (process.env.NODE_ENV === 'development' || true) { // Always show for now
        return (
            <Container maxWidth="md" sx={{ py: 4 }}>
                <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="subtitle1" gutterBottom>Order ID: {order.id}</Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Created at: {order.created_at ? formatDate(order.created_at) : 'N/A'}
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        Created at: {order.total ? order.total : 'N/A'}
                    </Typography>


                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle1">Complete order data:</Typography>
                        <Paper sx={{ p: 2, mt: 1, bgcolor: '#f5f5f5' }}>
                            <pre style={{ overflow: 'auto', maxHeight: '400px' }}>
                                {order.products && Array.isArray(order.products) && order.products.length > 0 ? (
                                    order.products.map((product) => (
                                        <div key={product.id}>
                                            <strong>{product.name}</strong>: {product.price} x {product.pivot?.quantity || product.quantity}
                                        </div>
                                    ))
                                ) : (
                                    <Alert severity="info">No products found for this order.</Alert>
                                )}
                            </pre>
                        </Paper>
                    </Box>
                </Paper>
            </Container>
        );
    }

    // Regular Order Details View
    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {/* Order Status Banner */}
            <Paper
                sx={{
                    p: 3,
                    mb: 4,
                    borderRadius: 2,
                    bgcolor: '#f1f8e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                }}
            >
                <CheckCircleIcon sx={{ fontSize: 48, color: '#4caf50', mb: 1 }} />
                <Typography variant="h5" fontWeight={600} align="center" gutterBottom>
                    Thank you for your order!
                </Typography>
                <Typography align="center" color="text.secondary">
                    We've received your order and are preparing it for shipping.
                </Typography>
            </Paper>

            {/* Order Header */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Typography variant="h4" fontWeight={700} gutterBottom>
                        Order #{order.id}
                    </Typography>
                    <Typography color="text.secondary" gutterBottom>
                        Placed on {formatDate(order.created_at)}
                    </Typography>
                    <Chip
                        label="Processing"
                        color="primary"
                        sx={{ mt: 1, fontWeight: 500 }}
                    />
                </Grid>
                <Grid item xs={12} md={6} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
                    <Button
                        variant="outlined"
                        sx={{ mr: 2 }}
                        onClick={() => window.print()}
                    >
                        Print Receipt
                    </Button>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/')}
                    >
                        Continue Shopping
                    </Button>
                </Grid>
            </Grid>

            {/* Order Items */}
            <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Order Items
                </Typography>
                {order.products && Array.isArray(order.products) && order.products.length > 0 ? (
                    <TableContainer component={Paper} elevation={0} sx={{ mt: 2 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Product</TableCell>
                                    <TableCell align="right">Price</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {order.products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell component="th" scope="row">
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {product.image && (
                                                    <Box
                                                        component="img"
                                                        src={product.image}
                                                        alt={product.name}
                                                        sx={{
                                                            width: 50,
                                                            height: 50,
                                                            objectFit: 'cover',
                                                            borderRadius: 1,
                                                            mr: 2
                                                        }}
                                                    />
                                                )}
                                                <Typography fontWeight={500}>{product.name}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell align="right">${product.price?.toFixed(2) || 'N/A'}</TableCell>
                                        <TableCell align="right">
                                            {product.pivot?.quantity || product.quantity || 'N/A'}
                                        </TableCell>
                                        <TableCell align="right">
                                            ${(product.price * (product.pivot?.quantity || product.quantity || 0)).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Alert severity="info" sx={{ mt: 2 }}>
                        No products found for this order.
                    </Alert>
                )}
            </Paper>

            {/* Order Summary */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                    Order Summary
                </Typography>
                <Box sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                            {/* Shipping Address */}
                            <Typography fontWeight={600} gutterBottom>
                                Shipping Address
                            </Typography>
                            <Typography>
                                {order.shipping_address || 'Standard Shipping'}
                            </Typography>
                            <Typography color="text.secondary" sx={{ mt: 2 }}>
                                Estimated delivery: 3-5 business days
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            {/* Order Totals */}
                            <Box sx={{
                                p: 2,
                                bgcolor: '#f5f5f5',
                                borderRadius: 2,
                                border: '1px solid #e0e0e0'
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography color="text.secondary">Subtotal</Typography>
                                    <Typography fontWeight={500}>${subtotal.toFixed(2)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography color="text.secondary">Shipping</Typography>
                                    <Typography fontWeight={500}>${shipping.toFixed(2)}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography color="text.secondary">Tax</Typography>
                                    <Typography fontWeight={500}>${tax.toFixed(2)}</Typography>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography fontWeight={700}>Total</Typography>
                                    <Typography fontWeight={700}>
                                        ${order.total?.toFixed(2) || (subtotal + shipping + tax).toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>

            {/* Actions */}
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    variant="outlined"
                    onClick={() => navigate('/orders')}
                >
                    View All Orders
                </Button>
                <Button
                    variant="contained"
                    onClick={() => navigate('/contact', { state: { subject: `Support for Order #${order.id}` } })}
                >
                    Need Help?
                </Button>
            </Box>
        </Container>
    );
};

export default OrderDetails;
