import React from "react";
import { NavLink } from "react-router";
import { assets } from "../assets/admin_assets/assets";
import { useSync } from '../context/SyncContext';

const Sidebar = () => {
    const { syncStatus, runSync } = useSync();

    const items = [
        { to: '/add', icon: assets.add_icon, label: 'Add Items' },
        { to: '/list', icon: assets.order_icon, label: 'List Items' },
        { to: '/settings', icon: assets.add_icon, label: 'Settings' },
        { to: '/orders', icon: assets.order_icon, label: 'Orders' },
        { to: '/categories', icon: assets.order_icon, label: 'Categories' },
        { to: '/discount-codes', icon: assets.add_icon, label: 'Discount Codes' },
    ];

    return (
        <aside className="w-64 min-h-screen admin-sidebar p-4">
            <div className="flex items-center gap-3 mb-6">
                <img src={assets.add_icon} alt="logo" className="w-8 h-8" />
                <div>
                    <h2 className="text-lg font-bold text-[#FFB81C]">Admin</h2>
                    <p className="text-xs text-gray-500">Dashboard</p>
                </div>
            </div>

            <div className="mb-4 px-2">
                <button
                    onClick={runSync}
                    className="w-full flex items-center justify-center gap-2 bg-[#FFB81C] text-white py-2 rounded-md text-sm hover:opacity-95"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v6h6M20 20v-6h-6M20 8a8 8 0 11-16 0 8 8 0 0116 0z"></path></svg>
                    <span>Sync Clover</span>
                </button>
                <div className="text-xs mt-2 text-center">
                    {syncStatus === 'working' && <span className="text-blue-600">Syncing...</span>}
                    {syncStatus === 'success' && <span className="text-green-600">Synced ✓</span>}
                    {syncStatus === 'error' && <span className="text-red-600">Sync failed</span>}
                </div>
            </div>

            <nav className="flex flex-col gap-2">
                {items.map(({ to, icon, label }) => (
                    <NavLink key={to} to={to} className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors ${isActive ? 'bg-[#FFB81C]/10 border-l-4 border-[#FFB81C] text-[#111827]' : 'text-gray-700 hover:bg-gray-50'}`
                    }>
                        <img src={icon} alt={label} className="w-5 h-5" />
                        <span className="hidden md:inline">{label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto pt-6">
                <div className="text-xs text-gray-500">Logged in as</div>
                <div className="text-sm font-medium mt-1">Admin User</div>
            </div>
        </aside>
    );
};

export default Sidebar;