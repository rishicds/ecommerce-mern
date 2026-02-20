import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const SyncContext = createContext();

export const useSync = () => useContext(SyncContext);

export const SyncProvider = ({ children }) => {
    const [syncFromStatus, setSyncFromStatus] = useState('idle'); // idle | working | success | error
    const [syncToStatus, setSyncToStatus] = useState('idle'); // idle | working | success | error
    const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
        const saved = localStorage.getItem('autoSyncEnabled');
        return saved !== null ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem('autoSyncEnabled', JSON.stringify(autoSyncEnabled));
    }, [autoSyncEnabled]);

    const toggleAutoSync = useCallback(() => {
        setAutoSyncEnabled(prev => !prev);
    }, []);

    const runSyncFrom = useCallback(async () => {
        try {
            setSyncFromStatus('working');
            const base = import.meta.env.VITE_BACKEND_URL || '';
            const url = `${base.replace(/\/$/, '')}/api/admin/sync/clover`;
            const token = localStorage.getItem('admin_token');
            const res = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ mode: 'pull' })
            });
            if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
            const json = await res.json();
            console.log('Clover sync FROM result', json);
            setSyncFromStatus('success');
            setTimeout(() => setSyncFromStatus('idle'), 3000);
            return json;
        } catch (err) {
            console.error('Sync FROM error', err);
            setSyncFromStatus('error');
            setTimeout(() => setSyncFromStatus('idle'), 4000);
            throw err;
        }
    }, []);

    const runSyncTo = useCallback(async () => {
        try {
            setSyncToStatus('working');
            const base = import.meta.env.VITE_BACKEND_URL || '';
            const url = `${base.replace(/\/$/, '')}/api/admin/sync/clover`;
            const token = localStorage.getItem('admin_token');
            const res = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ mode: 'push' })
            });
            if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
            const json = await res.json();
            console.log('Clover sync TO result', json);
            setSyncToStatus('success');
            setTimeout(() => setSyncToStatus('idle'), 3000);
            return json;
        } catch (err) {
            console.error('Sync TO error', err);
            setSyncToStatus('error');
            setTimeout(() => setSyncToStatus('idle'), 4000);
            throw err;
        }
    }, []);

    return (
        <SyncContext.Provider value={{ syncFromStatus, syncToStatus, runSyncFrom, runSyncTo, autoSyncEnabled, toggleAutoSync }}>
            {children}
        </SyncContext.Provider>
    );
};

export default SyncContext;
