import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useParams, useNavigate } from 'react-router';
import { useShop } from '../context/ShopContex';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import axios from 'axios';
import { assets } from '../assets/frontend_assets/assets';
import RelatedProducts from '../components/RelatedProducts';

function Product() {
    const { productId } = useParams();
    const { products, currency, addToCart, backendUrl, addToWishlist, removeFromWishlist, isInWishlist } = useShop();
    const { user } = useAuth();

    const [productDetails, setProductDetails] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [size, setSize] = useState('');
    const [waitlisted, setWaitlisted] = useState(false);
    const [waitlistLoading, setWaitlistLoading] = useState(false);
    const navigate = useNavigate();
    
    const inWishlist = productDetails ? isInWishlist(productDetails._id) : false;

    useEffect(() => {
        const product = products.find(item => item._id === productId);
        if (product) {
            setProductDetails(product);
            // set first image as selected (support new `images` array)
            const firstImg = (product.images && product.images.length) ? product.images[0] : null;
            setSelectedImage(firstImg);
            // set default size to first variant size if available
            const firstVariantSize = product.variants && product.variants.length ? product.variants[0].size : '';
            setSize(firstVariantSize);
            // If the product object from the list is missing full details (e.g. description), fetch single product
            if (!product.description || product.description.toString().trim() === '') {
                (async () => {
                    try {
                        const res = await axios.get(`${backendUrl}/api/product/single/${productId}`);
                        if (res.data?.success && res.data.product) {
                            const p = res.data.product;
                            setProductDetails(p);
                            setSelectedImage((p.images && p.images.length) ? p.images[0] : firstImg);
                            setSize((p.variants && p.variants.length) ? p.variants[0].size : firstVariantSize);
                        }
                    } catch (err) {
                        console.error('Failed to fetch full product details', err);
                    }
                })();
            }
        } else {
            // fallback: fetch single product from backend
            (async () => {
                try {
                    const res = await axios.get(`${backendUrl}/api/product/single/${productId}`);
                    if (res.data?.success && res.data.product) {
                        const p = res.data.product;
                        setProductDetails(p);
                        setSelectedImage((p.images && p.images.length) ? p.images[0] : null);
                        setSize((p.variants && p.variants.length) ? p.variants[0].size : '');
                    }
                } catch (err) {
                    console.error('Failed to fetch single product', err);
                }
            })();
        }
    }, [productId, products]);

    // If user signed in, check if they've already waitlisted this product
    useEffect(() => {
        const check = async () => {
            if (!productDetails) return;
            try {
                const res = await axios.get(`${backendUrl}/api/user/waitlist/${productDetails._id}`, { withCredentials: true });
                if (res.data?.success) {
                    setWaitlisted(!!res.data.waiting);
                }
            } catch (err) {
                // ignore (not signed in or no waitlist)
            }
        };
        check();
    }, [productDetails, backendUrl]);

    // Ensure we scroll to top when navigating to a product so the product view is visible
    useEffect(() => {
        try {
            window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        } catch (e) {
            // fallback
            window.scrollTo(0, 0);
        }
    }, [productId]);

    // Real-time updates: listen for productUpdated events and refresh stock locally
    useEffect(() => {
        if (!productId) return;
        // connect to backend socket
        const socketUrl = backendUrl || import.meta.env.VITE_BACKEND_URL || '';
        if (!socketUrl) return;
        const socket = io(socketUrl, { withCredentials: true });

        const onUpdate = (data) => {
            try {
                if (!data) return;
                const payloadProduct = data.product || undefined;
                const productIdFromPayload = payloadProduct ? (payloadProduct._id || payloadProduct.productId) : (data.productId || undefined);
                if (!productIdFromPayload) return;
                if (productIdFromPayload === productId) {
                    if (payloadProduct) {
                        // replace/merge full product details
                        setProductDetails(prev => {
                            // preserve selectedImage & size where possible
                            const selImg = prev?.images && prev.images.length && prev.images[0] ? prev.images[0] : prev?.images?.[0];
                            const currentSelected = selectedImage || selImg;
                            return { ...prev, ...payloadProduct };
                        });
                    } else {
                        // fallback: only stock data provided
                        setProductDetails(prev => prev ? ({ ...prev, stockCount: data.stockCount, inStock: data.inStock }) : prev);
                    }
                }
            } catch (err) {
                // ignore
            }
        };

        socket.on('productUpdated', onUpdate);

        return () => {
            socket.off('productUpdated', onUpdate);
            try { socket.disconnect(); } catch (e) { /* ignore */ }
        };
    }, [productId, backendUrl]);
    

    if (!productDetails) return <div>Loading...</div>;

    return (
        <div className='border-t-2 border-gray-300 pt-10 transition-opacity ease-in duration-500 opacity-100'>
            {/* Product Main Section */}
            <div className='flex gap-12 sm:gap-12 flex-col sm:flex-row'>
                {/* Product Images */}
                <div className='flex-1 flex flex-col-reverse gap-3 sm:flex-row'>
                    <div className='flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full'>
                        {(productDetails.images || []).map((img) => (
                            <img
                                onClick={() => setSelectedImage(img)}
                                src={img.url}
                                key={img._id || img.public_id || img.url}
                                alt={img._id || img.public_id}
                                className='w-[24%] sm:w-full sm:mb-3 shrink-0 cursor-pointer'
                            />
                        ))}
                    </div>
                    <div className='w-full sm:w-[80%]'>
                        <img src={selectedImage?.url} alt="Selected product" className='w-full h-auto' />
                    </div>
                </div>

                {/* Product Info */}
                <div className='flex-1'>
                    <h1 className='font-medium text-2xl mt-2'>{productDetails.name}</h1>
                    {/* Star rating removed per request */}
                    <p className='mt-5 text-3xl font-medium'>{currency}{productDetails.price}</p>
                    {productDetails.flavour && <p className='mt-2 text-sm text-gray-600'>Flavour: {productDetails.flavour}</p>}

                    {/* Stock & POS */}
                    <div className='mt-3'>
                        {productDetails.inStock ? (
                            <p className='text-green-600'>In stock: {productDetails.stockCount ?? '—'}</p>
                        ) : (
                            <p className='text-red-600'>Out of stock</p>
                        )}
                    </div>

                    {/* Waitlist handled below together with Add to Cart for proper alignment */}

                    {/* Size Selection - only show when variants exist */}
                    {productDetails.variants && productDetails.variants.length > 0 && (
                        <div className='flex flex-col gap-4 my-8'>
                            <p>Select Variant</p>
                            <div className='flex gap-2'>
                                {productDetails.variants.map((variant, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSize(variant.size)}
                                        className={`border py-2 px-4 bg-gray-100 cursor-pointer ${variant.size === size ? 'border-orange-500' : 'border-gray-300'}`}
                                    >
                                        {variant.size} — {currency}{variant.price}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Button row: Remind + Add to cart (aligned) */}
                    <div className='mt-4 flex flex-col sm:flex-row items-center gap-4'>
                        {Number(productDetails.stockCount) <= 0 && user ? (
                            !waitlisted ? (
                                <button
                                    onClick={async () => {
                                        try {
                                            setWaitlistLoading(true);
                                            await axios.post(`${backendUrl}/api/user/waitlist/${productDetails._id}`, {}, { withCredentials: true });
                                            setWaitlisted(true);
                                            toast.success('We will notify you when this product is back in stock');
                                        } catch (err) {
                                            console.error('Waitlist error', err);
                                            toast.error(err?.response?.data?.message || 'Failed to add to waitlist');
                                        } finally {
                                            setWaitlistLoading(false);
                                        }
                                    }}
                                    className='inline-flex items-center gap-2 bg-[#FFB81C] hover:bg-[#f0a800] text-black font-semibold rounded-md px-4 py-2 text-sm shadow-sm h-10'
                                >
                                    {waitlistLoading ? (
                                        <svg className='animate-spin h-4 w-4 text-black' viewBox='0 0 24 24' fill='none'>
                                            <circle className='opacity-25' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
                                            <path className='opacity-75' fill='currentColor' d='M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z'></path>
                                        </svg>
                                    ) : (
                                        <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor'>
                                            <path d='M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z' />
                                            <path d='M9 18a2 2 0 004 0H9z' />
                                        </svg>
                                    )}
                                    <span>Remind me when in stock</span>
                                </button>
                            ) : (
                                <div className='flex items-center gap-2'>
                                    <span className='inline-flex items-center gap-2 bg-green-600 text-white rounded-full px-3 py-2 text-sm font-medium h-10'>
                                        <svg xmlns='http://www.w3.org/2000/svg' className='h-4 w-4' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
                                            <path fillRule='evenodd' d='M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z' clipRule='evenodd' />
                                        </svg>
                                        <span className='leading-none'>Reminder set</span>
                                    </span>
                                    <button onClick={() => navigate('/notifications')} className='inline-flex items-center justify-center border border-gray-300 text-sm text-gray-700 bg-white rounded-md px-3 py-2 h-10 hover:bg-gray-50 hover:border-gray-400 hover:shadow-sm hover:-translate-y-0.5 transition transform duration-150 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-200'>
                                        Manage
                                    </button>
                                </div>
                            )
                        ) : null}

                        <button onClick={() => addToCart(productDetails._id, size)} className='bg-black text-white px-6 py-2 text-sm active:bg-gray-700 h-10'>ADD TO CART</button>
                        
                        {/* Wishlist button */}
                        <button
                            onClick={() => {
                                if (inWishlist) {
                                    removeFromWishlist(productDetails._id);
                                } else {
                                    addToWishlist(productDetails._id);
                                }
                            }}
                            className={`flex items-center gap-2 px-6 py-2 text-sm h-10 border ${
                                inWishlist 
                                    ? 'bg-red-50 border-red-500 text-red-600 hover:bg-red-100' 
                                    : 'bg-white border-gray-300 text-gray-700 hover:border-black'
                            }`}
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
                            {inWishlist ? 'REMOVE FROM WISHLIST' : 'ADD TO WISHLIST'}
                        </button>
                    </div>

                    <hr className='mt-8 sm:w-3/4 border-gray-300' />

                    <div className='text-sm text-gray-500 mt-5 flex flex-col gap-1'>
                        <p>100% Original product.</p>
                        <p>Cash on delivery is available on this product.</p>
                        <p>Easy return and exchange policy within 7 days.</p>
                    </div>
                </div>
            </div>

            {/* Description Section */}
            <div className='mt-20'>
                <div className='flex'>
                    <b className='border border-gray-300 px-5 py-3 text-sm'>Description</b>
                </div>
                <div className='border border-gray-300 flex flex-col gap-6 p-6 text-sm text-gray-700'>
                    {/* Product Description */}
                    <div>
                        <p className='text-gray-700 leading-relaxed'>
                            {productDetails.description || 'No description available.'}
                        </p>
                    </div>
                    
                    {/* Sweetness Level */}
                    {productDetails.sweetnessLevel !== undefined && (
                        <div>
                            <h3 className='font-bold text-sm text-black mb-2'>Sweetness</h3>
                            <div className='flex items-center gap-0 max-w-2xl'>
                                <div 
                                    className='h-5 bg-yellow-400 flex items-center justify-center text-black font-bold text-xs px-3'
                                    style={{ width: `${(productDetails.sweetnessLevel / 10) * 100}%`, minWidth: '50px' }}
                                >
                                    {productDetails.sweetnessLevel}/10
                                </div>
                                <div 
                                    className='h-5 bg-gray-300 flex-1'
                                    style={{ width: `${100 - (productDetails.sweetnessLevel / 10) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                    
                    {/* Mint Level */}
                    {productDetails.mintLevel !== undefined && (
                        <div>
                            <h3 className='font-bold text-sm text-black mb-2'>Mint Level</h3>
                            {productDetails.mintLevel === 0 ? (
                                <div className='bg-gray-300 text-black px-3 py-1 text-xs font-medium inline-block'>
                                    No Mint
                                </div>
                            ) : (
                                <div className='flex items-center gap-0 max-w-2xl'>
                                    <div 
                                        className='h-5 bg-green-500 flex items-center justify-center text-white font-bold text-xs px-3'
                                        style={{ width: `${(productDetails.mintLevel / 10) * 100}%`, minWidth: '50px' }}
                                    >
                                        {productDetails.mintLevel}/10
                                    </div>
                                    <div 
                                        className='h-5 bg-gray-300 flex-1'
                                        style={{ width: `${100 - (productDetails.mintLevel / 10) * 100}%` }}
                                    ></div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Disclaimer */}
                    <p className='text-xs italic text-gray-700 mt-2'>
                        Sweetness and mint levels are based on personal preference. Your experience may differ.
                    </p>
                </div>
            </div>

            {/* Related Products */}
                    <RelatedProducts product={productDetails} selectedSize={size} />
        </div>
    );
}

export default Product;
