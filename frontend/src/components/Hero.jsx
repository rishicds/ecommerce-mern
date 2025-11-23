import React from "react";

const Hero = () => {
    // You can import your images and replace these placeholder paths
    const images = {
        mainBanner: "/pic1.jpg", // Large top banner
        product1: "/pic3.jpg",     // Grid item 1
        product2: "/pic2.jpg",     // Grid item 2
        product3: "/pic1.jpg"      // Grid item 3
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-6">
            {/* Main Hero Banner */}
            <div className="relative w-full h-[400px] rounded-lg overflow-hidden mb-6 group">
                <img 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                    src={images.mainBanner}
                    alt="Main Banner" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent flex items-center">
                    <div className="text-white px-8 md:px-16">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-12 h-[2px] bg-white"></div>
                            <p className="font-medium text-sm md:text-base tracking-wider">FEATURED COLLECTION</p>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                            Beco Better Taste<br/>Better Choice!
                        </h1>
                        <button className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors">
                            SHOP NOW
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Grid Item 1 */}
                <div className="relative h-[300px] rounded-lg overflow-hidden group cursor-pointer">
                    <img 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        src={images.product1}
                        alt="Product 1" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                        <div className="text-white p-6 w-full">
                            <h3 className="text-2xl font-bold mb-2">RIVO Bar</h3>
                            <p className="text-sm mb-3 opacity-90">Unmatched Performance</p>
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <span>Explore</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid Item 2 */}
                <div className="relative h-[300px] rounded-lg overflow-hidden group cursor-pointer">
                    <img 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        src={images.product2}
                        alt="Product 2" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                        <div className="text-white p-6 w-full">
                            <h3 className="text-2xl font-bold mb-2">RBT Twist</h3>
                            <p className="text-sm mb-3 opacity-90">Twist on Flavor</p>
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <span>Explore</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid Item 3 */}
                <div className="relative h-[300px] rounded-lg overflow-hidden group cursor-pointer">
                    <img 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        src={images.product3}
                        alt="Product 3" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                        <div className="text-white p-6 w-full">
                            <h3 className="text-2xl font-bold mb-2">New Arrivals</h3>
                            <p className="text-sm mb-3 opacity-90">Discover Latest</p>
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <span>Explore</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;