import React from "react";
import { useShop } from '../context/ShopContex';
import { Link } from "react-router";

const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const ProductItem = ({ id, images, name, price, highlight = '' }) => {
    const { currency, addToWishlist, removeFromWishlist, isInWishlist } = useShop();
    const inWishlist = isInWishlist(id);

    // Defensive image selection: prefer images[0].url, fall back to empty string
    const imageUrl = images && images.length ? (images[0].url || '') : '';

    const handleWishlistClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (inWishlist) {
            removeFromWishlist(id);
        } else {
            addToWishlist(id);
        }
    };

    // Render name with highlighted query matches (case-insensitive)
    const renderHighlightedName = () => {
        if (!highlight) return name;
        try {
            const q = String(highlight).trim();
            if (!q) return name;
            const escaped = escapeRegExp(q);
            const regex = new RegExp(escaped, 'gi');
            const parts = [];
            let lastIndex = 0;
            let match;
            while ((match = regex.exec(name)) !== null) {
                const start = match.index;
                if (start > lastIndex) {
                    parts.push(name.slice(lastIndex, start));
                }
                parts.push(<span key={start} className='bg-[#FFEBB5] px-0.5 rounded'>{match[0]}</span>);
                lastIndex = regex.lastIndex;
            }
            if (lastIndex < name.length) parts.push(name.slice(lastIndex));
            if (parts.length === 0) return name;
            return parts;
        } catch (e) {
            return name;
        }
    };

    return (
        <Link className="text-gray-700 cursor-pointer relative group" to={`/product/${id}`}>
            <div className="overflow-hidden relative">
                <img
                    className="hover:scale-110 transition ease-in-out"
                    src={imageUrl}
                    alt={name || 'product'}
                    onError={(e) => { e.currentTarget.src = ''; }}
                />
                {/* Wishlist button */}
                <button
                    onClick={handleWishlistClick}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
                    title={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill={inWishlist ? "red" : "none"}
                        viewBox="0 0 24 24"
                        stroke={inWishlist ? "red" : "currentColor"}
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                    </svg>
                </button>
                <p className="text-sm pt-3 pb-1">{renderHighlightedName()}</p>
                <p className="text-sm font-medium">{currency}{price}</p>
            </div>
        </Link>
    )
};

export default ProductItem;