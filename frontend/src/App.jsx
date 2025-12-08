import React from "react";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import About from "./pages/About";
import Contact from "./pages/Contact";
import RefundPolicy from "./pages/RefundPolicy";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import PlaceOrder from "./pages/PlaceOrder";
import ShippingInfo from "./pages/ShippingInfo";
import Notifications from "./pages/Notifications";
import Verify from "./pages/Verify";
import Wishlist from "./pages/Wishlist";
import Profile from "./pages/Profile";
import { Routes, Route, Navigate, useLocation } from "react-router";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import CartDrawer from './components/CartDrawer';
import AgeGate from "./components/AgeGate";
import { ToastContainer } from 'react-toastify';
import PublicRoute from "./routes/PublicRoute";
import PrivateRoute from "./routes/PrivateRoute";
import RecentBlogs from "./components/recentblog";
import LocationMap from "./components/locationMap";
import FAQ from "./components/faq";
import ProductHighlights from "./components/highlights";
import Hero from "./components/Hero";
import Highlights from "./components/highlights";
import Chatbot from "./components/Chatbot";

const App = () => {
  const location = useLocation();
  // Pages that should not render the extra sections below the routes
  const standalonePaths = ["/refund-policy", "/notifications", "/profile"];
  const isStandalone = standalonePaths.includes(location.pathname);

  return (
    <div className="px-4 sm:px-[5%] md:px-[7%] lg:px-[9%]">
      <ToastContainer />
      <Navbar />
      <AgeGate />
      <SearchBar />
      <CartDrawer />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<Home />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/shipping-info" element={<ShippingInfo />} />
        <Route path="/refund-policy" element={<RefundPolicy />} />
        <Route path="/RefundPolicy" element={<Navigate to="/refund-policy" replace />} />
        <Route path="/Refundpolicy" element={<Navigate to="/refund-policy" replace />} />
        <Route path="/refundpolicy" element={<Navigate to="/refund-policy" replace />} />
        <Route path="/product/:productId" element={<Product />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
        <Route path="/place-order" element={<PrivateRoute><PlaceOrder /></PrivateRoute>} />
        <Route path="/verify" element={<PrivateRoute><Verify /></PrivateRoute>} />
      </Routes>
      {!isStandalone && (
        <>
          <RecentBlogs />
          <Highlights />
          <LocationMap />
          <FAQ />
        </>
      )}

      <Chatbot />
      <Footer />
    </div>
  )
}

export default App