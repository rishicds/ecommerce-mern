import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { assets } from '../assets/frontend_assets/assets';
import { Link, NavLink } from 'react-router';
import { GoBell } from 'react-icons/go';
import { FiEye, FiTrash2 } from 'react-icons/fi';
import { useShop } from '../context/ShopContex';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const [visible, setVisible] = useState(false);
    // Helper: format relative time from timestamp
    const formatTime = (ts) => {
        if (!ts) return '';
        const t = new Date(ts).getTime();
        if (isNaN(t)) return '';
        const diff = Date.now() - t;
        const mins = Math.floor(diff / (1000 * 60));
        if (mins < 1) return 'just now';
        if (mins < 60) return `${mins}m`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        return `${days}d`;
    };
    const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
    const { setShowSearch, getCartCount, backendUrl } = useShop();
    const { logout, user, navigate } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifVisible, setNotifVisible] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [settingsNav, setSettingsNav] = useState(null);
    const [query, setQuery] = useState('');
    const searchTimer = useRef(null);
    const profileRef = useRef(null);

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

    // Close profile dropdown when clicking outside
    useEffect(() => {
        const onDocClick = (e) => {
            if (!profileRef.current) return;
            if (!profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('click', onDocClick);
        return () => document.removeEventListener('click', onDocClick);
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
    
    // Fetch notifications when user signs in and enrich with product data
    useEffect(() => {
        const loadNotifs = async () => {
            if (!user) {
                setNotifications([]);
                setUnreadCount(0);
                return;
            }
            try {
                const res = await axios.get(`${backendUrl}/api/user/notifications`, { withCredentials: true });
                if (res.data?.success) {
                    // backend already enriches notifications with product data
                    setNotifications(res.data.notifications || []);
                    setUnreadCount(res.data.unreadCount || 0);
                }
            } catch (err) {
                console.error('Failed to load notifications', err);
            }
        };
        loadNotifs();
    }, [user, backendUrl]);
    
    const cartCount = getCartCount();

    return (
        <div className='bg-white sticky top-0 z-50'>
            {/* Health Canada warning banner (black & white) - full width */}
            <div className='relative left-1/2 -translate-x-1/2 w-screen bg-black text-white text-center text-[10px] sm:text-sm py-1 border-b border-gray-800'>
                <div className='max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 text-center'>
                    Vaping products contain nicotine, a highly addictive chemical. Health Canada
                </div>
            </div>
            {/* Shipping update banner (red & white) */}
            <div className='relative left-1/2 -translate-x-1/2 w-screen bg-red-900 text-white text-[10px] sm:text-sm py-1 border-b border-red-700'>
                <div className='max-w-7xl mx-auto px-2 sm:px-6 lg:px-8'>
                    <div className='text-center text-[10px] sm:text-sm'>
                        ⚠️ Shipping Update: Canada Post Strike — Alternate Carriers Now in Use. For More Information, <Link to="/shipping-info" className='underline font-semibold text-white'>Click Here</Link>. ⚠️ Due to the strike, some online packages may be delayed. We’re still shipping daily, and if your package is affected, we’ll work with you to make it right.
                    </div>
                </div>
            </div>

            <div className='relative left-1/2 -translate-x-1/2 w-screen bg-white'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-sm text-gray-700 py-2 gap-2'>
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
                                className='w-full max-w-3xl px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#FFB81C]'
                                aria-label='Search products'
                            />
                            
                        </div>
                    </div>

                    {/* Icons - Search, Profile, Cart, Hamburger */}
                    <div className='flex items-center gap-3 sm:gap-6 justify-center'>
                        {/* Mobile search toggle (visible on small screens) */}
                        <button
                            onClick={() => setMobileSearchVisible(v => !v)}
                            className='sm:hidden w-6 h-6 flex items-center justify-center hover:opacity-70 transition-opacity'
                            aria-label='Open search'
                        >
                            <img src={assets.search_icon} alt="search" className='w-5' />
                        </button>

                        <div className='group relative flex items-center'>
                            {/* Notifications bell */}
                            <div className='relative inline-block'>
                                <button
                                    onClick={async () => {
                                        const next = !notifVisible;
                                        setNotifVisible(next);
                                        // refresh when opening
                                        if (next && user) {
                                            try {
                                                const res = await axios.get(`${backendUrl}/api/user/notifications`, { withCredentials: true });
                                                if (res.data?.success) {
                                                    setNotifications(res.data.notifications || []);
                                                    setUnreadCount(res.data.unreadCount || 0);
                                                }
                                            } catch (err) {
                                                console.error('Failed to refresh notifications', err);
                                            }
                                        }
                                    }}
                                    className='w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:opacity-70 transition-opacity'
                                    aria-label='Notifications'
                                >
                                    <GoBell className='text-2xl sm:text-3xl leading-none' aria-hidden='true' />
                                </button>
                                {unreadCount > 0 && (
                                    <span className='absolute -right-1 -top-1 sm:-right-1 sm:-top-1 bg-[#FFB81C] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] sm:text-xs'>
                                        {unreadCount}
                                    </span>
                                )}

                                {notifVisible && (
                                    <div className='absolute right-0 mt-2 w-80 bg-white border rounded shadow-lg z-50'>
                                        <div className='flex items-center justify-between px-3 py-2 border-b'>
                                                <p className='text-sm font-medium'>Notifications</p>
                                                <div className='flex items-center gap-2'>
                                                    <button
                                                        onClick={() => { setNotifVisible(false); navigate('/notifications'); }}
                                                        className='p-1 text-gray-600 hover:bg-gray-50 rounded-md'
                                                        aria-label='View all notifications'
                                                        title='View all notifications'
                                                    >
                                                        <FiEye className='w-4 h-4' aria-hidden='true' />
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await axios.delete(`${backendUrl}/api/user/notifications`, { withCredentials: true });
                                                                setNotifications([]);
                                                                setUnreadCount(0);
                                                            } catch (err) {
                                                                console.error('Failed clear all', err);
                                                            }
                                                        }}
                                                        className='p-1 text-gray-600 hover:bg-gray-50 rounded-md'
                                                        aria-label='Clear all notifications'
                                                        title='Clear all notifications'
                                                    >
                                                        <FiTrash2 className='w-4 h-4' aria-hidden='true' />
                                                    </button>
                                                    <button
                                                        onClick={() => setNotifVisible(false)}
                                                        aria-label='Close notifications'
                                                        title='Close'
                                                        className='inline-flex items-center justify-center w-8 h-8 bg-white border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition ml-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#FFB81C]'
                                                    >
                                                        <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
                                                            <path fillRule='evenodd' d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' clipRule='evenodd' />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        <div className='p-2 max-h-72 overflow-y-auto space-y-2'>
                                            {notifications.length === 0 && <p className='text-sm text-gray-600 text-center py-4'>No notifications</p>}
                                            {notifications.map(n => (
                                                <div key={n._id} className={`flex items-center gap-3 p-3 rounded-lg shadow-sm transition hover:shadow-md ${n.read ? 'bg-white' : 'bg-[#fffaf0]'}`}>
                                                    {n.product?.thumbnail ? (
                                                        <img src={n.product.thumbnail} alt={n.product.name} className='w-14 h-14 object-cover rounded-md border' />
                                                    ) : (
                                                        <div className='w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-500 border'>
                                                            {/* SVG placeholder */}
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <rect x="3" y="3" width="18" height="18" rx="3" stroke="#cbd5e1" strokeWidth="1.5" fill="#f8fafc"/>
                                                                <path d="M7 14l2.5-3 2 2.5L15 9l4 6H7z" fill="#cbd5e1" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    <div className='flex-1 min-w-0'>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    await axios.post(`${backendUrl}/api/user/notifications/${n._id}/read`, {}, { withCredentials: true });
                                                                    setNotifVisible(false);
                                                                    navigate(`/product/${n.productId}`);
                                                                    // refresh list
                                                                    const res = await axios.get(`${backendUrl}/api/user/notifications`, { withCredentials: true });
                                                                    if (res.data?.success) {
                                                                        setNotifications(res.data.notifications || []);
                                                                        setUnreadCount(res.data.unreadCount || 0);
                                                                    }
                                                                } catch (err) {
                                                                    console.error('Failed to mark read', err);
                                                                }
                                                            }}
                                                            className='w-full text-left'
                                                        >
                                                            <div className='text-sm truncate font-semibold text-gray-800'>{n.product?.name || n.message}</div>
                                                            <div className='text-xs text-gray-600 mt-1 line-clamp-2'>{n.message}</div>
                                                            <div className='text-xs text-gray-400 mt-1'>{formatTime(n.createdAt)}</div>
                                                        </button>
                                                    </div>
                                                    <div className='flex items-start gap-2'>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    await axios.delete(`${backendUrl}/api/user/notifications/${n._id}`, { withCredentials: true });
                                                                    // remove locally
                                                                    setNotifications(prev => prev.filter(x => x._id !== n._id));
                                                                    setUnreadCount(prev => prev - (n.read ? 0 : 1));
                                                                } catch (err) {
                                                                    console.error('Failed delete notification', err);
                                                                }
                                                            }}
                                                            className='p-2 text-gray-400 hover:text-red-600 rounded-md bg-white/30 border border-transparent hover:border-red-100'
                                                            aria-label='Delete notification'
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6h18M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className='relative' ref={profileRef}>
                                <button
                                    onClick={() => {
                                        if (!user) return navigate('/login');
                                        setProfileOpen(v => !v);
                                    }}
                                    className='w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:opacity-70 transition-opacity'
                                    aria-label="Profile"
                                >
                                    <img className='w-5 sm:w-6' src={assets.profile_icon} alt="profile icon" />
                                </button>

                                {/* Dropdown - click toggled */}
                                {user && profileOpen && (
                                    <div className='absolute right-0 mt-2 dropdown-menu pt-4 z-50'>
                                        <div className='flex flex-col gap-1 w-40 py-2 bg-white shadow-lg rounded-lg border border-gray-100 overflow-hidden'>
                                            <button className="px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#FFB81C] hover:text-white transition-colors">
                                                My Profile
                                            </button>
                                            <button
                                                onClick={() => { setProfileOpen(false); navigate('/orders'); }}
                                                className="px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#FFB81C] hover:text-white transition-colors"
                                            >
                                                Orders
                                            </button>
                                            <button
                                                onClick={async () => { setProfileOpen(false); await logout(); }}
                                                className="px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-[#FFB81C] hover:text-white transition-colors"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Link
                            to="/cart"
                            aria-label={`Cart with ${cartCount} items`}
                            className={`relative transition-transform duration-200 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 ${cartCount > 0 ? 'hover:scale-105 ring-2 ring-offset-1 ring-[#FFB81C] rounded-full' : 'hover:opacity-80'}`}
                        >
                            <img className='w-6 sm:w-7' src={assets.cart_icon} alt="cart icon" />
                            {cartCount > 0 && (
                                <span className='absolute -right-1 -bottom-1 sm:-right-2 sm:-bottom-2 w-5 h-5 flex items-center justify-center bg-[#FFB81C] text-white rounded-full text-[10px] sm:text-xs font-semibold shadow-md animate-pulse'>
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