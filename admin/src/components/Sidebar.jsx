import React from "react";
import { NavLink } from "react-router";
import { assets } from "../assets/admin_assets/assets";
import { useSync } from '../context/SyncContext';

const Sidebar = () => {
    const { syncFromStatus, syncToStatus, runSyncFrom, runSyncTo, autoSyncEnabled, toggleAutoSync } = useSync();

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
                    onClick={runSyncFrom}
                    disabled={syncFromStatus === 'working'}
                    className="w-full flex items-center justify-center gap-2 bg-[#FFB81C] text-white py-2 rounded-md text-sm hover:opacity-95 disabled:opacity-60 mb-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>Sync FROM Clover</span>
                </button>
                <div className="text-xs mb-2 text-center">
                    {syncFromStatus === 'working' && <span className="text-blue-600">Syncing from Clover...</span>}
                    {syncFromStatus === 'success' && <span className="text-green-600">Synced ✓</span>}
                    {syncFromStatus === 'error' && <span className="text-red-600">Sync failed</span>}
                </div>

                <button
                    onClick={runSyncTo}
                    disabled={syncToStatus === 'working'}
                    className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-2 rounded-md text-sm hover:opacity-95 disabled:opacity-60"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    <span>Sync TO Clover</span>
                </button>
                <div className="text-xs mt-2 text-center">
                    {syncToStatus === 'working' && <span className="text-blue-600">Syncing to Clover...</span>}
                    {syncToStatus === 'success' && <span className="text-green-600">Synced ✓</span>}
                    {syncToStatus === 'error' && <span className="text-red-600">Sync failed</span>}
                </div>

                <div className="mt-3 flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                    <span className="text-xs text-gray-700">Auto-sync on login</span>
                    <button
                        onClick={toggleAutoSync}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoSyncEnabled ? 'bg-[#FFB81C]' : 'bg-gray-300'}`}
                        role="switch"
                        aria-checked={autoSyncEnabled}
                    >
                        <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${autoSyncEnabled ? 'translate-x-5' : 'translate-x-1'}`}
                        />
                    </button>
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