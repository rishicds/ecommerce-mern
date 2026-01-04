import React from "react";
import { Link } from "react-router";

const Footer = () => {
    const scrollToTop = () => {
        try { window.scrollTo({ top: 0, behavior: 'auto' }); } catch (e) { window.scrollTo(0, 0); }
    };
    return (
        <footer className="bg-gradient-to-b from-white to-gray-50 mt-20">
            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
                    {/* Brand Section - Takes more space */}
                    <div className="lg:col-span-5">
                        <Link to='/' onClick={scrollToTop} className="inline-block mb-6">

                        </Link>
                        <h3 className="text-2xl font-bold mb-3 text-gray-900">
                            KnightSt. <span className="text-[#FFB81C]">Vape</span>
                        </h3>
                        <p className="text-sm text-gray-600 mb-6 leading-relaxed max-w-sm">
                            Vancouver's premier destination for premium vape products and exceptional customer service.
                        </p>

                        {/* Contact Info with Icons */}
                        <div className="space-y-3">
                            <div className="flex items-start group">
                                <div className="w-10 h-10 rounded-full bg-[#FFB81C]/10 flex items-center justify-center mr-3 group-hover:bg-[#FFB81C]/20 transition-colors">
                                    <svg className="w-5 h-5 text-[#FFB81C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 font-medium mb-0.5">Location</p>
                                    <p className="text-sm text-gray-700">1365 East 41st Vancouver, BC, V5W1R7</p>
                                </div>
                            </div>

                            <div className="flex items-center group">
                                <div className="w-10 h-10 rounded-full bg-[#FFB81C]/10 flex items-center justify-center mr-3 group-hover:bg-[#FFB81C]/20 transition-colors">
                                    <svg className="w-5 h-5 text-[#FFB81C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium mb-0.5">Phone</p>
                                    <a href="tel:6045597833" className="text-sm text-gray-700 hover:text-[#FFB81C] transition-colors font-medium">
                                        6045597833
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-center group">
                                <div className="w-10 h-10 rounded-full bg-[#FFB81C]/10 flex items-center justify-center mr-3 group-hover:bg-[#FFB81C]/20 transition-colors">
                                    <svg className="w-5 h-5 text-[#FFB81C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium mb-0.5">Email</p>
                                    <a href="mailto:Knightstvapeshop@gmail.com" className="text-sm text-gray-700 hover:text-[#FFB81C] transition-colors font-medium">
                                        Knightstvapeshop@gmail.com
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="lg:col-span-3">
                        <h4 className="text-sm font-bold uppercase tracking-wider mb-6 text-gray-900 relative inline-block">
                            Quick Links
                            <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-[#FFB81C]"></span>
                        </h4>
                        <ul className="space-y-3">
                            {[
                                { to: "/", label: "Home" },
                                { to: "/collection", label: "Shop Collection" },
                                { to: "/about", label: "About Us" },
                                { to: "/cart", label: "My Cart" },
                                { to: "/place-order", label: "Checkout" },
                                { to: "/contact", label: "Contact Us" }
                            ].map((link) => (
                                <li key={link.to}>
                                    <Link
                                        to={link.to}
                                        onClick={scrollToTop}
                                        className="text-sm text-gray-600 hover:text-[#FFB81C] hover:translate-x-1 transition-all inline-flex items-center group"
                                    >
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2 group-hover:bg-[#FFB81C] transition-colors"></span>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Policies */}
                    <div className="lg:col-span-2">
                        <h4 className="text-sm font-bold uppercase tracking-wider mb-6 text-gray-900 relative inline-block">
                            Policies
                            <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-[#FFB81C]"></span>
                        </h4>
                        <ul className="space-y-3">
                            {[
                                { to: "/refund-policy", label: "Refund Policy" },
                                { to: "/shipping-info", label: "Shipping Info" },
                                { to: "/wishlist", label: "My Wishlist" }
                            ].map((link) => (
                                <li key={link.to}>
                                    <Link
                                        to={link.to}
                                        onClick={scrollToTop}
                                        className="text-sm text-gray-600 hover:text-[#FFB81C] hover:translate-x-1 transition-all inline-flex items-center group"
                                    >
                                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2 group-hover:bg-[#FFB81C] transition-colors"></span>
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Newsletter/CTA Section */}
                    <div className="lg:col-span-2">
                        <h4 className="text-sm font-bold uppercase tracking-wider mb-6 text-gray-900 relative inline-block">
                            Stay Connected
                            <span className="absolute -bottom-2 left-0 w-12 h-0.5 bg-[#FFB81C]"></span>
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                            Follow us for updates and exclusive offers
                        </p>
                        <div className="flex gap-3">
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full bg-gray-900 hover:bg-[#FFB81C] flex items-center justify-center transition-all hover:scale-110"
                                aria-label="Instagram"
                            >
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                </svg>
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full bg-gray-900 hover:bg-[#FFB81C] flex items-center justify-center transition-all hover:scale-110"
                                aria-label="Facebook"
                            >
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar with Style */}
            <div className="border-t border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-gray-600">
                            © {new Date().getFullYear()} <span className="font-semibold text-gray-900">Knight St. Vape</span>. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                Online Now
                            </span>
                            <span>|</span>
                            <span>Made with 💛 in Vancouver</span>
                            <span>|</span>
                            <span>Built by <a href="https://slashbyte.org" target="_blank" rel="noopener noreferrer" className="text-[#FFB81C] hover:underline font-medium">SlashByte</a></span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;