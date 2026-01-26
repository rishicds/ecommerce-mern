import React, { useMemo } from 'react';

// Pool of different reviews to rotate through - matches ReviewsSection
const ALL_REVIEWS = [
    { rating: 5 },
    { rating: 4 },
    { rating: 5 },
    { rating: 5 },
    { rating: 4 },
    { rating: 5 },
    { rating: 3 },
    { rating: 5 },
    { rating: 4 },
    { rating: 5 },
    { rating: 4 },
    { rating: 5 },
    { rating: 3 },
    { rating: 5 },
    { rating: 4 },
    { rating: 5 }
];

// Generate a simple hash from productId to select reviews consistently
const getProductHash = (productId) => {
    if (!productId) return 0;
    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
        hash = ((hash << 5) - hash) + productId.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
};

// Get a subset of reviews for a specific product with varying count (1-4 reviews)
const getProductReviews = (productId) => {
    const hash = getProductHash(productId);
    
    // Determine review count based on product (1-4 reviews)
    const reviewCount = (hash % 4) + 1; // Will be 1, 2, 3, or 4
    
    // Use different parts of the hash to select reviews to avoid overlap
    const selectedReviews = [];
    for (let i = 0; i < reviewCount; i++) {
        const index = (hash + i * 7) % ALL_REVIEWS.length; // Multiply by 7 for better distribution
        selectedReviews.push(ALL_REVIEWS[index]);
    }
    
    return selectedReviews;
};

function ProductRating({ productId }) {
    // Get product-specific reviews based on productId
    const STATIC_REVIEWS = useMemo(() => {
        return getProductReviews(productId);
    }, [productId]);

    const totalReviews = STATIC_REVIEWS.length;
    const averageRating = totalReviews > 0
        ? (STATIC_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : 0;

    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;

    return (
        <div className="flex items-center gap-2 mt-3">
            {/* Star Rating */}
            <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => {
                    if (star <= fullStars) {
                        // Full star
                        return (
                            <svg
                                key={star}
                                className="w-4 h-4 text-yellow-400 fill-current"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                            >
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                        );
                    } else if (star === fullStars + 1 && hasHalfStar) {
                        // Half star
                        return (
                            <svg
                                key={star}
                                className="w-4 h-4 text-yellow-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                            >
                                <defs>
                                    <linearGradient id={`half-${star}`}>
                                        <stop offset="50%" stopColor="currentColor" />
                                        <stop offset="50%" stopColor="#D1D5DB" />
                                    </linearGradient>
                                </defs>
                                <path
                                    fill={`url(#half-${star})`}
                                    d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"
                                />
                            </svg>
                        );
                    } else {
                        // Empty star
                        return (
                            <svg
                                key={star}
                                className="w-4 h-4 text-gray-300 fill-current"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                            >
                                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                        );
                    }
                })}
            </div>

            {/* Review Count */}
            <span className="text-sm text-gray-600">
                {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </span>
        </div>
    );
}

export default ProductRating;
