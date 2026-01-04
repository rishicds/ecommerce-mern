import React, { useEffect, useState, useRef } from "react";
import axios from 'axios';
import { Link, useNavigate } from "react-router";

const Hero = () => {
    const navigate = useNavigate();
    const [bannerSlides, setBannerSlides] = useState(null);
    const [gridSlides, setGridSlides] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/settings`);
                if (res.data?.success && res.data.settings) {
                    const s = res.data.settings;
                    const hero = s.hero || {};
                    const slides = Array.isArray(hero.slides) && hero.slides.length ? hero.slides : [];

                    const bannerSlidesData = slides.filter(s => s.slot === 'banner');
                    const gridSlidesData = slides.filter(s => s.slot === 'grid');

                    setBannerSlides(bannerSlidesData.length ? bannerSlidesData : [
                        { src: "/Banana.png", title: 'Banana Ice', subtitle: '20mg E-LIQUID - Family', link: '/product/695aab338d9bcf65193c3f59' }
                    ]);
                    setGridSlides(gridSlidesData.length ? gridSlidesData : [
                        { src: "/Double-Mango.jpg", title: 'BC10000', subtitle: 'Double Mango', link: '/product/694849300083a59678149884' },
                        { src: "/Ice.jpg", title: 'Sniper', subtitle: 'Peach Ice', link: '/product/695aac718d9bcf65193c4af3' },
                        { src: "/Peach-Ice.jpg", title: 'Abt Hybrid', subtitle: 'Blueberry Ice', link: '/product/695aa9d98d9bcf65193c3cca' }
                    ]);
                    return;
                }
            } catch (err) {
                console.error("Hero settings load failed", err);
            }
            // fallback
            setBannerSlides([
                { src: 'https://res.cloudinary.com/dhhs7twmp/image/upload/v1767550898/vapee/products/Allo%20Ultra%2025k/alloultra25k_juicymango_1767550896083_3jb7oh.png', title: 'Allo Ultra 25k', subtitle: 'Juicy Mango - Smart Disposable', link: '/product/695aaac08d9bcf65193c3e2d' },
                { src: 'https://res.cloudinary.com/dhhs7twmp/image/upload/v1767549764/vapee/products/Flavour%20Bease%20e-%20juice%203mg/flavourbeaseejuice3mg_flavourbeaseejuicewildwhitegrape.png', title: 'Flavour Beast', subtitle: 'Wild White Grape - Premium', link: '/product/695aab458d9bcf65193c3f7c' },
                { src: 'https://res.cloudinary.com/dhhs7twmp/image/upload/v1767550997/vapee/products/Elfbar%20Prime%201800/elfbarprime1800_grape_1767550997648_z688bk.jpg', title: 'Elfbar Prime 1800', subtitle: 'Grape - Smooth & Rich', link: '/product/695aab298d9bcf65193c3f40' }
            ]);
            setGridSlides([
                { src: 'https://res.cloudinary.com/dhhs7twmp/image/upload/v1767550709/vapee/products/Abt%20Hybrid/abthybrid_whitegrape_1767550708670_cpgyf8.png', title: 'Abt Hybrid', subtitle: 'White Grape - Hybrid Nic', link: '/product/695aa9f88d9bcf65193c3d3d' },
                { src: 'https://res.cloudinary.com/dhhs7twmp/image/upload/v1767551439/vapee/products/Sniper/sniper_sniperpeachice_1767551439874_ul3x2.jpg', title: 'Sniper', subtitle: 'Peach Ice - 2-in-1 Mode', link: '/product/695aac718d9bcf65193c4af3' },
                { src: 'https://res.cloudinary.com/dhhs7twmp/image/upload/v1767551170/vapee/products/Fog/fog_dragonfruitstrawberryice_1767551170061_chd8uc.png', title: 'Fog', subtitle: 'Dragon Fruit Strawberry Ice', link: '/product/695aab5e8d9bcf65193c40b7' }
            ]);
        };
        load();
    }, []);

    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef(null);

    const next = () => setCurrent((c) => (c + 1) % (bannerSlides ? bannerSlides.length : 1));
    const prev = () => setCurrent((c) => (c - 1 + (bannerSlides ? bannerSlides.length : 1)) % (bannerSlides ? bannerSlides.length : 1));

    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            if (!isPaused && bannerSlides && bannerSlides.length > 1) next();
        }, 4000);
        return () => clearInterval(timerRef.current);
    }, [isPaused, bannerSlides]);

    if (!bannerSlides) return null;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-6">
            {/* Main Hero Banner (slideshow) */}
            <div
                className="relative w-full h-[400px] rounded-lg overflow-hidden mb-6 group"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
            >
                <img
                    className="w-full h-full object-contain transition-transform duration-700"
                    src={bannerSlides[current].src}
                    alt={bannerSlides[current].title || `Banner ${current + 1}`}
                />

                {/* Overlay content (left side) */}
                <div className="absolute inset-0 bg-linear-to-r from-black/40 to-transparent flex items-center">
                    <div className="text-white px-8 md:px-16">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-12 h-0.5 bg-white"></div>
                            <p className="font-medium text-sm md:text-base tracking-wider">FEATURED COLLECTION</p>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
                            {bannerSlides[current].title}
                            <br />
                            <span className="text-xl font-medium">{bannerSlides[current].subtitle}</span>
                        </h1>
                        <Link
                            to={bannerSlides[current].link || '/collection'}
                            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-md font-semibold hover:bg-[#FFB81C] hover:text-black transition-all duration-300"
                        >
                            Explore
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                    </div>
                </div>

                {/* Left / Right arrows */}
                {bannerSlides.length > 1 && (
                    <>
                        <button
                            aria-label="Previous"
                            onClick={prev}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-2 rounded-full shadow-md"
                        >
                            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <button
                            aria-label="Next"
                            onClick={next}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white p-2 rounded-full shadow-md"
                        >
                            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </>
                )}

                {/* Small indicators */}
                {bannerSlides.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {bannerSlides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`w-3 h-3 rounded-full ${i === current ? 'bg-[#FFB81C]' : 'bg-white/50'}`}
                                aria-label={`Go to slide ${i + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {gridSlides.slice(0, 3).map((b, idx) => (
                    <Link
                        key={idx}
                        to={b.link || '/collection'}
                        className="relative h-[300px] rounded-lg overflow-hidden group cursor-pointer block"
                    >
                        <img className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" src={b.src} alt={b.title || `Grid ${idx + 1}`} />
                        <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent flex items-end">
                            <div className="text-white p-6 w-full">
                                <h3 className="text-2xl font-bold mb-1">{b.title}</h3>
                                <p className="text-sm mb-3 opacity-90">{b.subtitle}</p>
                                <div className="flex items-center gap-2 text-sm font-semibold text-[#FFB81C]">
                                    <span>Explore</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Hero;