import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { backendUrl } from '../config/shopConfig';

const Profile = () => {
  const { user, navigate, checkAuth } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipcode: '',
      country: ''
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      console.log('User data in Profile:', user);
      console.log('createdAt value:', user.createdAt);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: {
          street: user.address?.street || '',
          city: user.address?.city || '',
          state: user.address?.state || '',
          zipcode: user.address?.zipcode || '',
          country: user.address?.country || ''
        }
      });
    }
  }, [user]);

  useEffect(() => {
    console.log('isEditing changed to:', isEditing);
  }, [isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted, isEditing:', isEditing);
    
    if (!isEditing) {
      console.log('Form submitted but not in editing mode, ignoring...');
      return;
    }
    
    setLoading(true);

    try {
      const res = await axios.put(
        `${backendUrl}/api/user/profile`,
        formData,
        { withCredentials: true }
      );

      if (res.data.success) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        // Refresh user data
        await checkAuth();
      } else {
        toast.error(res.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 sm:py-10 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your personal information</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Profile Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
              <div className="flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFB81C] to-[#ff9800] flex items-center justify-center text-4xl font-bold text-white shadow-lg mb-4">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-1">{user.name}</h2>
                <p className="text-sm text-gray-500 mb-4">{user.email}</p>
                
                <div className="w-full pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Member since</div>
                  <div className="text-sm font-medium text-gray-900">
                    {user.createdAt ? (() => {
                      try {
                        const date = new Date(user.createdAt);
                        return isNaN(date.getTime()) ? 'Recently joined' : date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        });
                      } catch (e) {
                        return 'Recently joined';
                      }
                    })() : 'Recently joined'}
                  </div>
                </div>

                <div className="w-full mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Active Account</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate('/orders')}
                  className="w-full mt-6 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  View My Orders
                </button>
              </div>
            </div>
          </div>

          {/* Right Content - Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Form Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Edit Profile clicked, setting isEditing to true');
                      setIsEditing(true);
                    }}
                    className="px-4 py-2 bg-[#FFB81C] text-white rounded-lg text-sm font-medium hover:bg-[#ff9800] transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Profile Form */}
              <form onSubmit={handleSubmit} noValidate>
                <div className="p-6 space-y-6">
                  {/* Basic Information Section */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="md:col-span-2">
                        <label htmlFor="name" className="block text-xs font-medium text-gray-600 mb-1.5">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB81C] focus:border-transparent transition-all ${
                            isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                          }`}
                          required
                        />
                      </div>

                      {/* Email */}
                      <div className="md:col-span-2">
                        <label htmlFor="email" className="block text-xs font-medium text-gray-600 mb-1.5">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={!isEditing}
                          className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB81C] focus:border-transparent transition-all ${
                            isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                          }`}
                          required
                        />
                      </div>

                      {/* Phone */}
                      <div className="md:col-span-2">
                        <label htmlFor="phone" className="block text-xs font-medium text-gray-600 mb-1.5">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setFormData(prev => ({ ...prev, phone: value }));
                          }}
                          disabled={!isEditing}
                          maxLength={10}
                          className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB81C] focus:border-transparent transition-all ${
                            isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                          }`}
                          placeholder="Enter 10-digit phone number"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-900 mb-4">Delivery Address</h4>
                    <div className="space-y-4">
                      {/* Street */}
                      <div>
                        <label htmlFor="street" className="block text-xs font-medium text-gray-600 mb-1.5">
                          Street Address
                        </label>
                        <input
                          type="text"
                          id="street"
                          name="street"
                          value={formData.address.street}
                          onChange={handleAddressChange}
                          disabled={!isEditing}
                          className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB81C] focus:border-transparent transition-all ${
                            isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                          }`}
                          placeholder="Enter your street address"
                        />
                      </div>

                      {/* City and State */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="city" className="block text-xs font-medium text-gray-600 mb-1.5">
                            City
                          </label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            value={formData.address.city}
                            onChange={handleAddressChange}
                            disabled={!isEditing}
                            className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB81C] focus:border-transparent transition-all ${
                              isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                            }`}
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label htmlFor="state" className="block text-xs font-medium text-gray-600 mb-1.5">
                            State
                          </label>
                          <input
                            type="text"
                            id="state"
                            name="state"
                            value={formData.address.state}
                            onChange={handleAddressChange}
                            disabled={!isEditing}
                            className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB81C] focus:border-transparent transition-all ${
                              isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                            }`}
                            placeholder="State"
                          />
                        </div>
                      </div>

                      {/* Zipcode and Country */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="zipcode" className="block text-xs font-medium text-gray-600 mb-1.5">
                            Zipcode
                          </label>
                          <input
                            type="text"
                            id="zipcode"
                            name="zipcode"
                            value={formData.address.zipcode}
                            onChange={handleAddressChange}
                            disabled={!isEditing}
                            className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB81C] focus:border-transparent transition-all ${
                              isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                            }`}
                            placeholder="Zipcode"
                          />
                        </div>
                        <div>
                          <label htmlFor="country" className="block text-xs font-medium text-gray-600 mb-1.5">
                            Country
                          </label>
                          <input
                            type="text"
                            id="country"
                            name="country"
                            value={formData.address.country}
                            onChange={handleAddressChange}
                            disabled={!isEditing}
                            className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FFB81C] focus:border-transparent transition-all ${
                              isEditing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                            }`}
                            placeholder="Country"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Only show when editing */}
                {isEditing && (
                  <div className="flex items-center gap-3 pt-6 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-2.5 bg-[#FFB81C] text-white rounded-lg text-sm font-medium hover:bg-[#ff9800] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      ) : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form to original user data
                        setFormData({
                          name: user.name || '',
                          email: user.email || '',
                          phone: user.phone || '',
                          address: {
                            street: user.address?.street || '',
                            city: user.address?.city || '',
                            state: user.address?.state || '',
                            zipcode: user.address?.zipcode || '',
                            country: user.address?.country || ''
                          }
                        });
                      }}
                      disabled={loading}
                      className="flex-1 px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
