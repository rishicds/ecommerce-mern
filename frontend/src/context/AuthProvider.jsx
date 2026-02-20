import axios from "axios";
import { useEffect, useState } from "react"
import { backendUrl } from "../config/shopConfig";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthContext";
import { useNavigate } from "react-router";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const checkAuth = async () => {
        try {
            const res = await axios.get(`${backendUrl}/api/user/dashboard`, { withCredentials: true });
            if (res.data.success) {
                setUser(res.data.user);
            }
        } catch (error) {
            console.log(error);
            setUser(null)
        } finally {
            setLoading(false)
        }
    };

    useEffect(() => {
        const interceptor = axios.interceptors.request.use((config) => {
            const token = localStorage.getItem('user_token');
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
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post(`${backendUrl}/api/user/login`, { email, password }, { withCredentials: true });
            if (res.data.success) {
                if (res.data.token) {
                    localStorage.setItem('user_token', res.data.token);
                }
                await checkAuth();
                navigate("/");
                toast.success(res.data.message);
                return true;
            } else {
                toast.error(res.data.message);
                return false;
            }
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message || error.message);
        }
    }

    const register = async (name, email, password) => {
        try {
            const res = await axios.post(`${backendUrl}/api/user/register`, { name, email, password }, { withCredentials: true });
            if (res.data.success) {
                if (res.data.token) {
                    localStorage.setItem('user_token', res.data.token);
                }
                await checkAuth();
                navigate("/")
                toast.success(res.data.message);
                return true;
            } else {
                toast.error(res.data.message);
                return false;
            }
        } catch (error) {
            console.log(error);
            toast.error(error?.response?.data?.message || error.message);
        }
    }

    const logout = async () => {
        try {
            const res = await axios.post(`${backendUrl}/api/user/logout`, {}, { withCredentials: true });
            if (res.data.success) {
                localStorage.removeItem('user_token');
                setUser(null);
                navigate("/login")
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
        <AuthContext.Provider value={{ user, login, logout, loading, register, navigate, checkAuth }} >
            {children}
        </AuthContext.Provider>
    )
}