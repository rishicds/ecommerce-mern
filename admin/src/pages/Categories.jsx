import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const backend = import.meta.env.VITE_BACKEND_URL || '';
      const url = `${backend}/api/category/list`;
      console.log('Fetching categories from:', url);
      const res = await axios.get(url, { withCredentials: true });
      if (res.data.success) setCategories(res.data.categories);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch categories');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Category name is required');
    setLoading(true);
    try {
      const backend = import.meta.env.VITE_BACKEND_URL || '';
      const url = `${backend}/api/category/create`;
      console.log('Creating category POST ->', url, 'payload:', { name });
      const res = await axios.post(url, { name }, { withCredentials: true });
      if (res.data.success) {
        toast.success('Category created');
        setName('');
        fetchCategories();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      const res = await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/category/${id}`, { withCredentials: true });
      if (res.data.success) {
        toast.success('Category deleted');
        fetchCategories();
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete category');
    }
  };

  return (
    <div>
      <h2 className="text-xl mb-4">Categories</h2>

      <form onSubmit={onCreate} className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category Name"
          className="px-3 py-2 border w-full sm:w-auto flex-1"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-black text-white w-full sm:w-auto"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create'}
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="text-left border-b">
              <th className="px-2 py-2 hidden sm:table-cell">Select</th>
              <th className="px-2 py-2">Category Name</th>
              <th className="px-2 py-2 hidden md:table-cell">Category ID</th>
              <th className="px-2 py-2">Items</th>
              <th className="px-2 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat._id} className="border-b">
                <td className="px-2 py-2 hidden sm:table-cell"><input type="checkbox" /></td>
                <td className="px-2 py-2 break-words">{cat.name}</td>
                <td className="px-2 py-2 hidden md:table-cell">{cat.categoryId}</td>
                <td className="px-2 py-2">{cat.items}</td>
                <td className="px-2 py-2">
                  <button
                    onClick={() => onDelete(cat._id)}
                    className="text-red-600 inline-flex items-center justify-center px-3 py-1.5 rounded-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Categories;
