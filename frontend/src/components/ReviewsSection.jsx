import React, { useState, useMemo } from 'react';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';

// Pool of different reviews to rotate through
const ALL_REVIEWS = [
    {
        displayName: 'Sarah Mitchell',
        rating: 5,
        title: 'Absolutely love this product!',
        content: 'This is hands down the best vape I\'ve purchased. The flavor is incredible and lasts much longer than other brands. Highly recommend!',
        date: '2024-12-15',
        verified: true
    },
    {
        displayName: 'James Chen',
        rating: 4,
        title: 'Great quality and fast shipping',
        content: 'Really impressed with the quality. The flavour is smooth and the device feels premium. Only reason for 4 stars instead of 5 is the price point, but you get what you pay for.',
        date: '2024-12-10',
        verified: true
    },
    {
        displayName: 'Emma Wilson',
        rating: 5,
        title: 'My new favorite!',
        content: 'I\'ve tried many different brands and this one is by far my favorite. The flavour is authentic and not artificial tasting at all. Will definitely be ordering again!',
        date: '2024-12-05',
        verified: true
    },
    {
        displayName: 'Michael Rodriguez',
        rating: 5,
        title: 'Exceeded expectations',
        content: 'Was skeptical at first but this product completely exceeded my expectations. Long-lasting, great taste, and excellent customer service from Knight St. Vape.',
        date: '2024-11-28',
        verified: true
    },
    {
        displayName: 'Lisa Thompson',
        rating: 4,
        title: 'Very satisfied',
        content: 'Good product overall. The flavour is nice and it lasts a decent amount of time. Would have given 5 stars if it was slightly cheaper.',
        date: '2024-11-20',
        verified: false
    },
    {
        displayName: 'David Park',
        rating: 5,
        title: 'Perfect for daily use',
        content: 'I use this every day and it never disappoints. Great vapor production and the battery life is excellent. Worth every penny!',
        date: '2024-12-01',
        verified: true
    },
    {
        displayName: 'Jessica Martinez',
        rating: 3,
        title: 'Good but not great',
        content: 'It\'s a decent product. The flavor is okay but I\'ve had better. Does the job though and arrived quickly.',
        date: '2024-11-25',
        verified: false
    },
    {
        displayName: 'Ryan O\'Connor',
        rating: 5,
        title: 'Best value for money',
        content: 'Amazing product at this price point. The quality is top-notch and it lasts way longer than I expected. Will definitely buy again!',
        date: '2024-11-18',
        verified: true
    },
    {
        displayName: 'Sophie Anderson',
        rating: 4,
        title: 'Really good flavour',
        content: 'The taste is fantastic and very smooth. Shipping was quick too. Only minor complaint is the packaging could be better, but the product itself is excellent.',
        date: '2024-11-12',
        verified: true
    },
    {
        displayName: 'Alex Kim',
        rating: 5,
        title: 'Highly recommend!',
        content: 'This is exactly what I was looking for. Great quality, amazing flavor, and excellent service. Knight St. Vape has earned a loyal customer!',
        date: '2024-11-08',
        verified: true
    },
    {
        displayName: 'Taylor Brown',
        rating: 4,
        title: 'Great product',
        content: 'Very happy with my purchase. The quality is excellent and delivery was fast. Would buy again!',
        date: '2024-11-15',
        verified: true
    },
    {
        displayName: 'Jordan Lee',
        rating: 5,
        title: 'Amazing!',
        content: 'Couldn\'t be happier with this! The flavor is spot on and lasts forever. Best purchase I\'ve made!',
        date: '2024-11-22',
        verified: true
    },
    {
        displayName: 'Chris Taylor',
        rating: 3,
        title: 'It\'s okay',
        content: 'Does what it\'s supposed to do. Nothing special but nothing bad either. Fair price for what you get.',
        date: '2024-11-30',
        verified: false
    },
    {
        displayName: 'Morgan White',
        rating: 5,
        title: 'Love it!',
        content: 'This exceeded all my expectations! Great flavor, long-lasting, and excellent quality. Highly recommend to everyone!',
        date: '2024-12-08',
        verified: true
    },
    {
        displayName: 'Casey Green',
        rating: 4,
        title: 'Solid choice',
        content: 'Really good product. The taste is clean and it works great. Only wish it came in more flavors.',
        date: '2024-12-12',
        verified: true
    },
    {
        displayName: 'Jamie Harris',
        rating: 5,
        title: 'Outstanding quality',
        content: 'Premium product all the way. You can tell the quality is there. Will definitely be ordering more!',
        date: '2024-12-18',
        verified: true
    }
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
        selectedReviews.push({
            ...ALL_REVIEWS[index],
            id: `static-${hash}-${i}`
        });
    }
    
    return selectedReviews;
};

function ReviewsSection({ productId }) {
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [showThankYou, setShowThankYou] = useState(false);

    // Get product-specific static reviews based on productId
    const STATIC_REVIEWS = useMemo(() => {
        return getProductReviews(productId);
    }, [productId]);

    // Calculate rating statistics from static reviews only
    const totalReviews = STATIC_REVIEWS.length;
    
    const ratingCounts = {
        5: STATIC_REVIEWS.filter(r => r.rating === 5).length,
        4: STATIC_REVIEWS.filter(r => r.rating === 4).length,
        3: STATIC_REVIEWS.filter(r => r.rating === 3).length,
        2: STATIC_REVIEWS.filter(r => r.rating === 2).length,
        1: STATIC_REVIEWS.filter(r => r.rating === 1).length,
    };

    const averageRating = totalReviews > 0
        ? (STATIC_REVIEWS.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : 0;

    const handleSubmitReview = (reviewData) => {
        // Don't store the review, just show thank you message
        setShowReviewForm(false);
        setShowThankYou(true);
        
        // Hide thank you message after 5 seconds
        setTimeout(() => {
            setShowThankYou(false);
        }, 5000);
    };

    const handleCancelReview = () => {
        setShowReviewForm(false);
    };

    return (
        <div className="mt-20 border-t border-gray-300 pt-10">
            <div className="max-w-4xl">
                <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

                {/* Rating Summary */}
                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <div className="flex flex-col sm:flex-row gap-8">
                    {/* Average Rating */}
                    <div className="flex flex-col items-center justify-center sm:border-r sm:pr-8">
                        <div className="text-5xl font-bold mb-2">{averageRating}</div>
                        <div className="flex items-center mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                    key={star}
                                    className={`w-6 h-6 ${
                                        star <= Math.round(averageRating)
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
                        <div className="text-sm text-gray-600">Based on {totalReviews} reviews</div>
                    </div>

                    {/* Rating Distribution */}
                    <div className="flex-1">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = ratingCounts[rating];
                            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                            
                            return (
                                <div key={rating} className="flex items-center gap-2 mb-2">
                                    <span className="text-sm font-medium w-8">{rating} ★</span>
                                    <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400"
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Write Review Button */}
            {!showReviewForm && (
                <div className="mb-8">
                    {showThankYou && (
                        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                            <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-green-800 font-medium">Thank you for your review!</p>
                                <p className="text-green-600 text-sm">We appreciate your feedback.</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setShowReviewForm(true)}
                        className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800 transition-colors font-medium"
                    >
                        Write a Review
                    </button>
                </div>
            )}

            {/* Review Form */}
            {showReviewForm && (
                <div className="mb-8">
                    <ReviewForm
                        onSubmit={handleSubmitReview}
                        onCancel={handleCancelReview}
                    />
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-6">
                {totalReviews === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">No reviews yet</p>
                        <p className="text-sm mt-2">Be the first to write a review!</p>
                    </div>
                ) : (
                    <>
                        {/* Static reviews only */}
                        {STATIC_REVIEWS.map((review) => (
                            <ReviewCard key={review.id} review={review} isUserReview={false} />
                        ))}
                    </>
                )}
            </div>
        </div>
        </div>
    );
}

export default ReviewsSection;
