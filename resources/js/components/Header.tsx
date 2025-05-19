import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Typography,
    IconButton,
    AppBar,
    Toolbar,
    Menu,
    MenuItem,
    Avatar,
    Badge,
    Divider
} from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';


const Header = () => {
    const [showPromo, setShowPromo] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const { isAuthenticated, user, logout, loading } = useAuth();
    const navigate = useNavigate();

    // Track cart items count from localStorage
    const [cartCount, setCartCount] = useState(0);

    // Load cart count on component mount and when localStorage changes
    useEffect(() => {
        const updateCartCount = () => {
            try {
                const cartData = localStorage.getItem('cart');
                if (cartData) {
                    const cart = JSON.parse(cartData);
                    const count = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
                    setCartCount(count);
                } else {
                    setCartCount(0);
                }
            } catch (error) {
                console.error('Error reading cart from localStorage:', error);
                setCartCount(0);
            }
        };

        // Initial cart count
        updateCartCount();

        // Listen for storage changes (for multi-tab support)
        window.addEventListener('storage', updateCartCount);

        // Custom event for cart updates within the same tab
        window.addEventListener('cartUpdated', updateCartCount);

        return () => {
            window.removeEventListener('storage', updateCartCount);
            window.removeEventListener('cartUpdated', updateCartCount);
        };
    }, []);

    // Handle user menu open
    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    // Handle user menu close
    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // Handle logout
    const handleLogout = async () => {
        try {
            await logout();
            handleMenuClose();
            navigate('/');
            // Optional: Show logout success message
        } catch (error) {
            console.error('Logout error:', error);
            // Optional: Show logout error message
        }
    };

    // Handle login navigation
    const handleLoginClick = () => {
        navigate('/login', {
            state: { returnUrl: window.location.pathname }
        });
    };

    return (
        <Box>
            {/* Promo Bar */}
            {showPromo && (
                <Box sx={{ bgcolor: '#000', color: '#fff', py: 0.5, px: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <Typography sx={{ fontSize: 14, textAlign: 'center', width: '100%' }}>
                        Sign up and get 20% off to your first order. <Button
                        component={RouterLink}
                        to="/register"
                        sx={{
                            color: '#fff',
                            fontWeight: 'bold',
                            textDecoration: 'underline',
                            minWidth: 'auto',
                            p: 0,
                            '&:hover': { bgcolor: 'transparent', opacity: 0.8 }
                        }}
                    >
                        Sign Up Now
                    </Button>
                    </Typography>
                    <IconButton
                        size="small"
                        sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#fff' }}
                        onClick={() => setShowPromo(false)}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            )}

            {/* Main Header */}
            <AppBar position="static" elevation={0} sx={{ bgcolor: '#fff', color: '#000', boxShadow: 'none', borderBottom: '1px solid #f0f0f0' }}>
                <Toolbar sx={{ minHeight: 64, px: { xs: 1, sm: 2 } }}>
                    {/* Logo */}
                    <Box
                        component={RouterLink}
                        to="/"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mr: 3,
                            textDecoration: 'none'
                        }}
                    >
                        <img src="/images/izam-logo.png" alt="izam logo" style={{ width: 113, height: 'auto', objectFit: 'contain', marginRight: 8 }} />
                    </Box>

                    {/* Nav Buttons */}
                    <Button
                        component={RouterLink}
                        to="/products"
                        sx={{
                            fontWeight: 600,
                            color: '#000',
                            mr: 1,
                            px: 2,
                            bgcolor: 'transparent',
                            '&:hover': { bgcolor: '#f5f5f5' }
                        }}
                        disableElevation
                    >
                        Products
                    </Button>

                    <Button
                        component={RouterLink}
                        to={authService.isAuthenticated ? "/sell" : "/login?redirect=/sell"}
                        sx={{
                            fontWeight: 600,
                            color: '#fff',
                            bgcolor: '#000',
                            border: '1px solid #000',
                            px: 2,
                            mr: 2,
                            '&:hover': { bgcolor: '#f5f5f5', color: '#000' }
                        }}
                        disableElevation
                    >
                        Sell Your Product
                    </Button>

                    <Box sx={{ flexGrow: 1 }} />

                    {/* Cart Icon */}
                    <IconButton
                        component={RouterLink}
                        to="/cart"
                        sx={{ mr: 2 }}
                        aria-label="Shopping Cart"
                    >
                        <Badge badgeContent={cartCount} color="error">
                            <ShoppingCartOutlinedIcon />
                        </Badge>
                    </IconButton>

                    {/* Login/User Menu */}
                    {loading ? (
                        // Show nothing while loading auth state
                        <Box sx={{ width: 64 }} />
                    ) : authService.isAuthenticated ? (
                        // User is logged in - show user menu
                        <>
                            <Button
                                onClick={handleMenuOpen}
                                sx={{
                                    color: '#000',
                                    display: 'flex',
                                    alignItems: 'center',
                                    textTransform: 'none'
                                }}
                                startIcon={
                                    user?.avatar ? (
                                        <Avatar
                                            src={user.avatar}
                                            alt={user.name || 'User'}
                                            sx={{ width: 32, height: 32 }}
                                        />
                                    ) : (
                                        <PersonOutlineIcon />
                                    )
                                }
                            >
                                {user?.name ? (
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {user.name.split(' ')[0]} {/* Show only first name */}
                                    </Typography>
                                ) : 'My Account'}
                            </Button>

                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleMenuClose}
                                anchorOrigin={{
                                    vertical: 'bottom',
                                    horizontal: 'right',
                                }}
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                PaperProps={{
                                    elevation: 2,
                                    sx: {
                                        minWidth: 180,
                                        mt: 1
                                    }
                                }}
                            >
                                {user?.name && (
                                    <Box sx={{ px: 2, py: 1 }}>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            {user.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                                            {user.email}
                                        </Typography>
                                    </Box>
                                )}

                                <Divider sx={{ my: 1 }} />

                                {/*<MenuItem*/}
                                {/*    component={RouterLink}*/}
                                {/*    to="/account"*/}
                                {/*    onClick={handleMenuClose}*/}
                                {/*    sx={{ py: 1 }}*/}
                                {/*>*/}
                                {/*    <AccountCircleIcon fontSize="small" sx={{ mr: 1.5 }} />*/}
                                {/*    <Typography variant="body2">My Account</Typography>*/}
                                {/*</MenuItem>*/}

                                <MenuItem
                                    component={RouterLink}
                                    to="/orders"
                                    onClick={handleMenuClose}
                                    sx={{ py: 1 }}
                                >
                                    <ReceiptIcon fontSize="small" sx={{ mr: 1.5 }} />
                                    <Typography variant="body2">My Orders</Typography>
                                </MenuItem>

                                <Divider sx={{ my: 1 }} />

                                <MenuItem
                                    onClick={handleLogout}
                                    sx={{
                                        py: 1,
                                        color: 'error.main'
                                    }}
                                >
                                    <LogoutIcon fontSize="small" sx={{ mr: 1.5 }} />
                                    <Typography variant="body2">Logout</Typography>
                                </MenuItem>
                            </Menu>
                        </>
                    ) : (
                        // User is not logged in - show login button
                        <Button
                            onClick={handleLoginClick}
                            variant="contained"
                            sx={{
                                bgcolor: '#000',
                                color: '#fff',
                                fontWeight: 600,
                                borderRadius: 1,
                                px: 2,
                                boxShadow: 'none',
                                '&:hover': { bgcolor: '#222' }
                            }}
                            disableElevation
                        >
                            Login
                        </Button>
                    )}
                </Toolbar>
            </AppBar>
        </Box>
    );
};

export default Header;
