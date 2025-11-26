import React from "react";
import { ArrowRight, MapPin, Star } from "lucide-react";

const Highlights = () => {
    // You can import your images and replace these placeholder paths
    const IMAGES = {
        banner1: "/Grape.jpg",
        banner2: "/Flavourys.png",
        banner3: "/Flavour.png",
        collection1: "/Banana.png",
        collection2: "/Bease.png",
        collection3: "/Ice.jpg",
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
                            alt="VEEV One"
                            className="absolute inset-0 w-full h-full object-contain opacity-70 transition-all duration-700 group-hover:opacity-80 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-end p-8 md:p-12">
                            <div className="max-w-lg">
                                <span className="inline-block bg-[#FFB81C] text-black text-xs font-bold px-3 py-1 mb-4 uppercase tracking-widest">
                                    New Arrival
                                </span>
                                <h2 className="text-2xl md:text-4xl font-bold text-black mb-3 tracking-tight">
                                    Lorem Ipsum
                                </h2>
                                <p className="text-black/90 mb-6 text-base">
                                    Lorem ipsum dolor sit <br />amet consectetur adipiscing <br/>elit sed do eiusmod
                                </p>
                                <button className="bg-white text-black hover:bg-[#FFB81C] hover:text-black font-semibold px-6 py-3 rounded-md transition-all duration-300 flex items-center gap-2 group/btn">
                                    Explore Collection
                                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Secondary Featured */}
                    <div className="lg:col-span-4 grid grid-rows-2 gap-4">
                        <div className="relative overflow-hidden bg-gray-100 h-full min-h-[240px] rounded-lg group">
                            <img
                                src={IMAGES.banner2}
                                alt="VEEV Now Ultra"
                                className="absolute inset-0 w-full h-full object-contain opacity-60 transition-all duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 p-6 flex flex-col justify-between">
                                <span className="inline-block bg-[#FFB81C] text-black text-xs font-bold px-2.5 py-1 uppercase w-fit">
                                    Ultra
                                </span>
                                <div>
                                    <h3 className="text-lg font-bold text-black mb-1">Lorem Dolor</h3>
                                    <p className="text-black/80 text-xs">Premium Quality</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 h-full min-h-[240px] rounded-lg group">
                            <img
                                src={IMAGES.banner3}
                                alt="Geek Bar"
                                className="absolute inset-0 w-full h-full object-contain transition-all duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 p-6 flex items-end">
                                <div>
                                    <h3 className="text-lg font-bold text-black">Sit Amet</h3>
                                    <p className="text-black/80 text-xs">Consectetur Adipiscing</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Collection Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {[
                        { img: IMAGES.collection1, title: "Lorem Ipsum", subtitle: "Dolor Sit Amet" },
                        { img: IMAGES.collection2, title: "Consectetur", subtitle: "Adipiscing Elit" },
                        { img: IMAGES.collection3, title: "Sed Dolor", subtitle: "Amet Consectetur" }
                    ].map((item, idx) => (
                        <div key={idx} className="flex flex-col bg-white rounded-lg overflow-hidden group cursor-pointer shadow-sm hover:shadow-md transform transition-transform duration-300 hover:-translate-y-1">
                            <div className="w-full h-56 md:h-64 flex items-center justify-center bg-white">
                                <img src={item.img} alt={item.title} className="max-h-full object-contain transition-transform duration-700 group-hover:scale-105" />
                            </div>
                            <div className="px-4 py-3">
                                <h4 className="text-sm md:text-base font-semibold text-black">{item.title}</h4>
                                <p className="text-gray-600 text-xs mt-1">{item.subtitle}</p>
                                <div className="mt-3">
                                    <button className="text-[#FFB81C] font-semibold text-sm inline-flex items-center gap-2">Shop Now <ArrowRight className="w-4 h-4" /></button>
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