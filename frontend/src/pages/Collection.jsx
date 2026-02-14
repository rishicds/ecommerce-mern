import React, { useEffect, useReducer, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import { useShop } from '../context/ShopContex';
import { assets } from '../assets/frontend_assets/assets';
import Title from '../components/Title';
import ProductItem from '../components/ProductItem';

// ---------- State Management ----------
const initialState = {
    category: [],
    subCategory: [],
    brand: [],
    flavour: [],
    flavourType: [],
    priceRange: [],
    nicotine: [],
    options: [],
    type: [],
    showFilter: false,
    filterProducts: [],
    sortOrder: 'relevant',
    currentPage: 1,
    itemsPerPage: 100, // Add itemsPerPage state
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'TOGGLE_CATEGORY':
            return { ...state, category: toggleItem(state.category, action.payload) };
        case 'SET_CATEGORY':
            return { ...state, category: action.payload };
        // Legacy category toggles removed/merged
        case 'TOGGLE_SUBCATEGORY':
            return { ...state, subCategory: toggleItem(state.subCategory, action.payload) };
        case 'TOGGLE_BRAND':
            return { ...state, brand: toggleItem(state.brand, action.payload) };
        case 'TOGGLE_FLAVOUR':
            return { ...state, flavour: toggleItem(state.flavour, action.payload) };
        case 'TOGGLE_FLAVOURTYPE':
            return { ...state, flavourType: toggleItem(state.flavourType, action.payload) };
        case 'TOGGLE_PRICE':
            return { ...state, priceRange: toggleItem(state.priceRange, action.payload) };
        case 'TOGGLE_NICOTINE':
            return { ...state, nicotine: toggleItem(state.nicotine, action.payload) };
        case 'TOGGLE_OPTIONS':
            return { ...state, options: toggleItem(state.options, action.payload) };
        case 'TOGGLE_TYPE':
            return { ...state, type: toggleItem(state.type, action.payload) };
        case 'SET_FILTER_PRODUCTS':
            return { ...state, filterProducts: action.payload };
        case 'SET_SHOW_FILTER':
            return { ...state, showFilter: action.payload };
        case 'SET_SORT_ORDER':
            return { ...state, sortOrder: action.payload };
        case 'SET_CURRENT_PAGE':
            return { ...state, currentPage: action.payload };
        case 'SET_ITEMS_PER_PAGE':
            return { ...state, itemsPerPage: Number(action.payload), currentPage: 1 }; // Reset to page 1
        default:
            return state;
    }
};

const toggleItem = (list, value) =>
    list.includes(value) ? list.filter(item => item !== value) : [...list, value];

const sortProducts = (productsToSort, sortOrder) => {
    return [...productsToSort].sort((a, b) => {
        // Prioritize products with images
        const aHasImage = a.image && a.image.length > 0;
        const bHasImage = b.image && b.image.length > 0;

        if (aHasImage && !bHasImage) return -1;
        if (!aHasImage && bHasImage) return 1;

        // Secondary sort based on user selection
        switch (sortOrder) {
            case 'low-high':
                return (a.price) - (b.price);
            case 'high-low':
                return (b.price) - (a.price);
            case 'relevant':
            default:
                return 0;
        }
    });
};

// Helper to flatten products into variants
const flattenProducts = (products) => {
    const flattened = [];
    products.forEach(product => {
        if (product.variants && product.variants.length > 0) {
            product.variants.forEach(variant => {
                // Ensure unique key for React
                const uniqueId = `${product._id}-${variant.size || variant.sku || Math.random()}`;

                // Prioritize variant image, fallback to product images
                const variantImage = variant.image
                    ? [{ url: variant.image }]
                    : (product.images || (product.image ? [product.image] : []));

                // Image check removed to allow products without images
                // if (!variantImage || variantImage.length === 0) return;

                flattened.push({
                    ...product,
                    _id: product._id, // Keep original product ID for linking
                    originalId: product._id,
                    uniqueId: uniqueId,
                    name: `${product.name} - ${variant.size || variant.flavour || ''}`.replace(/ - $/, ''), // Append variant info
                    price: variant.price || product.price,
                    // IMPORTANT: Override 'images' so ProductItem uses the variant image
                    images: variantImage,
                    image: variantImage,
                    // Add specific variant data if needed for filtering
                    variantSize: variant.size,
                    variantFlavour: variant.flavour
                });
            });
        } else {
            // No variants, just push the product itself
            const prodImage = product.images || (product.image ? [product.image] : []);

            flattened.push({
                ...product,
                uniqueId: product._id,
                image: prodImage
            });
        }
    });
    return flattened;
};

// ---------- Main Component ----------
function Collection() {
    const { products, search, showSearch, categories } = useShop();
    const [state, dispatch] = useReducer(reducer, initialState);
    const { category, subCategory, brand, flavour, flavourType, priceRange, nicotine, options, type, showFilter, filterProducts, sortOrder, currentPage, itemsPerPage } = state;
    const location = useLocation();

    // Sync category from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const categoryParam = params.get('category');
        if (categoryParam) {
            dispatch({ type: 'SET_CATEGORY', payload: [categoryParam] });
        } else {
            // Apply logic: if no category param, do we clear?
            // Yes, standard navigation behavior.
            const q = params.get('q');
            if (!q) { // validation: if search is active, we might not want to clear category if it was somehow mixed, but usually search is global.
                // simplified: just clear category if not in URL
                dispatch({ type: 'SET_CATEGORY', payload: [] });
            }
        }
    }, [location.search]);

    const [openSections, setOpenSections] = useState({
        category: true,
        brand: true,
        flavour: true,
        flavourType: true,
        price: true,
        nicotine: true,
        options: true,
        type: true
    });

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const qParam = useMemo(() => {
        try {
            return new URLSearchParams(location.search).get('q') || '';
        } catch (e) {
            return '';
        }
    }, [location.search]);

    // Active search term used for filtering and highlighting
    const activeQuery = useMemo(() => {
        const urlQ = (qParam || '').trim();
        if (urlQ) return urlQ;
        if (showSearch && search) return String(search).trim();
        return '';
    }, [qParam, showSearch, search]);

    const memoizedProducts = useMemo(() => products, [products]);

    // List of allowed brands/categories based on backend/public/products folders
    const allowedBrands = useMemo(() => [
        "Abt Hybrid", "Abt Twist", "Allo 500", "Allo Ultra 25k", "Allo e - juice 20 mg",
        "Bazooka X3", "Elfbar AF 12000", "Elfbar BC10000", "Elfbar GH20000", "Elfbar Moonlight 70k",
        "Elfbar Prime 1800", "Flavour Bease e- juice 20 Mg", "Flavour Bease e- juice 3mg",
        "Flavour Beast X Twelve Monki e- juice", "Fog", "Gcore 30ml", "Hi5 Click", "Hydra",
        "Ice Nic", "Level X G2 2+10", "Level X G2 Ultra", "Mode Max 2", "OneK Air",
        "Prime Cream Charger", "Rivo Bar", "Sniper", "Twist Bar +", "Vfeel V1"
    ], []);

    // Derive available filter options from product list, but RESTRICT to allowedBrands
    const brands = useMemo(() => {
        const set = new Set();
        memoizedProducts.forEach(p => {
            if (p.brand && allowedBrands.includes(p.brand)) {
                set.add(p.brand);
            }
        });
        // If you want to show ALL allowed brands even if no products are currently fetched (empty categories),
        // you could return allowedBrands.sort().
        // But to "filter from whatever available", we intersect with actual products.
        // However, if the user wants the sidebar to ALWAYS show these categories, we should modify this.
        // Given "shows THESE categories", let's try to populate the list with the allowed brands that exist in products.
        // If the user wants the FULL list regardless of product text, we can just return allowedBrands.
        // Let's stick to showing only what's in products to avoid empty filters,
        // UNLESS the user implies the folder structure IS the categories list.
        // Let's assume we filter products to find these brands.
        return Array.from(set).sort();
    }, [memoizedProducts, allowedBrands]);

    const flavours = useMemo(() => {
        const set = new Set();
        memoizedProducts.forEach(p => { if (p.flavour) set.add(p.flavour); });
        return Array.from(set).sort();
    }, [memoizedProducts]);

    const types = useMemo(() => {
        const set = new Set();
        memoizedProducts.forEach(p => { if (p.subCategory) set.add(p.subCategory); if (p.type) set.add(p.type); });
        return Array.from(set).sort();
    }, [memoizedProducts]);

    const priceRanges = ['Under $20', '$20 - $50', 'Above $50'];
    const nicotineLevels = ['Low', 'Medium', 'High'];
    const optionItems = ['Popular', 'New', 'On Sale'];

    const handleToggle = (type, value) => {
        dispatch({ type, payload: value });
        dispatch({ type: 'SET_CURRENT_PAGE', payload: 1 }); // Reset to page 1 on filter change
    };

    const handleSortChange = (e) => {
        dispatch({ type: 'SET_SORT_ORDER', payload: e.target.value });
    };

    const handleItemsPerPageChange = (e) => {
        dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: e.target.value });
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            // Flatten products first
            let filtered = flattenProducts(memoizedProducts);

            // filter by brand
            if (category && category.length) {
                filtered = filtered.filter(item => {
                    if (item.categories && Array.isArray(item.categories)) {
                        return item.categories.some(cat => category.includes(cat));
                    }
                    if (item.category) {
                        return category.includes(item.category);
                    }
                    return false;
                });
            }

            if (brand && brand.length) {
                filtered = filtered.filter(item => item.brand && brand.includes(item.brand));
            }

            // filter by flavour
            if (flavour && flavour.length) {
                // Check both product flavour and variant flavour if available
                filtered = filtered.filter(item => {
                    if (item.flavour && flavour.includes(item.flavour)) return true;
                    if (item.variantFlavour && flavour.includes(item.variantFlavour)) return true; // Check variant specific flavour
                    return false;
                });
            }
            // filter by flavourType (best-effort: check `flavour` or `description`)
            if (flavourType && flavourType.length) {
                const ftLower = flavourType.map(f => f.toLowerCase());
                filtered = filtered.filter(item => {
                    const txt = `${item.flavour || ''} ${item.description || ''} ${item.variantFlavour || ''}`.toLowerCase();
                    return ftLower.some(f => txt.includes(f));
                });
            }
            // filter by price ranges
            if (priceRange && priceRange.length) {
                filtered = filtered.filter(item => {
                    const price = Number(item.price || 0);
                    return priceRange.some(pr => {
                        if (pr === 'Under $20') return price < 20;
                        if (pr === '$20 - $50') return price >= 20 && price <= 50;
                        if (pr === 'Above $50') return price > 50;
                        return false;
                    });
                });
            }
            // filter by nicotine (best-effort: match `nicotine` or `nicotineHit` property)
            if (nicotine && nicotine.length) {
                filtered = filtered.filter(item => {
                    const val = (item.nicotine || item.nicotineHit || '').toString().toLowerCase();
                    return nicotine.some(n => val.includes(n.toLowerCase()));
                });
            }
            // filter by options (best-effort: check tags or flags)
            if (options && options.length) {
                filtered = filtered.filter(item => {
                    const txt = `${item.tags || ''} ${item.description || ''} ${(item.other || '')}`.toLowerCase();
                    return options.some(op => txt.includes(op.toLowerCase()));
                });
            }
            // filter by type
            if (type && type.length) {
                filtered = filtered.filter(item => (item.subCategory && type.includes(item.subCategory)) || (item.type && type.includes(item.type)));
            }
            // support searching across name, brand, category, subCategory, description and variants
            if (activeQuery) {
                const qLower = activeQuery.toLowerCase();
                const matchesQuery = (item) => {
                    if (!item) return false;
                    const fields = [];
                    // Note: 'item' here is already flattened, so we check its name (which includes variant info)
                    // We also check the base properties
                    if (item.name) fields.push(String(item.name));
                    if (item.brand) fields.push(String(item.brand));
                    if (item.category) fields.push(String(item.category));
                    if (item.subCategory) fields.push(String(item.subCategory));
                    if (item.description) fields.push(String(item.description));

                    return fields.some(f => String(f).toLowerCase().includes(qLower));
                };

                filtered = filtered.filter(item => matchesQuery(item));
            }
            const sorted = sortProducts(filtered, sortOrder);
            dispatch({ type: 'SET_FILTER_PRODUCTS', payload: sorted });
        }, 100); // debounce delay

        return () => clearTimeout(timeout);
    }, [memoizedProducts, category, subCategory, brand, flavour, flavourType, priceRange, nicotine, options, type, sortOrder, search, showSearch, activeQuery]);

    // Derived category list (from context)
    const categoryList = useMemo(() => {
        return categories.map(c => c.name);
    }, [categories]);

    return (
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-10 pt-10 border-t-2 border-gray-300">
            {/* Left: Filter Options */}
            <div className="min-w-60">
                <p
                    onClick={() => handleToggle('SET_SHOW_FILTER', !showFilter)}
                    className="text-xl flex items-center gap-2 my-2 cursor-pointer sm:cursor-default"
                >
                    FILTERS
                    <img
                        className={`h-3 sm:hidden ${showFilter ? 'rotate-90' : ''}`}
                        src={assets.dropdown_icon}
                        alt="Toggle"
                    />
                </p>

                {/* Shop By Category */}
                <div className={`border border-gray-300 pl-5 py-3 mt-4 ${showFilter ? '' : 'hidden'} sm:block`}>
                    <p
                        onClick={() => toggleSection('category')}
                        className="mb-3 font-medium text-sm flex justify-between items-center cursor-pointer pr-5 select-none"
                    >
                        Shop By Category
                        <img src={assets.dropdown_icon} className={`h-3 transition-transform duration-200 ${openSections.category ? 'rotate-90' : ''}`} alt="" />
                    </p>
                    <div className={`flex flex-col gap-2 text-sm font-light text-gray-700 ${openSections.category ? '' : 'hidden'}`}>
                        {categoryList.length ? categoryList.map(label => {
                            const id = `category-${label}`;
                            return (
                                <div key={label} className="flex gap-2 items-center">
                                    <input id={id} type="checkbox" value={label} onChange={(e) => handleToggle('TOGGLE_CATEGORY', e.target.value)} className="w-3" />
                                    <label htmlFor={id}>{label}</label>
                                </div>
                            );
                        }) : <div className="text-xs text-gray-500">No categories</div>}
                    </div>
                </div>

                {/* Shop By Brand */}
                <div className={`border border-gray-300 pl-5 py-3 mt-4 ${showFilter ? '' : 'hidden'} sm:block`}>
                    <p
                        onClick={() => toggleSection('brand')}
                        className="mb-3 font-medium text-sm flex justify-between items-center cursor-pointer pr-5 select-none"
                    >
                        Shop By Brand
                        <img src={assets.dropdown_icon} className={`h-3 transition-transform duration-200 ${openSections.brand ? 'rotate-90' : ''}`} alt="" />
                    </p>
                    <div className={`flex flex-col gap-2 text-sm font-light text-gray-700 ${openSections.brand ? '' : 'hidden'}`}>
                        {brands.length ? brands.map(label => {
                            const id = `brand-${label}`;
                            return (
                                <div key={label} className="flex gap-2 items-center">
                                    <input id={id} type="checkbox" value={label} onChange={(e) => handleToggle('TOGGLE_BRAND', e.target.value)} className="w-3" />
                                    <label htmlFor={id}>{label}</label>
                                </div>
                            );
                        }) : <div className="text-xs text-gray-500">No brands</div>}
                    </div>
                </div>

                {/* Shop By Flavour */}
                <div className={`border border-gray-300 pl-5 py-3 mt-4 ${showFilter ? '' : 'hidden'} sm:block`}>
                    <p
                        onClick={() => toggleSection('flavour')}
                        className="mb-3 font-medium text-sm flex justify-between items-center cursor-pointer pr-5 select-none"
                    >
                        Shop By Flavour
                        <img src={assets.dropdown_icon} className={`h-3 transition-transform duration-200 ${openSections.flavour ? 'rotate-90' : ''}`} alt="" />
                    </p>
                    <div className={`flex flex-col gap-2 text-sm font-light text-gray-700 ${openSections.flavour ? '' : 'hidden'}`}>
                        {flavours.length ? flavours.map(label => {
                            const id = `flavour-${label}`;
                            return (
                                <div key={label} className="flex gap-2 items-center">
                                    <input id={id} type="checkbox" value={label} onChange={(e) => handleToggle('TOGGLE_FLAVOUR', e.target.value)} className="w-3" />
                                    <label htmlFor={id}>{label}</label>
                                </div>
                            );
                        }) : <div className="text-xs text-gray-500">No flavours</div>}
                    </div>
                </div>



                {/* Shop By Price */}
                <div className={`border border-gray-300 pl-5 py-3 mt-4 ${showFilter ? '' : 'hidden'} sm:block`}>
                    <p
                        onClick={() => toggleSection('price')}
                        className="mb-3 font-medium text-sm flex justify-between items-center cursor-pointer pr-5 select-none"
                    >
                        Shop By Price
                        <img src={assets.dropdown_icon} className={`h-3 transition-transform duration-200 ${openSections.price ? 'rotate-90' : ''}`} alt="" />
                    </p>
                    <div className={`flex flex-col gap-2 text-sm font-light text-gray-700 ${openSections.price ? '' : 'hidden'}`}>
                        {priceRanges.map(label => {
                            const id = `price-${label}`;
                            return (
                                <div key={label} className="flex gap-2 items-center">
                                    <input id={id} type="checkbox" value={label} onChange={(e) => handleToggle('TOGGLE_PRICE', e.target.value)} className="w-3" />
                                    <label htmlFor={id}>{label}</label>
                                </div>
                            );
                        })}
                    </div>
                </div>






            </div>

            {/* Right: Product List */}
            <div className="flex-1">
                <div className="flex flex-col sm:flex-row justify-between text-base sm:text-2xl mb-4 gap-4 sm:gap-0">
                    <Title text1="ALL" text2="COLLECTIONS" />

                    <div className="flex items-center gap-4">
                        {/* Items Per Page Dropdown */}
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-700">Show:</span>
                            <select
                                onChange={handleItemsPerPageChange}
                                className="border-2 border-gray-300 px-2 py-1 bg-white outline-none"
                                value={itemsPerPage}
                            >
                                <option value="20">20</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>

                        {/* Sort Dropdown */}
                        <select
                            onChange={handleSortChange}
                            className="border-2 border-gray-300 text-sm px-2 py-1 outline-none"
                            value={sortOrder}
                        >
                            <option value="relevant">Sort by: Relevant</option>
                            <option value="high-low">Sort by: High to Low</option>
                            <option value="low-high">Sort by: Low to High</option>
                        </select>
                    </div>
                </div>

                {/* Product Grid or Fallback Message */}
                {filterProducts.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
                            {filterProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(item => (
                                <ProductItem
                                    key={item.uniqueId}
                                    id={item._id}
                                    images={item.images || item.image}
                                    name={item.name}
                                    price={item.price}
                                    highlight={activeQuery}
                                />
                            ))}
                        </div>
                        {/* Pagination */}
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                onClick={() => dispatch({ type: 'SET_CURRENT_PAGE', payload: Math.max(1, currentPage - 1) })}
                                disabled={currentPage === 1}
                                className={`px-4 py-2 border ${currentPage === 1 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                            >
                                Previous
                            </button>
                            <span className="text-gray-700">Page {currentPage} of {Math.ceil(filterProducts.length / itemsPerPage)}</span>
                            <button
                                onClick={() => dispatch({ type: 'SET_CURRENT_PAGE', payload: Math.min(Math.ceil(filterProducts.length / itemsPerPage), currentPage + 1) })}
                                disabled={currentPage === Math.ceil(filterProducts.length / itemsPerPage)}
                                className={`px-4 py-2 border ${currentPage === Math.ceil(filterProducts.length / itemsPerPage) ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'}`}
                            >
                                Next
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-gray-600 py-10">
                        No products found.
                    </div>
                )}
            </div>
        </div>
    );
}

export default Collection;
