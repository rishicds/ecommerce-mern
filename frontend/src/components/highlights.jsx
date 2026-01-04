import React from "react";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { Link } from "react-router";

const Highlights = () => {
    // You can import your images and replace these placeholder paths
    const IMAGES = {
        banner1: import.meta.env.VITE_BACKEND_URL + "/products/Allo Ultra 25k/R26 -GRAPE ICE.png",
        banner2: import.meta.env.VITE_BACKEND_URL + "/products/Elfbar BC10000/BC10000-Blue-Razz-Ice.jpg",
        banner3: import.meta.env.VITE_BACKEND_URL + "/products/Sniper/Sniper Peach Ice.jpeg",
        collection1: import.meta.env.VITE_BACKEND_URL + "/products/Elfbar AF 12000/Tangy Blue Razz.jpg",
        collection2: import.meta.env.VITE_BACKEND_URL + "/products/Sniper/Sniper Watermelon Ice.jpeg",
        collection3: import.meta.env.VITE_BACKEND_URL + "/products/Gcore 30ml/Mint 20mg.png.webp",
        exterior: "/Triple.jpg",
    };

    return (
        <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 py-12 md:py-20">
                {/* Main Featured Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
                    {/* Primary Hero */}
                    <div className="lg:col-span-8 relative overflow-hidden bg-white h-[500px] rounded-lg group">
                        <img
                            src={IMAGES.banner1}
                            alt="Allo Ultra 25K"
                            className="absolute inset-0 w-full h-full object-contain transition-all duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-end p-8 md:p-12">
                            <div className="max-w-lg">
                                <span className="inline-block bg-[#FFB81C] text-black text-xs font-bold px-3 py-1 mb-4 uppercase tracking-widest">
                                    New Arrival
                                </span>
                                <h2 className="text-2xl md:text-4xl font-bold text-black mb-3 tracking-tight">
                                    Allo Ultra 25K
                                </h2>
                                <p className="text-black/90 mb-6 text-base">
                                    Experience the massive <br />Grape Ice capacity.
                                </p>
                                <Link to={`/product/${'695aaabb8d9bcf65193c3e28'}`} className="bg-white text-black hover:bg-[#FFB81C] hover:text-black font-semibold px-6 py-3 rounded-md transition-all duration-300 flex items-center gap-2 group/btn w-fit">
                                    Explore Collection
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Featured */}
                    <div className="lg:col-span-4 grid grid-rows-2 gap-4">
                        <div className="relative overflow-hidden bg-white h-full min-h-[240px] rounded-lg group">
                            <img
                                src={IMAGES.banner2}
                                alt="Elfbar BC10000"
                                className="absolute right-0 bottom-0 h-full w-3/5 object-contain object-right-bottom transition-all duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 p-6 flex flex-col justify-between w-1/2 z-10">
                                <span className="inline-block bg-[#FFB81C] text-black text-xs font-bold px-2.5 py-1 uppercase w-fit">
                                    Ultra
                                </span>
                                <div>
                                    <h3 className="text-lg font-bold text-black mb-1">Elfbar BC10000</h3>
                                    <p className="text-black/80 text-xs">Blue Razz Ice</p>
                                    <Link to={`/product/${'695aab048d9bcf65193c3eaf'}`} className="mt-3 text-[#FFB81C] font-semibold text-sm inline-flex items-center gap-2">
                                        Shop Now <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="relative overflow-hidden bg-white h-full min-h-[240px] rounded-lg group">
                            <img
                                src={IMAGES.banner3}
                                alt="Sniper"
                                className="absolute right-0 bottom-0 h-full w-3/5 object-contain object-right-bottom transition-all duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 p-6 flex items-end w-1/2 z-10">
                                <div>
                                    <h3 className="text-lg font-bold text-black">Sniper</h3>
                                    <p className="text-black/80 text-xs">Peach Ice</p>
                                    <Link to={`/product/${'695aac718d9bcf65193c4af3'}`} className="mt-3 text-[#FFB81C] font-semibold text-sm inline-flex items-center gap-2">
                                        Shop Now <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Collection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                        { img: IMAGES.collection1, title: "Elfbar AF 12000", subtitle: "Tangy Blue Razz", link: "/product/695aaafe8d9bcf65193c3e9b" },
                        { img: IMAGES.collection2, title: "Sniper 2-in-1", subtitle: "Watermelon Ice", link: "/product/695aac738d9bcf65193c4b20" },
                        { img: IMAGES.collection3, title: "Gcore E-Liquid", subtitle: "Refreshing Mint", link: "/product/695aab8c8d9bcf65193c474d" }
                    ].map((item, idx) => (
                        <div key={idx} className="flex flex-col bg-white rounded-lg overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transform transition-transform duration-300 hover:-translate-y-1">
                            <div className="w-full h-56 md:h-64 flex items-center justify-center bg-white">
                                <img src={item.img} alt={item.title} className="max-h-full object-contain transition-transform duration-700 group-hover:scale-105" />
                            </div>
                            <div className="px-4 py-3">
                                <h4 className="text-sm md:text-base font-semibold text-black">{item.title}</h4>
                                <p className="text-gray-600 text-xs mt-1">{item.subtitle}</p>
                                <div className="mt-3">
                                    <Link to={item.link} className="text-[#FFB81C] font-semibold text-sm inline-flex items-center gap-2">Shop Now <ArrowRight className="w-4 h-4" /></Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Store Location Section */}
                <div className="bg-gray-50 border border-gray-200 overflow-hidden rounded-lg">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {/* Image Side */}
                        <div className="relative h-80 lg:h-auto">
                            <img
                                src={IMAGES.exterior}
                                alt="Store Location"
                                className="absolute inset-0 w-full h-full object-contain"
                            />
                        </div>

                        {/* Content Side */}
                        <div className="p-8 md:p-12 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-4">
                                <Star className="w-5 h-5 fill-[#FFB81C] text-[#FFB81C]" />
                                <Star className="w-5 h-5 fill-[#FFB81C] text-[#FFB81C]" />
                                <Star className="w-5 h-5 fill-[#FFB81C] text-[#FFB81C]" />
                                <Star className="w-5 h-5 fill-[#FFB81C] text-[#FFB81C]" />
                                <Star className="w-5 h-5 fill-[#FFB81C] text-[#FFB81C]" />
                                <span className="text-sm text-gray-600 ml-2">(500+ reviews)</span>
                            </div>

                            <h3 className="text-2xl md:text-3xl font-bold text-black mb-3">Location</h3>

                            <p className="text-gray-800 mb-2 font-semibold">1365 East 41st</p>
                            <p className="text-gray-800 mb-4">Vancouver, BC, V5W 1R7</p>

                            <div className="mb-4 text-sm text-gray-700">
                                <div className="font-semibold mb-2">Hours</div>
                                <div>Monday - Thursday: 8AM - 10PM</div>
                                <div>Friday - Saturday: 9AM - 12AM</div>
                                <div>Sunday: 9AM - 10PM</div>
                            </div>

                            <div className="flex items-start gap-3 mb-6">
                                <MapPin className="w-5 h-5 text-[#FFB81C] shrink-0 mt-1" />
                                <div>
                                    <p className="font-semibold text-black">Get Directions</p>
                                    <p className="text-gray-600 text-sm">Click to open in your maps app</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <a
                                    href="https://www.google.com/maps/dir//1365+E+41st+Ave,+Vancouver,+BC+V5W+1R7,+Canada/@22.5050624,88.3326976,15z/data=!4m8!4m7!1m0!1m5!1m1!1s0x54867419c2280f43:0x6dc7f8c90ecf6763!2m2!1d-123.077982!2d49.2329544?entry=ttu&g_ep=EgoyMDI1MTEyMy4xIKXMDSoASAFQAw%3D%3D"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center bg-black text-white hover:bg-gray-900 font-semibold px-6 py-3 rounded-md transition-colors duration-300"
                                >
                                    Get Directions
                                </a>
                                <a
                                    href="tel:+16045597833"
                                    className="border border-black text-black hover:bg-black hover:text-white font-semibold px-6 py-3 rounded-md transition-colors duration-300 inline-flex items-center justify-center"
                                    aria-label="Call Store"
                                >
                                    Call Store
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Highlights;