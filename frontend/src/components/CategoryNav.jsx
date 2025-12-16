
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import axios from 'axios';

const CategoryNav = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL;
                const response = await axios.get(`${backendUrl}/api/category/list`);
                if (response.data.success) {
                    setCategories(response.data.categories);
                }
            } catch (error) {
                console.error("Failed to fetch categories", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading || categories.length === 0) return null;

    return (
        <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-6 overflow-x-auto py-3 no-scrollbar whitespace-nowrap text-sm font-medium text-gray-700">
                    {categories.map((cat) => (
                        <NavLink
                            key={cat._id}
                            to={`/collection?category=${encodeURIComponent(cat.name)}`}
                            className={({ isActive }) =>
                                `hover:text-[#FFB81C] transition-colors uppercase ${isActive ? 'text-[#FFB81C]' : ''}`
                            }
                        >
                            {cat.name}
                        </NavLink>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CategoryNav;
