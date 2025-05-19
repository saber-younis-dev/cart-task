import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Login from '../pages/login';
import Products from '../pages/Products';
import Cart from '../pages/Cart';
import OrderList from '../pages/OrderList';
import OrderDetails from '../pages/OrderDetails';
import Layout from '../components/Layout';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout><Login /></Layout>} />
      <Route path="/login" element={<Layout><Login /></Layout>} />
      <Route path="/products" element={<Layout><Products /></Layout>} />
      <Route path="/cart" element={<Layout><Cart /></Layout>} />
      <Route path="/orders" element={<Layout><OrderList /></Layout>} />
      <Route path="/orders/:id" element={<Layout><OrderDetails /></Layout>} />
    </Routes>
  );
};

export default AppRoutes;
