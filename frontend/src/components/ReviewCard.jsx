import React, { useState } from 'react';

function ReviewCard({ review, isUserReview = false }) {
    const { displayName, rating, title, content, date, verified } = review;
    const [isExpanded, setIsExpanded] = useState(false);

    // Format date to be more readable
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    return (
        <div className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            {/* Clickable header area */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-left p-6 focus:outline-none"
            >
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        {/* Badges and Date */}
                        <div className="flex items-center gap-2 mb-2">
                            {verified && (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    Verified Purchase
                                </span>
                            )}
                            {isUserReview && (
                                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                    New Review
                                </span>
                            )}
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                    key={star}
                                    className={`w-5 h-5 ${
                                        star <= rating
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300 fill-current'
                                    }`}
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                </svg>
                            ))}
                        </div>

                        {/* Review Title */}
                        {title && (
                            <h5 className="font-semibold text-gray-900 mb-1">{title}</h5>
                        )}

                        {/* Date */}
                        <p className="text-sm text-gray-500">{formatDate(date)}</p>
                    </div>

                    {/* Expand/Collapse Icon */}
                    <div className="ml-4 flex-shrink-0">
                        <svg
                            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                                isExpanded ? 'transform rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </button>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="px-6 pb-6 pt-0">
                    {/* Review Content */}
                    <p className="text-gray-700 leading-relaxed mb-4">{content}</p>

                    {/* Helpful Section (UI only - no functionality) */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <button className="hover:text-gray-900 transition-colors flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                </svg>
                                Helpful
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ReviewCard;
