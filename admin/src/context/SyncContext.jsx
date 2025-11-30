import React, { createContext, useContext, useState, useCallback } from 'react';

const SyncContext = createContext();

export const useSync = () => useContext(SyncContext);

export const SyncProvider = ({ children }) => {
    const [syncStatus, setSyncStatus] = useState('idle'); // idle | working | success | error

    const runSync = useCallback(async () => {
        try {
            setSyncStatus('working');
            const base = import.meta.env.VITE_BACKEND_URL || '';
            const url = `${base.replace(/\/$/, '')}/api/admin/sync/clover`;
            const res = await fetch(url, { method: 'POST', credentials: 'include' });
            if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
            const json = await res.json();
            console.log('Clover sync result', json);
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 3000);
            return json;
        } catch (err) {
            console.error('Sync error', err);
            setSyncStatus('error');
            setTimeout(() => setSyncStatus('idle'), 4000);
            throw err;
        }
    }, []);

    return (
        <SyncContext.Provider value={{ syncStatus, runSync }}>
            {children}
        </SyncContext.Provider>
    );
};

export default SyncContext;
