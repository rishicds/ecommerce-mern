import axios from "axios";
import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import { toast } from "react-toastify";
import { useSync } from './SyncContext';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const { runSyncFrom, runSyncTo, autoSyncEnabled } = useSync();

    const checkAuth = async () => {
        try {
            const res = await axios.get(`${backendUrl}/api/admin/dashboard`, { withCredentials: true });
            if (res.data.success) {
                setUser(res.data.admin);
            }
        } catch (err) {
            console.log(err);
            setUser(null);
        } finally {
            setLoading(false);
            // Trigger automatic Clover sync (both FROM and TO) in the background after auth check
            if (autoSyncEnabled) {
                (async () => {
                    try {
                        if (typeof runSyncFrom === 'function') {
                            await runSyncFrom();
                        }
                        if (typeof runSyncTo === 'function') {
                            await runSyncTo();
                        }
                    } catch (e) {
                        console.error('Auto sync failed', e);
                    }
                })();
            }
        }
    };

    useEffect(() => {
        // Add request interceptor to inject admin token
        const interceptor = axios.interceptors.request.use((config) => {
            const token = localStorage.getItem('admin_token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });

        checkAuth();

        return () => {
            axios.interceptors.request.eject(interceptor);
        };
    }, [])

    const login = async (email, password) => {
        try {
            const res = await axios.post(
                `${backendUrl}/api/admin/login`,
                { email, password },
                { withCredentials: true }
            );

            if (res.data.success) {
                if (res.data.token) {
                    localStorage.setItem('admin_token', res.data.token);
                }
                await checkAuth();
                return true;
            } else {
                toast.error(res.data.message);
                return false;
            }
        } catch (err) {
            throw new Error(err?.response?.data?.message || "Login failed");
        }
    };


    const logout = async () => {
        try {
            const res = await axios.post(`${backendUrl}/api/admin/logout`, {}, { withCredentials: true });
            if (res.data.success) {
                localStorage.removeItem('admin_token');
                setUser(null);
                toast.success(res.data.message);
            } else {
                toast.error(res.data.message);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }} >
            {children}
        </AuthContext.Provider>
    );
};