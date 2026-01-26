import React, { useState } from 'react';

function ReviewForm({ onSubmit, onCancel }) {
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        rating: 0,
        title: '',
        content: ''
    });

    const [errors, setErrors] = useState({});
    const [hoveredRating, setHoveredRating] = useState(0);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleRatingClick = (rating) => {
        setFormData(prev => ({
            ...prev,
            rating
        }));
        if (errors.rating) {
            setErrors(prev => ({
                ...prev,
                rating: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.displayName.trim()) {
            newErrors.displayName = 'Display name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (formData.rating === 0) {
            newErrors.rating = 'Please select a rating';
        }

        if (!formData.title.trim()) {
            newErrors.title = 'Review title is required';
        }

        if (!formData.content.trim()) {
            newErrors.content = 'Review content is required';
        } else if (formData.content.trim().length < 10) {
            newErrors.content = 'Review must be at least 10 characters long';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            onSubmit({
                displayName: formData.displayName.trim(),
                email: formData.email.trim(),
                rating: formData.rating,
                title: formData.title.trim(),
                content: formData.content.trim()
            });

            // Reset form
            setFormData({
                displayName: '',
                email: '',
                rating: 0,
                title: '',
                content: ''
            });
            setErrors({});
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Write a Review</h3>
                <button
                    onClick={onCancel}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                >
                    Cancel review
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Display Name */}
                <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                        Display name <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-2">
                        (displayed publicly like <span className="italic">John Smith</span>)
                    </p>
                    <input
                        type="text"
                        id="displayName"
                        name="displayName"
                        value={formData.displayName}
                        onChange={handleChange}
                        placeholder="Display name"
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black ${
                            errors.displayName ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.displayName && (
                        <p className="text-red-500 text-xs mt-1">{errors.displayName}</p>
                    )}
                </div>

                {/* Email Address */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email address <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Your email address"
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black ${
                            errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                </div>

                {/* Rating */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rating <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => handleRatingClick(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="focus:outline-none transition-transform hover:scale-110"
                            >
                                <svg
                                    className={`w-8 h-8 ${
                                        star <= (hoveredRating || formData.rating)
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300 fill-current'
                                    }`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                </svg>
                            </button>
                        ))}
                    </div>
                    {errors.rating && (
                        <p className="text-red-500 text-xs mt-1">{errors.rating}</p>
                    )}
                </div>

                {/* Review Title */}
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                        Review Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Give your review a title"
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black ${
                            errors.title ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.title && (
                        <p className="text-red-500 text-xs mt-1">{errors.title}</p>
                    )}
                </div>

                {/* Review Content */}
                <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                        Review content <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="content"
                        name="content"
                        value={formData.content}
                        onChange={handleChange}
                        placeholder="Start writing here..."
                        rows="6"
                        className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-black resize-none ${
                            errors.content ? 'border-red-500' : 'border-gray-300'
                        }`}
                    />
                    {errors.content && (
                        <p className="text-red-500 text-xs mt-1">{errors.content}</p>
                    )}
                </div>

                {/* Privacy Notice */}
                <div className="bg-gray-50 p-4 rounded text-xs text-gray-600">
                    <p>
                        <strong>How we use your data:</strong> We'll only contact you about the review you left, and only if necessary. 
                        By submitting your review, you agree to Judge.me's{' '}
                        <a href="#" className="text-blue-600 hover:underline">terms</a>,{' '}
                        <a href="#" className="text-blue-600 hover:underline">privacy</a> and{' '}
                        <a href="#" className="text-blue-600 hover:underline">content</a> policies.
                    </p>
                </div>

                {/* Submit Button */}
                <div>
                    <button
                        type="submit"
                        className="bg-black text-white px-8 py-3 rounded hover:bg-gray-800 transition-colors font-medium"
                    >
                        Submit Review
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ReviewForm;
