import React, { useEffect, useReducer, useMemo } from 'react';
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
    collection: [],
    flavour: [],
    flavourType: [],
    priceRange: [],
    nicotine: [],
    options: [],
    type: [],
    showFilter: false,
    filterProducts: [],
    sortOrder: 'relevant',
    currentPage: 1, // Add current page state
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'TOGGLE_CATEGORY':
            return { ...state, category: toggleItem(state.category, action.payload) };
        case 'TOGGLE_SUBCATEGORY':
            return { ...state, subCategory: toggleItem(state.subCategory, action.payload) };
        case 'TOGGLE_BRAND':
            return { ...state, brand: toggleItem(state.brand, action.payload) };
        case 'TOGGLE_COLLECTION':
            return { ...state, collection: toggleItem(state.collection, action.payload) };
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
        default:
            return state;
    }
};

const toggleItem = (list, value) =>
    list.includes(value) ? list.filter(item => item !== value) : [...list, value];

const sortProducts = (productsToSort, sortOrder) => {
    switch (sortOrder) {
        case 'low-high':
            return [...productsToSort].sort((a, b) => a.price - b.price);
        case 'high-low':
            return [...productsToSort].sort((a, b) => b.price - a.price);
        case 'relevant':
        default:
            return productsToSort;
    }
};

// ---------- Main Component ----------
function Collection() {
    const { products, search, showSearch } = useShop();
    const [state, dispatch] = useReducer(reducer, initialState);
    const { category, subCategory, brand, collection, flavour, flavourType, priceRange, nicotine, options, type, showFilter, filterProducts, sortOrder, currentPage } = state;
    const location = useLocation();
    const itemsPerPage = 20; // Define items per page

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

    // Derive available filter options from product list
    const brands = useMemo(() => {
        const set = new Set();
        memoizedProducts.forEach(p => { if (p.brand) set.add(p.brand); });
        return Array.from(set).sort();
    }, [memoizedProducts]);

    const collections = useMemo(() => {
        const set = new Set();
        memoizedProducts.forEach(p => {
            if (p.category) set.add(p.category);
            if (Array.isArray(p.categories)) p.categories.forEach(c => c && set.add(c));
        });
        return Array.from(set).sort();
    }, [memoizedProducts]);

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

    useEffect(() => {
        const timeout = setTimeout(() => {
            let filtered = memoizedProducts;
            if (category.length) {
                filtered = filtered.filter(item => category.includes(item.category));
            }
            if (subCategory.length) {
                filtered = filtered.filter(item => subCategory.includes(item.subCategory));
            }
            // filter by brand
            if (brand && brand.length) {
                filtered = filtered.filter(item => brand.includes(item.brand));
            }
            // filter by collection (category / categories)
            if (collection && collection.length) {
                filtered = filtered.filter(item => {
                    if (!item) return false;
                    if (item.category && collection.includes(item.category)) return true;
                    if (Array.isArray(item.categories)) return item.categories.some(c => collection.includes(c));
                    return false;
                });
            }
            // filter by flavour
            if (flavour && flavour.length) {
                filtered = filtered.filter(item => item.flavour && flavour.includes(item.flavour));
            }
            // filter by flavourType (best-effort: check `flavour` or `description`)
            if (flavourType && flavourType.length) {
                const ftLower = flavourType.map(f => f.toLowerCase());
                filtered = filtered.filter(item => {
                    const txt = `${item.flavour || ''} ${item.description || ''}`.toLowerCase();
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
                    if (item.name) fields.push(String(item.name));
                    if (item.brand) fields.push(String(item.brand));
                    if (item.category) fields.push(String(item.category));
                    if (item.subCategory) fields.push(String(item.subCategory));
                    if (item.description) fields.push(String(item.description));
                    // variants may be array of strings or objects
                    if (Array.isArray(item.variants)) {
                        item.variants.forEach(v => {
                            if (!v) return;
                            if (typeof v === 'string') fields.push(v);
                            else if (typeof v === 'object') {
                                if (v.size) fields.push(String(v.size));
                                if (v.label) fields.push(String(v.label));
                                if (v.name) fields.push(String(v.name));
                            }
                        });
                    }

                    return fields.some(f => String(f).toLowerCase().includes(qLower));
                };

                filtered = filtered.filter(item => matchesQuery(item));
            }
            const sorted = sortProducts(filtered, sortOrder);
            dispatch({ type: 'SET_FILTER_PRODUCTS', payload: sorted });
        }, 100); // debounce delay

        return () => clearTimeout(timeout);
    }, [memoizedProducts, category, subCategory, sortOrder, search, showSearch, activeQuery]);

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

                {/* Shop By Brand */}
                <div className={`border border-gray-300 pl-5 py-3 mt-4 ${showFilter ? '' : 'hidden'} sm:block`}>
                    <p className="mb-3 font-medium text-sm">Shop By Brand</p>
                    <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
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

                {/* Collection */}
                <div className={`border border-gray-300 pl-5 py-3 mt-4 ${showFilter ? '' : 'hidden'} sm:block`}>
                    <p className="mb-3 font-medium text-sm">Collection</p>
                    <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
                        {collections.length ? collections.map(label => {
                            const id = `collection-${label}`;
                            return (
                                <div key={label} className="flex gap-2 items-center">
                                    <input id={id} type="checkbox" value={label} onChange={(e) => handleToggle('TOGGLE_COLLECTION', e.target.value)} className="w-3" />
                                    <label htmlFor={id}>{label}</label>
                                </div>
                            );
                        }) : <div className="text-xs text-gray-500">No collections</div>}
                    </div>
                </div>

                {/* Shop By Flavour */}
                <div className={`border border-gray-300 pl-5 py-3 mt-4 ${showFilter ? '' : 'hidden'} sm:block`}>
                    <p className="mb-3 font-medium text-sm">Shop By Flavour</p>
                    <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
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

                {/* Flavour Type */}
                <div className={`border border-gray-300 pl-5 py-3 mt-4 ${showFilter ? '' : 'hidden'} sm:block`}>
                    <p className="mb-3 font-medium text-sm">Flavour Type</p>
                    <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
                        {['Dessert', 'Fruity', 'Menthol', 'Tobacco'].map(label => {
                            const id = `flavourtype-${label}`;
                            return (
                                <div key={label} className="flex gap-2 items-center">
                                    <input id={id} type="checkbox" value={label} onChange={(e) => handleToggle('TOGGLE_FLAVOURTYPE', e.target.value)} className="w-3" />
                                    <label htmlFor={id}>{label}</label>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Shop By Price */}
                <div className={`border border-gray-300 pl-5 py-3 mt-4 ${showFilter ? '' : 'hidden'} sm:block`}>
                    <p className="mb-3 font-medium text-sm">Shop By Price</p>
                    <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
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

                {/* Nicotine Hit */}
                <div className={`border border-gray-300 pl-5 py-3 mt-4 ${showFilter ? '' : 'hidden'} sm:block`}>
                    <p className="mb-3 font-medium text-sm">Nicotine Hit</p>
                    <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
                        {nicotineLevels.map(label => {
                            const id = `nic-${label}`;
                            return (
                                <div key={label} className="flex gap-2 items-center">
                                    <input id={id} type="checkbox" value={label} onChange={(e) => handleToggle('TOGGLE_NICOTINE', e.target.value)} className="w-3" />
                                    <label htmlFor={id}>{label}</label>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Options */}
                <div className={`border border-gray-300 pl-5 py-3 mt-4 ${showFilter ? '' : 'hidden'} sm:block`}>
                    <p className="mb-3 font-medium text-sm">Options</p>
                    <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
                        {optionItems.map(label => {
                            const id = `opt-${label}`;
                            return (
                                <div key={label} className="flex gap-2 items-center">
                                    <input id={id} type="checkbox" value={label} onChange={(e) => handleToggle('TOGGLE_OPTIONS', e.target.value)} className="w-3" />
                                    <label htmlFor={id}>{label}</label>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Shop By Type */}
                <div className={`border border-gray-300 pl-5 py-3 mt-4 mb-6 ${showFilter ? '' : 'hidden'} sm:block`}>
                    <p className="mb-3 font-medium text-sm">Shop By Type</p>
                    <div className="flex flex-col gap-2 text-sm font-light text-gray-700">
                        {types.length ? types.map(label => {
                            const id = `type-${label}`;
                            return (
                                <div key={label} className="flex gap-2 items-center">
                                    <input id={id} type="checkbox" value={label} onChange={(e) => handleToggle('TOGGLE_TYPE', e.target.value)} className="w-3" />
                                    <label htmlFor={id}>{label}</label>
                                </div>
                            );
                        }) : <div className="text-xs text-gray-500">No types</div>}
                    </div>
                </div>
            </div>

            {/* Right: Product List */}
            <div className="flex-1">
                <div className="flex justify-between text-base sm:text-2xl mb-4">
                    <Title text1="ALL" text2="COLLECTIONS" />

                    {/* Sort Dropdown */}
                    <select
                        onChange={handleSortChange}
                        className="border-2 border-gray-300 text-sm px-2"
                        value={sortOrder}
                    >
                        <option value="relevant">Sort by: Relevant</option>
                        <option value="high-low">Sort by: High to Low</option>
                        <option value="low-high">Sort by: Low to High</option>
                    </select>
                </div>

                {/* Product Grid or Fallback Message */}
                {filterProducts.length > 0 ? (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
                            {filterProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(item => (
                                <ProductItem
                                    key={item._id}
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
