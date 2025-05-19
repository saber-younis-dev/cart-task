import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Container,
    TextField,
    IconButton,
    InputAdornment,
    Chip,
    Divider,
    Paper,
    CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Slider from '@mui/material/Slider';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios'; // Make sure to install axios

const initialCart = [];

const Products = () => {
    const [cart, setCart] = useState(initialCart);
    const [quantities, setQuantities] = useState({});
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({
        current_page: 1,
        per_page: 10,
        total: 0,
        last_page: 1
    });
    const [categories, setCategories] = useState([]);

    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [price, setPrice] = useState([0, 300]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [appliedPrice, setAppliedPrice] = useState([0, 300]);
    const [appliedCategories, setAppliedCategories] = useState([]);

    // Fetch distinct categories from API
    const fetchCategories = async () => {
        try {
            const response = await axios.get('/api/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            // Fallback to extracting categories from products if dedicated endpoint fails
            if (products.length > 0) {
                const uniqueCategories = [...new Set(products.map(product => product.category))];
                setCategories(uniqueCategories);
            }
        }
    };

    // Fetch products from API
    useEffect(() => {
        fetchProducts();
    }, [pagination.current_page, search, appliedPrice, appliedCategories]);

    // Fetch categories when component mounts
    useEffect(() => {
        fetchCategories();
    }, []);

    // Alternative: Extract categories from products if no dedicated endpoint
    useEffect(() => {
        if (products.length > 0 && categories.length === 0) {
            const uniqueCategories = [...new Set(products.map(product => product.category))];
            setCategories(uniqueCategories);
        }
    }, [products]);

    // Initialize quantities state when products change
    useEffect(() => {
        if (products.length > 0) {
            const initialQuantities = products.reduce((acc, p) => ({
                ...acc,
                [p.id]: 1
            }), {});

            setQuantities(prev => ({
                ...initialQuantities,
                ...prev // Preserve existing quantity values
            }));
        }
    }, [products]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.current_page,
                name: search || undefined,
                min_price: appliedPrice[0] || undefined,
                max_price: appliedPrice[1] || undefined,
                category: appliedCategories.length ? appliedCategories.join(',') : undefined
            };

            const response = await axios.get('/api/products', { params });
            setProducts(response.data.data);
            setPagination({
                current_page: response.data.current_page,
                per_page: response.data.per_page,
                total: response.data.total,
                last_page: response.data.last_page
            });
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQtyChange = (id, delta) => {
        setQuantities((prev) => {
            const newQty = Math.max(0, (prev[id] || 0) + delta);
            return { ...prev, [id]: newQty };
        });
    };

    const handleCategoryChange = (cat) => {
        setSelectedCategories((prev) =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    // Order summary calculations
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const shipping = 15;
    const tax = 12.5;
    const total = subtotal + shipping + tax;

    // Add to cart logic
    const handleAddToCart = (product) => {
        const qty = quantities[product.id];
        if (qty > 0 && qty <= product.stock) {
            setCart((prev) => {
                const existing = prev.find((item) => item.id === product.id);
                if (existing) {
                    // Prevent exceeding stock
                    const newQty = Math.min(existing.qty + qty, product.stock);
                    return prev.map((item) =>
                        item.id === product.id ? { ...item, qty: newQty } : item
                    );
                } else {
                    return [...prev, { ...product, qty }];
                }
            });
            setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
        }
    };

    // Order summary management
    const handleOrderQtyChange = (id, delta) => {
        setCart((prev) =>
            prev
                .map((item) =>
                    item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item
                )
                .filter((item) => item.qty > 0)
        );
    };

    const handleRemoveFromCart = (id) => {
        setCart((prev) => prev.filter((item) => item.id !== id));
    };

    // Checkout navigation
    const handleCheckout = () => {
        navigate('/cart', { state: { cart } });
    };

    // Pagination handling
    const handlePageChange = (newPage) => {
        if (newPage > 0 && newPage <= pagination.last_page) {
            setPagination(prev => ({
                ...prev,
                current_page: newPage
            }));
        }
    };

    // Apply filters
    const handleApplyFilters = () => {
        setAppliedPrice(price);
        setAppliedCategories([...selectedCategories]);
        setPagination(prev => ({
            ...prev,
            current_page: 1 // Reset to first page on filter change
        }));
        setDrawerOpen(false);
    };

    // Clear filters
    const handleClearFilters = () => {
        setPrice([0, 300]);
        setSelectedCategories([]);
        setAppliedPrice([0, 300]);
        setAppliedCategories([]);
        setPagination(prev => ({
            ...prev,
            current_page: 1 // Reset to first page
        }));
    };

    const filterButtonStyle = {
        position: 'fixed',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 1301,
        bgcolor: 'transparent',
        border: 'none',
        boxShadow: 'none',
        p: 0,
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            {/* Filter Button */}
            <Button
                onClick={() => setDrawerOpen(true)}
                sx={filterButtonStyle}
            >
                <img src="/images/filterico.png" alt="Filter" style={{ width: 48, height: 48 }} />
            </Button>

            {/* Filter Drawer */}
            <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: 300, p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">Filters</Typography>
                        <IconButton onClick={() => setDrawerOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    <Typography fontWeight={600} sx={{ mb: 1 }}>Price</Typography>
                    <Slider
                        value={price}
                        onChange={(_, v) => setPrice(v)}
                        min={0}
                        max={300}
                        valueLabelDisplay="auto"
                        sx={{ mb: 2, color: '#000' }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography>$0</Typography>
                        <Typography>$300</Typography>
                    </Box>
                    <Typography fontWeight={600} sx={{ mb: 1 }}>Category</Typography>
                    <FormGroup>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={selectedCategories.length === 0}
                                    onChange={() => setSelectedCategories([])}
                                    sx={{
                                        color: '#000',
                                        '&.Mui-checked': {
                                            color: '#000',
                                        },
                                    }}
                                />
                            }
                            label="All"
                        />
                        {categories.map((cat) => (
                            <FormControlLabel
                                key={cat}
                                control={
                                    <Checkbox
                                        checked={selectedCategories.includes(cat)}
                                        onChange={() => handleCategoryChange(cat)}
                                        sx={{
                                            color: '#000',
                                            '&.Mui-checked': {
                                                color: '#000',
                                            },
                                        }}
                                    />
                                }
                                label={cat}
                            />
                        ))}
                    </FormGroup>
                    <Button
                        variant="contained"
                        fullWidth
                        sx={{ mt: 4, mb: 1, bgcolor: '#000', color: '#fff', fontWeight: 700, borderRadius: 2, py: 1.2, fontSize: 16, '&:hover': { bgcolor: '#222' } }}
                        onClick={handleApplyFilters}
                    >
                        Apply Filter
                    </Button>
                    <Typography
                        align="center"
                        sx={{ color: 'grey.600', fontSize: 13, mt: 1, cursor: 'pointer' }}
                        onClick={handleClearFilters}
                    >
                        Clear all filters
                    </Typography>
                </Box>
            </Drawer>

            {/* Search Input */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                    placeholder="Search products by name"
                    size="small"
                    fullWidth
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onKeyPress={e => {
                        if (e.key === 'Enter') {
                            // Reset to first page when searching
                            setPagination(prev => ({
                                ...prev,
                                current_page: 1
                            }));
                        }
                    }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: 2, bgcolor: '#fafbfc' },
                    }}
                />
            </Box>

            <Box
                sx={{
                    display: 'flex',
                    gap: 4,
                    alignItems: 'flex-start',
                    flexDirection: { xs: 'column', md: 'row' },
                }}
            >
                {/* Left: Products */}
                <Box sx={{ flex: 3, width: '100%' }}>
                    {/* Breadcrumb */}
                    <Box sx={{ color: 'grey.600', fontSize: 14, mb: 2 }}>
                        Home / <b>Casual</b>
                    </Box>

                    {/* Title and count */}
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                        Casual
                    </Typography>
                    <Typography sx={{ color: 'grey.600', fontSize: 14, mb: 2 }}>
                        Showing {pagination.current_page === 1 ? 1 : ((pagination.current_page - 1) * pagination.per_page) + 1}-
                        {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total} Products
                    </Typography>

                    {/* Loading indicator */}
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {/* Product Grid */}
                    {!loading && (
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: {
                                    xs: '1fr',
                                    sm: '1fr 1fr',
                                    md: 'repeat(3, 1fr)',
                                },
                                gap: 3,
                            }}
                        >
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <Card key={product.id} sx={{ p: 1, borderRadius: 3, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)' }}>
                                        <CardContent sx={{ p: 1 }}>
                                            <Box sx={{ width: '100%', height: 200, mb: 2 }}>
                                                <img
                                                    src={product.image || 'https://placehold.co/300x300?text=Product'}
                                                    alt={product.name}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        borderRadius: 8,
                                                    }}
                                                />
                                            </Box>
                                            <Typography fontWeight={600} sx={{ fontSize: 16, mb: 0.5 }}>
                                                {product.name}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <Typography fontWeight={700} sx={{ fontSize: 15 }}>
                                                    ${product.price}
                                                </Typography>
                                                <Chip label={product.type || product.category} size="small" sx={{ fontSize: 11, fontWeight: 600, bgcolor: '#f7f8fa' }} />
                                            </Box>
                                            <Typography sx={{ color: 'grey.500', fontSize: 13, mb: 1 }}>
                                                Stock: {product.stock}
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <IconButton size="small" onClick={() => handleQtyChange(product.id, -1)}>
                                                    <RemoveIcon fontSize="small" />
                                                </IconButton>
                                                <Typography sx={{ minWidth: 24, textAlign: 'center' }}>{quantities[product.id] || 0}</Typography>
                                                <IconButton size="small" onClick={() => handleQtyChange(product.id, 1)}>
                                                    <AddIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                            <Button
                                                variant="contained"
                                                fullWidth
                                                sx={{ fontWeight: 700, borderRadius: 2, mt: 1, bgcolor: '#000', color: '#fff', '&:hover': { bgcolor: '#222' } }}
                                                onClick={() => handleAddToCart(product)}
                                                disabled={(quantities[product.id] || 0) === 0 || (quantities[product.id] || 0) > product.stock}
                                            >
                                                Add to Cart
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 4 }}>
                                    <Typography>No products found. Try adjusting your filters.</Typography>
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* Pagination */}
                    {!loading && pagination.last_page > 1 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 4 }}>
                            <Button
                                size="small"
                                disabled={pagination.current_page === 1}
                                sx={{ minWidth: 80, bgcolor: '#fafbfc', color: 'grey.500', fontWeight: 600 }}
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                            >
                                &lt; Previous
                            </Button>

                            {/* Pagination buttons */}
                            {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                                // Show pages around current page
                                let pageNum;
                                if (pagination.last_page <= 5) {
                                    pageNum = i + 1;
                                } else if (pagination.current_page <= 3) {
                                    pageNum = i + 1;
                                } else if (pagination.current_page >= pagination.last_page - 2) {
                                    pageNum = pagination.last_page - 4 + i;
                                } else {
                                    pageNum = pagination.current_page - 2 + i;
                                }

                                return (
                                    <Button
                                        key={pageNum}
                                        size="small"
                                        variant={pagination.current_page === pageNum ? 'contained' : 'text'}
                                        sx={{
                                            minWidth: 40,
                                            fontWeight: 700,
                                            bgcolor: pagination.current_page === pageNum ? '#000' : '#fafbfc',
                                            color: pagination.current_page === pageNum ? '#fff' : 'grey.700',
                                            borderRadius: 2,
                                            '&:hover': { bgcolor: pagination.current_page === pageNum ? '#222' : '#f0f0f0' }
                                        }}
                                        onClick={() => handlePageChange(pageNum)}
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}

                            <Button
                                size="small"
                                disabled={pagination.current_page === pagination.last_page}
                                sx={{ minWidth: 80, bgcolor: '#fafbfc', color: 'grey.500', fontWeight: 600 }}
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                            >
                                Next &gt;
                            </Button>
                        </Box>
                    )}
                </Box>

                {/* Right: Order Summary */}
                <Box sx={{ flex: 1, minWidth: 300, width: { xs: '100%', md: 350 }, mt: { xs: 4, md: 0 }, position: 'sticky', top: 100, alignSelf: 'flex-start' }}>
                    <Paper sx={{ p: 3, borderRadius: 3, bgcolor: 'white' }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                            Order Summary
                        </Typography>
                        {cart.length === 0 ? (
                            <Typography align="center" sx={{ color: 'grey.600', fontSize: 15, mb: 2 }}>
                                Your cart is empty.
                            </Typography>
                        ) : (
                            cart.map((item) => (
                                <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography fontSize={15} fontWeight={600} noWrap>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                {item.name}
                                                <IconButton size="small" sx={{ color: 'red' }} onClick={() => handleRemoveFromCart(item.id)}>
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                            <IconButton
                                                size="small"
                                                sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 0.5 }}
                                                onClick={() => handleOrderQtyChange(item.id, -1)}
                                            >
                                                <RemoveIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                            <Typography sx={{ mx: 2, fontSize: 15 }}>{item.qty}</Typography>
                                            <IconButton
                                                size="small"
                                                sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 0.5 }}
                                                onClick={() => handleOrderQtyChange(item.id, 1)}
                                            >
                                                <AddIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                            <Typography fontWeight={600} sx={{ ml: 'auto', fontSize: 15 }}>
                                                ${item.price}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            ))
                        )}
                        <Divider sx={{ my: 2.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography color="text.secondary" fontSize={15}>Subtotal</Typography>
                            <Typography fontWeight={600} fontSize={15}>${subtotal}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography color="text.secondary" fontSize={15}>Shipping</Typography>
                            <Typography fontWeight={600} fontSize={15}>${shipping}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2.5 }}>
                            <Typography color="text.secondary" fontSize={15}>Tax</Typography>
                            <Typography fontWeight={600} fontSize={15}>${tax}</Typography>
                        </Box>
                        <Divider sx={{ mb: 2.5 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                            <Typography fontWeight={700} fontSize={16}>Total</Typography>
                            <Typography fontWeight={700} fontSize={16}>${total.toFixed(2)}</Typography>
                        </Box>
                        <Button
                            variant="contained"
                            fullWidth
                            sx={{ fontWeight: 600, borderRadius: 1, py: 1.5, fontSize: 15, bgcolor: '#000', color: '#fff', textTransform: 'none', '&:hover': { bgcolor: '#222' } }}
                            onClick={handleCheckout}
                            disabled={cart.length === 0}
                        >
                            Proceed to Checkout
                        </Button>
                    </Paper>
                </Box>
            </Box>
        </Container>
    );
};

export default Products;
