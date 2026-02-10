import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { backendUrl } from '../../../frontend/src/config/shopConfig';
import { toast } from 'react-toastify';

const DiscountCodes = () => {
    const [discountCodes, setDiscountCodes] = useState([]);
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingCode, setEditingCode] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        discountType: 'percentage',
        discountValue: '',
        applicableProducts: [],
        startDate: '',
        endDate: '',
        status: 'active',
        maxUsage: ''
    });

    useEffect(() => {
        fetchDiscountCodes();
        fetchProducts();
    }, []);

    const fetchDiscountCodes = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/discount/list`, { withCredentials: true });
            if (response.data.success) {
                setDiscountCodes(response.data.discountCodes);
            }
        } catch (error) {
            console.error('Error fetching discount codes:', error);
            toast.error(error.response?.data?.message || 'Failed to fetch discount codes');
        }
    };

    const fetchProducts = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/product/list`);
            if (response.data.success) {
                setProducts(response.data.products);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProductSelection = (productId) => {
        setFormData(prev => ({
            ...prev,
            applicableProducts: prev.applicableProducts.includes(productId)
                ? prev.applicableProducts.filter(id => id !== productId)
                : [...prev.applicableProducts, productId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                ...formData,
                discountValue: Number(formData.discountValue),
                maxUsage: formData.maxUsage ? Number(formData.maxUsage) : null
            };

            if (editingCode) {
                const response = await axios.put(
                    `${backendUrl}/api/discount/update/${editingCode._id}`,
                    payload,
                    { withCredentials: true }
                );
                if (response.data.success) {
                    toast.success('Discount code updated successfully');
                    fetchDiscountCodes();
                    resetForm();
                }
            } else {
                const response = await axios.post(
                    `${backendUrl}/api/discount/create`,
                    payload,
                    { withCredentials: true }
                );
                if (response.data.success) {
                    toast.success('Discount code created successfully');
                    fetchDiscountCodes();
                    resetForm();
                }
            }
        } catch (error) {
            console.error('Error saving discount code:', error);
            toast.error(error.response?.data?.message || 'Failed to save discount code');
        }
    };

    const handleEdit = (code) => {
        setEditingCode(code);
        setFormData({
            code: code.code,
            discountType: code.discountType,
            discountValue: code.discountValue,
            applicableProducts: code.applicableProducts.map(p => p._id || p),
            startDate: code.startDate ? new Date(code.startDate).toISOString().split('T')[0] : '',
            endDate: code.endDate ? new Date(code.endDate).toISOString().split('T')[0] : '',
            status: code.status,
            maxUsage: code.maxUsage || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this discount code?')) return;

        try {
            const response = await axios.delete(
                `${backendUrl}/api/discount/delete/${id}`,
                { withCredentials: true }
            );
            if (response.data.success) {
                toast.success('Discount code deleted successfully');
                fetchDiscountCodes();
            }
        } catch (error) {
            console.error('Error deleting discount code:', error);
            toast.error(error.response?.data?.message || 'Failed to delete discount code');
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            discountType: 'percentage',
            discountValue: '',
            applicableProducts: [],
            startDate: '',
            endDate: '',
            status: 'active',
            maxUsage: ''
        });
        setEditingCode(null);
        setShowForm(false);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Discount Codes</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-black text-white px-6 py-2 rounded"
                >
                    {showForm ? 'Cancel' : '+ Create Discount Code'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingCode ? 'Edit Discount Code' : 'Create New Discount Code'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Discount Code *</label>
                                <input
                                    type="text"
                                    name="code"
                                    value={formData.code}
                                    onChange={handleInputChange}
                                    placeholder="e.g., WINTER20"
                                    className="w-full px-3 py-2 border rounded uppercase"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Discount Type *</label>
                                <select
                                    name="discountType"
                                    value={formData.discountType}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded"
                                    required
                                >
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="flat">Flat Amount ($)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Discount Value *</label>
                                <input
                                    type="number"
                                    name="discountValue"
                                    value={formData.discountValue}
                                    onChange={handleInputChange}
                                    placeholder={formData.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 100'}
                                    className="w-full px-3 py-2 border rounded"
                                    min="0"
                                    max={formData.discountType === 'percentage' ? '100' : undefined}
                                    required
                                />
                                <span className="text-xs text-gray-500">
                                    {formData.discountType === 'percentage' ? '0-100%' : 'Flat amount in CAD ($)'}
                                </span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Start Date (Optional)</label>
                                <input
                                    type="date"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
                                <input
                                    type="date"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border rounded"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Max Usage (Optional)</label>
                                <input
                                    type="number"
                                    name="maxUsage"
                                    value={formData.maxUsage}
                                    onChange={handleInputChange}
                                    placeholder="Unlimited if empty"
                                    className="w-full px-3 py-2 border rounded"
                                    min="1"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Applicable Products (Leave empty for all products)
                            </label>
                            <div className="border rounded p-3 max-h-64 overflow-y-auto">
                                {products.length === 0 ? (
                                    <p className="text-gray-500">No products available</p>
                                ) : (
                                    <div className="space-y-2">
                                        {products.map(product => (
                                            <label key={product._id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.applicableProducts.includes(product._id)}
                                                    onChange={() => handleProductSelection(product._id)}
                                                    className="w-4 h-4"
                                                />
                                                <img
                                                    src={product.images?.[0]?.url || product.image?.[0]?.url}
                                                    alt={product.name}
                                                    className="w-10 h-10 object-cover rounded"
                                                />
                                                <span className="text-sm">{product.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                className="bg-black text-white px-6 py-2 rounded"
                            >
                                {editingCode ? 'Update Discount Code' : 'Create Discount Code'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-200 px-6 py-2 rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-3 text-left">Code</th>
                            <th className="px-4 py-3 text-left">Type</th>
                            <th className="px-4 py-3 text-left">Value</th>
                            <th className="px-4 py-3 text-left">Products</th>
                            <th className="px-4 py-3 text-left">Valid Period</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Usage</th>
                            <th className="px-4 py-3 text-left">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {discountCodes.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                                    No discount codes yet. Create one to get started!
                                </td>
                            </tr>
                        ) : (
                            discountCodes.map(code => (
                                <tr key={code._id} className="border-t hover:bg-gray-50">
                                    <td className="px-4 py-3 font-semibold">{code.code}</td>
                                    <td className="px-4 py-3 capitalize">{code.discountType}</td>
                                    <td className="px-4 py-3">
                                        {code.discountType === 'percentage' ? `${code.discountValue}%` : `$${code.discountValue}`}
                                    </td>
                                    <td className="px-4 py-3">
                                        {code.applicableProducts.length === 0 ? (
                                            <span className="text-green-600">All Products</span>
                                        ) : (
                                            <span>{code.applicableProducts.length} products</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {code.startDate && (
                                            <div>From: {new Date(code.startDate).toLocaleDateString()}</div>
                                        )}
                                        {code.endDate && (
                                            <div>To: {new Date(code.endDate).toLocaleDateString()}</div>
                                        )}
                                        {!code.startDate && !code.endDate && (
                                            <span className="text-gray-500">No expiry</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs ${code.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {code.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {code.usageCount} {code.maxUsage ? `/ ${code.maxUsage}` : ''}
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleEdit(code)}
                                            className="text-blue-600 hover:underline mr-3"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(code._id)}
                                            className="text-red-600 hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DiscountCodes;
