import React from "react";
import { NavLink } from "react-router";
import { assets } from "../assets/admin_assets/assets";

const Sidebar = () => {
    const items = [
        { to: '/add', icon: assets.add_icon, label: 'Add Items' },
        { to: '/list', icon: assets.order_icon, label: 'List Items' },
        { to: '/settings', icon: assets.add_icon, label: 'Settings' },
        { to: '/orders', icon: assets.order_icon, label: 'Orders' },
        { to: '/categories', icon: assets.order_icon, label: 'Categories' },
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