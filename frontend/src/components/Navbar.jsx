import React, { useState, useRef, useEffect } from 'react';
import { assets } from '../assets/frontend_assets/assets';
import { Link, NavLink } from 'react-router';
import { useShop } from '../context/ShopContex';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const [visible, setVisible] = useState(false);
    const { setShowSearch, getCartCount } = useShop();
    const { logout, user, navigate } = useAuth();
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
    
    const cartCount = getCartCount();

    return (
        <div className='bg-white shadow-sm sticky top-0 z-50'>
            {/* Health Canada warning banner (black & white) - full width */}
            <div className='relative left-1/2 -translate-x-1/2 w-screen bg-black text-white text-center text-[11px] sm:text-[12px] py-1 border-b border-gray-800'>
                Vaping products contain nicotine, a highly addictive chemical. Health Canada
            </div>
            {/* Shipping update banner (red & white) */}
            <div className='relative left-1/2 -translate-x-1/2 w-screen bg-red-900 text-white text-[11px] sm:text-[12px] py-1 border-b border-red-700'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
                    ⚠️ Shipping Update: Canada Post Strike — Alternate Carriers Now in Use. For More Information, <Link to="/shipping-info" className='underline font-semibold text-white'>Click Here</Link>. ⚠️ Due to the strike, some online packages may be delayed. We’re still shipping daily, and if your package is affected, we’ll work with you to make it right.
                </div>
            </div>
            <div className='relative left-1/2 -translate-x-1/2 w-screen bg-white'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <div className='flex items-center justify-between text-[11px] sm:text-[12px] text-gray-700 py-2'>
                        <div className='flex items-center gap-3'>
                            <span className='leading-none'>🚚</span>
                            <span className='whitespace-nowrap'>Next Day Delivery Now Available In The Greater Vancouver Area</span>
                        </div>
                        <div className='flex items-center gap-3 justify-end'>
                            <span className='leading-none'>📦</span>
                            <span className='whitespace-nowrap'>Free Shipping On Orders Over $125 · $10 Flat Rate Shipping Under $125 within BC</span>
                        </div>
                    </div>
                </div>
            </div>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                {/* Top navigation */}
                <div className='flex items-center justify-between py-4 font-medium'>
                    <Link to='/' className='flex items-center'>
                        <h1 className='text-2xl font-bold text-[#FFB81C]'>Knight St. Vape</h1>
                    </Link>

                    {/* Desktop controls (brand + icons). Nav links moved below header */}
                    <div className='hidden sm:flex items-center gap-6'>
                        <div className='relative'>
                            <input
                                type='text'
                                placeholder='Search products...'
                                value={query}
                                onChange={e => { setQuery(e.target.value); scheduleSearch(e.target.value); }}
                                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                                className='w-64 md:w-[36rem] lg:w-[48rem] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#FFB81C]'
                                aria-label='Search products'
                            />
                            <button
                                onClick={handleSearch}
                                className='absolute right-1 top-1.5 w-6 h-6 flex items-center justify-center'
                                aria-label='Search'
                            >
                                <img className='w-4' src={assets.search_icon} alt="search icon" />
                            </button>
                        </div>
                    </div>

                    {/* Icons - Search, Profile, Cart, Hamburger */}
                    <div className='flex items-center gap-6'>
                        {/* search icon removed from header (kept in input for desktop and separate search UI) */}

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

            {/* Nav links below header (desktop) */}
            <div className='border-t border-gray-100 bg-white'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                    <nav className='hidden sm:flex items-center justify-center gap-8 text-sm font-medium py-2'>
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