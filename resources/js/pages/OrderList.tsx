import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Container,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    CircularProgress,
    Alert,
    Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const OrderList = () => {
    const navigate = useNavigate();
    const { isAuthenticated, loading: authLoading } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // If not authenticated, redirect to login
        if (!authLoading && !isAuthenticated) {
            navigate('/login', {
                state: {
                    returnUrl: '/orders',
                    message: 'Please sign in to view your orders'
                }
            });
            return;
        }

        // Fetch orders
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await api.get('/orders');

                // Make sure we're working with an array
                const ordersArray = Array.isArray(response.data) ? response.data : [];
                setOrders(ordersArray);
                setError('');
            } catch (err) {
                console.error('Failed to fetch orders:', err);
                setError(err.response?.data?.message || 'Failed to load orders. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchOrders();
        }
    }, [isAuthenticated, authLoading, navigate]);

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            console.error('Date formatting error:', e);
            return 'Invalid date';
        }
    };

    // Format currency
    const formatCurrency = (value) => {
        if (value === undefined || value === null) return '$0.00';

        // Handle string values by converting to numbers
        const numValue = typeof value === 'string' ? parseFloat(value) : value;

        // Check if it's a valid number
        if (isNaN(numValue)) return '$0.00';

        try {
            return `$${numValue.toFixed(2)}`;
        } catch (e) {
            console.error('Currency formatting error:', e);
            return '$0.00';
        }
    };

    if (loading || authLoading) {
        return (
            <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
                <CircularProgress size={60} />
                <Typography sx={{ mt: 2 }}>Loading your orders...</Typography>
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 8 }}>
                <Alert severity="error">{error}</Alert>
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

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
                Your Orders
            </Typography>

            {orders.length === 0 ? (
                <Paper sx={{ p: 4, mt: 3, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                        You haven't placed any orders yet
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => navigate('/')}
                        sx={{ mt: 2 }}
                    >
                        Start Shopping
                    </Button>
                </Paper>
            ) : (
                <TableContainer component={Paper} sx={{ mt: 3 }}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Order ID</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell align="right">Total</TableCell>
                                <TableCell align="right">Action</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id || `order-${Math.random()}`}>
                                    <TableCell component="th" scope="row">
                                        #{order.id || 'N/A'}
                                    </TableCell>
                                    <TableCell>{formatDate(order.created_at)}</TableCell>
                                    <TableCell align="right">{formatCurrency(order.total)}</TableCell>
                                    <TableCell align="right">
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => navigate(`/orders/${order.id}`, {
                                                state: { orderDetails: order }
                                            })}
                                        >
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Box sx={{ mt: 4, textAlign: 'right' }}>
                <Button
                    variant="contained"
                    onClick={() => navigate('/')}
                >
                    Continue Shopping
                </Button>
            </Box>
        </Container>
    );
};

export default OrderList;
