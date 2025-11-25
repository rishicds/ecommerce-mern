import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useShop } from '../context/ShopContex';
import axios from 'axios';
import { assets } from '../assets/frontend_assets/assets';
import RelatedProducts from '../components/RelatedProducts';

function Product() {
    const { productId } = useParams();
    const { products, currency, addToCart, backendUrl } = useShop();

    const [productDetails, setProductDetails] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [size, setSize] = useState('');

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
                                className='w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer'
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
                    <div className='flex gap-1 mt-2 items-center'>
                        {[...Array(5)].map((_, i) => (
                            <img
                                key={i}
                                src={i < 4 ? assets.star_icon : assets.star_dull_icon}
                                className="w-3.5"
                                alt={`Star ${i + 1}`}
                            />
                        ))}
                        <p className='pl-2'>(122)</p>
                    </div>
                    <p className='mt-5 text-3xl font-medium'>{currency}{productDetails.price}</p>
                    <p className='mt-2 text-sm text-gray-600'>Flavour: {productDetails.flavour || '—'}</p>
                    <p className='mt-5 text-gray-500 md:w-4/5'>Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis</p>

                    {/* Stock & POS */}
                    <div className='mt-3'>
                        {productDetails.inStock ? (
                            <p className='text-green-600'>In stock: {productDetails.stockCount ?? '—'}</p>
                        ) : (
                            <p className='text-red-600'>Out of stock</p>
                        )}
                        {productDetails.showOnPOS === false && (
                            <p className='text-sm text-gray-500'>Not shown on POS</p>
                        )}
                    </div>

                    {/* Size Selection */}
                    <div className='flex flex-col gap-4 my-8'>
                        <p>Select Variant</p>
                        <div className='flex gap-2'>
                            {(productDetails.variants || []).map((variant, index) => (
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

                    <button onClick={() => addToCart(productDetails._id, size)} className='bg-black text-white px-8 py-3 text-sm active:bg-gray-700'>ADD TO CART</button>

                    <hr className='mt-8 sm:w-3/4 border-gray-300' />

                    <div className='text-sm text-gray-500 mt-5 flex flex-col gap-1'>
                        <p>100% Original product.</p>
                        <p>Cash on delivery is available on this product.</p>
                        <p>Easy return and exchange policy within 7 days.</p>
                    </div>
                </div>
            </div>

            {/* Description & Review Section */}
            <div className='mt-20'>
                <div className='flex'>
                    <b className='border border-gray-300 px-5 py-3 text-sm'>Description</b>
                    <p className='border border-gray-300 px-5 py-3 text-sm'>Review (122)</p>
                </div>
                <div className='border border-gray-300 flex flex-col gap-4 p-6 text-sm text-gray-500'>
                    <p>
                        Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis
                    </p>
                </div>
            </div>

            {/* Related Products */}
                <RelatedProducts category={productDetails.categories?.[0]} subcategory={productDetails.subcategory} />
        </div>
    );
}

export default Product;
