import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { assets } from '../assets/frontend_assets/assets';
import { Link, NavLink } from 'react-router';
import { useShop } from '../context/ShopContex';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const [visible, setVisible] = useState(false);
    const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
    const { setShowSearch, getCartCount } = useShop();
    const { logout, user, navigate } = useAuth();
    const [settingsNav, setSettingsNav] = useState(null);
    const [query, setQuery] = useState('');
    const searchTimer = useRef(null);

    // Debounced live-search: update URL q param as user types
    const scheduleSearch = (term) => {
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => {
            const t = (term || '').trim();
            // hide any secondary search UI
            setShowSearch(false);
            if (t) navigate(`/collection?q=${encodeURIComponent(t)}`);
            else navigate(`/collection`);
        }, 350);
    };

    const handleSearch = () => {
        const term = (query || '').trim();
        if (!term) return;
        setShowSearch(false);
        navigate(`/collection?q=${encodeURIComponent(term)}`);
    }

    useEffect(() => {
        return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/settings`);
                if (res.data?.success && Array.isArray(res.data.settings?.navbar)) {
                    setSettingsNav(res.data.settings.navbar);
                }
            } catch (err) {
                // keep fallback links
            }
        };
        load();
    }, []);
    
    const cartCount = getCartCount();

    return (
        <div className='bg-white sticky top-0 z-50'>
            {/* Health Canada warning banner (black & white) - full width */}
            <div className='relative left-1/2 -translate-x-1/2 w-screen bg-black text-white text-center text-xs sm:text-sm py-1 border-b border-gray-800'>
                <div className='max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-center'>
                    Vaping products contain nicotine, a highly addictive chemical. Health Canada
                </div>
            </div>
            {/* Shipping update banner (red & white) */}
            <div className='relative left-1/2 -translate-x-1/2 w-screen bg-red-900 text-white text-xs sm:text-sm py-1 border-b border-red-700'>
                <div className='max-w-7xl mx-auto px-2 sm:px-6 lg:px-8'>
                    <div className='text-center text-xs sm:text-sm'>
                        ⚠️ Shipping Update: Canada Post Strike — Alternate Carriers Now in Use. For More Information, <Link to="/shipping-info" className='underline font-semibold text-white'>Click Here</Link>. ⚠️ Due to the strike, some online packages may be delayed. We’re still shipping daily, and if your package is affected, we’ll work with you to make it right.
                    </div>
                </div>
            </div>

            <div className='relative left-1/2 -translate-x-1/2 w-screen bg-white'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='flex flex-col sm:flex-row items-center justify-between text-xs sm:text-sm text-gray-700 py-2 gap-2'>
                        <div className='flex items-center gap-3 text-center sm:text-left'>
                            <span className='leading-none'>🚚</span>
                            <span className='whitespace-normal'>Next Day Delivery Now Available In The Greater Vancouver Area</span>
                        </div>
                        <div className='flex items-center gap-3 justify-center sm:justify-end text-center sm:text-right'>
                            <span className='leading-none'>📦</span>
                            <span className='whitespace-normal'>Free Shipping On Orders Over $125 · $10 Flat Rate Shipping Under $125 within BC</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className='relative left-1/2 -translate-x-1/2 w-screen bg-white'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    {/* Top navigation */}
                    <div className='flex flex-wrap items-center justify-between py-4 font-medium'>
                    <Link to='/' className='flex items-center'>
                        <h1 className='text-xl sm:text-2xl font-bold text-[#FFB81C]'>Knight St. Vape</h1>
                    </Link>

                    {/* Desktop controls (brand + icons). Nav links moved below header */}
                    <div className='hidden sm:flex items-center gap-6 flex-1 ml-6'>
                        <div className='relative w-full min-w-0'>
                            <input
                                type='text'
                                placeholder='Search products...'
                                value={query}
                                onChange={e => { setQuery(e.target.value); scheduleSearch(e.target.value); }}
                                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                                className='w-full max-w-4xl px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#FFB81C]'
                                aria-label='Search products'
                            />
                            
                        </div>
                    </div>

                    {/* Icons - Search, Profile, Cart, Hamburger */}
                    <div className='flex items-center gap-6'>
                        {/* Mobile search toggle (visible on small screens) */}
                        <button
                            onClick={() => setMobileSearchVisible(v => !v)}
                            className='sm:hidden w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity'
                            aria-label='Open search'
                        >
                            <img src={assets.search_icon} alt="search" className='w-5' />
                        </button>

                        <div className='group relative'>
                            <button
                                onClick={() => {
                                    if (!user) navigate("/login");
                                }}
                                className='w-5 h-5 flex items-center justify-center hover:opacity-70 transition-opacity'
                                aria-label="Profile"
                            >
                                <img className='w-5' src={assets.profile_icon} alt="profile icon" />
                            </button>
                            
                            {/* Dropdown */}
                            {user && (
                                <div className='group-hover:block hidden absolute dropdown-menu right-0 pt-4'>
                                    <div className='flex flex-col gap-1 w-40 py-2 bg-white shadow-lg rounded-lg border border-gray-100 overflow-hidden'>
                                        <button className="px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#FFB81C] hover:text-white transition-colors">
                                            My Profile
                                        </button>
                                        <button
                                            onClick={() => navigate("/orders")}
                                            className="px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#FFB81C] hover:text-white transition-colors"
                                        >
                                            Orders
                                        </button>
                                        <button
                                            onClick={async () => await logout()}
                                            className="px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#FFB81C] hover:text-white transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <Link
                            to="/cart"
                            aria-label={`Cart with ${cartCount} items`}
                            className={`relative transition-transform duration-200 flex items-center justify-center ${cartCount > 0 ? 'hover:scale-105 ring-2 ring-offset-1 ring-[#FFB81C] rounded-full' : 'hover:opacity-80'}`}
                        >
                            <img className='w-6 min-w-6' src={assets.cart_icon} alt="cart icon" />
                            {cartCount > 0 && (
                                <span className='absolute -right-2 -bottom-2 w-6 h-6 flex items-center justify-center bg-[#FFB81C] text-white rounded-full text-[10px] sm:text-xs font-semibold shadow-md animate-pulse'>
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        <button
                            onClick={() => setVisible(true)}
                            className='w-5 h-5 flex items-center justify-center sm:hidden hover:opacity-70 transition-opacity'
                            aria-label="Menu"
                        >
                            <img src={assets.menu_icon} alt="menu icon" className='w-5' />
                        </button>
                    </div>
                </div>
                </div>
            </div>

            {/* Mobile search input (collapsible) */}
            {mobileSearchVisible && (
                <div className='sm:hidden px-4 pb-3'>
                    <div className='w-full'>
                        <input
                            type='text'
                            placeholder='Search products...'
                            value={query}
                            onChange={e => { setQuery(e.target.value); scheduleSearch(e.target.value); }}
                            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                            className='w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#FFB81C]'
                            aria-label='Search products'
                        />
                    </div>
                </div>
            )}

            {/* Nav links below header (desktop) */}
            <div className='bg-white'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <nav className='hidden sm:flex items-center justify-center gap-8 text-sm font-medium py-2'>
                        {settingsNav && settingsNav.length > 0 ? (
                            settingsNav.map((link, idx) => (
                                <NavLink key={idx} to={link.href || '/'} className="flex flex-col items-center gap-1 group">
                                    {({ isActive }) => (
                                        <>
                                            <p className={`transition-colors ${isActive ? 'text-[#FFB81C]' : 'text-gray-700 hover:text-[#FFB81C]'}`}>
                                                {link.label}
                                            </p>
                                            <div className={`h-0.5 transition-all duration-300 ${isActive ? 'w-full bg-[#FFB81C]' : 'w-0 bg-[#FFB81C] group-hover:w-full'}`} />
                                        </>
                                    )}
                                </NavLink>
                            ))
                        ) : (
                            <>
                                <NavLink to="/" className="flex flex-col items-center gap-1 group">
                                    {({ isActive }) => (
                                        <>
                                            <p className={`transition-colors ${isActive ? 'text-[#FFB81C]' : 'text-gray-700 hover:text-[#FFB81C]'}`}>
                                                HOME
                                            </p>
                                            <div className={`h-0.5 transition-all duration-300 ${isActive ? 'w-full bg-[#FFB81C]' : 'w-0 bg-[#FFB81C] group-hover:w-full'}`} />
                                        </>
                                    )}
                                </NavLink>
                                <NavLink to="/collection" className="flex flex-col items-center gap-1 group">
                                    {({ isActive }) => (
                                        <>
                                            <p className={`transition-colors ${isActive ? 'text-[#FFB81C]' : 'text-gray-700 hover:text-[#FFB81C]'}`}>
                                                COLLECTION
                                            </p>
                                            <div className={`h-0.5 transition-all duration-300 ${isActive ? 'w-full bg-[#FFB81C]' : 'w-0 bg-[#FFB81C] group-hover:w-full'}`} />
                                        </>
                                    )}
                                </NavLink>
                                <NavLink to="/about" className="flex flex-col items-center gap-1 group">
                                    {({ isActive }) => (
                                        <>
                                            <p className={`transition-colors ${isActive ? 'text-[#FFB81C]' : 'text-gray-700 hover:text-[#FFB81C]'}`}>
                                                ABOUT
                                            </p>
                                            <div className={`h-0.5 transition-all duration-300 ${isActive ? 'w-full bg-[#FFB81C]' : 'w-0 bg-[#FFB81C] group-hover:w-full'}`} />
                                        </>
                                    )}
                                </NavLink>
                                <NavLink to="/contact" className="flex flex-col items-center gap-1 group">
                                    {({ isActive }) => (
                                        <>
                                            <p className={`transition-colors ${isActive ? 'text-[#FFB81C]' : 'text-gray-700 hover:text-[#FFB81C]'}`}>
                                                CONTACT
                                            </p>
                                            <div className={`h-0.5 transition-all duration-300 ${isActive ? 'w-full bg-[#FFB81C]' : 'w-0 bg-[#FFB81C] group-hover:w-full'}`} />
                                        </>
                                    )}
                                </NavLink>
                            </>
                        )}
                    </nav>
                </div>
            </div>

            {/* Sidebar menu for small screens */}
            <div className={`fixed top-0 right-0 bottom-0 z-50 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${visible ? 'translate-x-0' : 'translate-x-full'} w-64`}>
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800">Menu</h2>
                        <button
                            onClick={() => setVisible(false)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            aria-label="Close menu"
                        >
                            <img className='h-4 rotate-180' src={assets.dropdown_icon} alt="close" />
                        </button>
                    </div>
                    
                    <nav className="flex-1 py-4">
                        {settingsNav && settingsNav.length > 0 ? (
                            settingsNav.map((link, idx) => (
                                <NavLink
                                    key={idx}
                                    onClick={() => setVisible(false)}
                                    className={({ isActive }) => 
                                        `block px-6 py-3 text-sm font-medium transition-colors ${
                                            isActive ? 'text-[#FFB81C] bg-[#FFB81C]/10' : 'text-gray-700 hover:bg-gray-50'
                                        }`
                                    }
                                    to={link.href || '/'}
                                >
                                    {link.label}
                                </NavLink>
                            ))
                        ) : (
                            <>
                                <NavLink
                                    onClick={() => setVisible(false)}
                                    className={({ isActive }) => 
                                        `block px-6 py-3 text-sm font-medium transition-colors ${
                                            isActive ? 'text-[#FFB81C] bg-[#FFB81C]/10' : 'text-gray-700 hover:bg-gray-50'
                                        }`
                                    }
                                    to="/"
                                >
                                    HOME
                                </NavLink>
                                <NavLink
                                    onClick={() => setVisible(false)}
                                    className={({ isActive }) => 
                                        `block px-6 py-3 text-sm font-medium transition-colors ${
                                            isActive ? 'text-[#FFB81C] bg-[#FFB81C]/10' : 'text-gray-700 hover:bg-gray-50'
                                        }`
                                    }
                                    to="/collection"
                                >
                                    COLLECTION
                                </NavLink>
                                <NavLink
                                    onClick={() => setVisible(false)}
                                    className={({ isActive }) => 
                                        `block px-6 py-3 text-sm font-medium transition-colors ${
                                            isActive ? 'text-[#FFB81C] bg-[#FFB81C]/10' : 'text-gray-700 hover:bg-gray-50'
                                        }`
                                    }
                                    to="/about"
                                >
                                    ABOUT
                                </NavLink>
                                <NavLink
                                    onClick={() => setVisible(false)}
                                    className={({ isActive }) => 
                                        `block px-6 py-3 text-sm font-medium transition-colors ${
                                            isActive ? 'text-[#FFB81C] bg-[#FFB81C]/10' : 'text-gray-700 hover:bg-gray-50'
                                        }`
                                    }
                                    to="/contact"
                                >
                                    CONTACT
                                </NavLink>
                            </>
                        )}
                    </nav>
                </div>
            </div>

            {/* Overlay */}
            {visible && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 sm:hidden transition-opacity"
                    onClick={() => setVisible(false)}
                />
            )}
        </div>
    );
}

export default Navbar;