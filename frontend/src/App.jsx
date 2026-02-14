import React from "react";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Orders from "./pages/Orders";
import PlaceOrder from "./pages/PlaceOrder";
import Notifications from "./pages/Notifications";
import Verify from "./pages/Verify";

import Profile from "./pages/Profile";
import { Routes, Route, Navigate, useLocation } from "react-router";
import Navbar from "./components/Navbar";
import CategoryNav from "./components/CategoryNav";

import Footer from "./components/Footer";
import SearchBar from "./components/SearchBar";
import CartDrawer from './components/CartDrawer';
import AgeGate from "./components/AgeGate";
import { ToastContainer } from 'react-toastify';
import PublicRoute from "./routes/PublicRoute";
import PrivateRoute from "./routes/PrivateRoute";

import LocationMap from "./components/locationMap";
import FAQ from "./components/faq";
import ProductHighlights from "./components/highlights";
import Hero from "./components/Hero";
import Highlights from "./components/highlights";
import Chatbot from "./components/Chatbot";

const App = () => {
  const location = useLocation();
  React.useEffect(() => {
    try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { window.scrollTo(0, 0); }
  }, [location.pathname]);
  // Pages that should not render the extra sections below the routes
  const standalonePaths = ["/privacy-policy", "/terms-of-service", "/notifications", "/profile"];
  const isStandalone = standalonePaths.includes(location.pathname);
  // Product pages should only show FAQ
  const isProductPage = location.pathname.startsWith("/product/");
  const isCollectionPage = location.pathname === "/collection";

  return (
    <div className="px-4 sm:px-[5%] md:px-[7%] lg:px-[9%]">
      <ToastContainer />
      <Navbar />
      <CategoryNav />

      <AgeGate />
      <SearchBar />
      <CartDrawer />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<Home />} />
        <Route path="/collection" element={<Collection />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />

        <Route path="/product/:productId" element={<Product />} />
        <Route path="/cart" element={<Cart />} />

        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
        <Route path="/place-order" element={<PrivateRoute><PlaceOrder /></PrivateRoute>} />
        <Route path="/verify" element={<PrivateRoute><Verify /></PrivateRoute>} />
      </Routes>
      {!isStandalone && !isProductPage && !isCollectionPage && (
        <>
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