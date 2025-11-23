import React, { useState } from 'react';
import { assets } from '../assets/frontend_assets/assets';
import { Link, NavLink } from 'react-router';
import { useShop } from '../context/ShopContex';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const [visible, setVisible] = useState(false);
    const { setShowSearch, getCartCount } = useShop();
    const { logout, user, navigate } = useAuth();
    
    return (
        <div className='bg-white shadow-sm sticky top-0 z-50'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
                {/* Top navigation */}
                <div className='flex items-center justify-between py-4 font-medium'>
                    <Link to='/' className='flex items-center'>
                        <img src={assets.logo} className='h-10' alt="ForeverBuy Logo" />
                    </Link>

                    {/* Desktop navigation */}
                    <ul className='hidden sm:flex gap-8 text-sm font-medium'>
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
                    </ul>

                    {/* Icons - Search, Profile, Cart, Hamburger */}
                    <div className='flex items-center gap-6'>
                        <button
                            onClick={() => {
                                setShowSearch(true);
                                navigate("/collection");
                            }}
                            className='w-5 h-5 flex items-center justify-center hover:opacity-70 transition-opacity'
                            aria-label="Search"
                        >
                            <img className='w-5' src={assets.search_icon} alt="search icon" />
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

                        <Link to="/cart" className="relative hover:opacity-70 transition-opacity">
                            <img className='w-5 min-w-5' src={assets.cart_icon} alt="cart icon" />
                            {getCartCount() > 0 && (
                                <span className='absolute -right-1.5 -bottom-1.5 w-5 h-5 text-center flex items-center justify-center bg-[#FFB81C] text-white rounded-full text-[10px] font-semibold shadow-sm'>
                                    {getCartCount()}
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