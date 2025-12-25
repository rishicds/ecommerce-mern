import React, { useEffect, useState, useRef } from "react";
import axios from 'axios';
import { useNavigate } from "react-router";

const Hero = () => {
    const navigate = useNavigate();
    const [bannerSlides, setBannerSlides] = useState(null);
    const [gridSlides, setGridSlides] = useState([]);
    // default local images fallback
    const defaultImages = {
        mainBanner: "/Banana.png",
        product1: "/Double-Mango.jpg",
        product2: "/Ice.jpg",
        product3: "/Peach-Ice.jpg"
    };

    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/settings`);
                if (res.data?.success && res.data.settings) {
                    const s = res.data.settings;
                    const hero = s.hero || {};
                    // Use slides if available, otherwise fallback to old images
                    const slides = Array.isArray(hero.slides) && hero.slides.length ? hero.slides : (hero.images || []).
                        map((src, i) => ({ src, title: hero.title || '', subtitle: hero.subtitle || '', slot: i === 0 ? 'banner' : 'grid' }));

                    // ensure at least 1 banner and up to 3 grid slides
                    const bannerSlidesData = slides.filter(s => s.slot === 'banner');
                    const gridSlidesData = slides.filter(s => s.slot === 'grid');

                    const bannersArr = (bannerSlidesData.length ? bannerSlidesData : (slides.length ? [slides[0]] : [])).map(s => ({
                        src: s.src || '',
                        title: s.title || '',
                        subtitle: s.subtitle || '',
                        cta: 'Explore',
                        link: s.link || ''
                    }));
                    if (bannersArr.length === 0) bannersArr.push({ src: defaultImages.mainBanner, title: 'Banana Ice', subtitle: '20mg E-LIQUID - Family', cta: 'SHOP NOW', link: '/collection' });
                    setBannerSlides(bannersArr);
                    setGridSlides(gridSlidesData.map(s => ({
                        src: s.src || '',
                        title: s.title || '',
                        subtitle: s.subtitle || '',
                        cta: 'Explore',
                        link: s.link || ''
                    })));
                    return;
                }
            } catch (err) {
                // ignore and fallback
            }
            // fallback
            setBannerSlides([
                { src: defaultImages.mainBanner, title: 'Banana Ice', subtitle: '20mg E-LIQUID - Family', cta: 'SHOP NOW', link: '/collection' },
                { src: defaultImages.product1, title: 'BC10000', subtitle: 'Double Mango - Premium', cta: 'Explore', link: '/collection' },
                { src: defaultImages.product2, title: 'Sniper', subtitle: 'Peach Ice - Chill', cta: 'Explore', link: '/collection' },
                { src: defaultImages.product3, title: 'Peach Blast', subtitle: 'Refreshing Peach Flavor', cta: 'Explore', link: '/collection' }
            ]);
        };
        load();
    }, []);

    const [current, setCurrent] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef(null);

    const next = () => setCurrent((c) => (c + 1) % (bannerSlides ? bannerSlides.length : 1));
    const prev = () => setCurrent((c) => (c - 1 + (bannerSlides ? bannerSlides.length : 1)) % (bannerSlides ? bannerSlides.length : 1));

    const handleBannerClick = () => {
        if (!bannerSlides) return;
        const link = bannerSlides[current].link;
        if (link) navigate(link);
    };

    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            if (!isPaused && bannerSlides && bannerSlides.length) next();
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
                        <button
                            onClick={handleBannerClick}
                            className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-md font-semibold hover:bg-gray-100 transition-colors"
                        >
                            {bannerSlides[current].cta}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Left / Right arrows */}
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

                {/* Small indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {bannerSlides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`w-3 h-3 rounded-full ${i === current ? 'bg-white' : 'bg-white/50'}`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Grid Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {gridSlides.slice(0, 3).map((b, idx) => (
                    <div
                        key={idx}
                        onClick={() => b.link && navigate(b.link)}
                        className="relative h-[300px] rounded-lg overflow-hidden group cursor-pointer"
                    >
                        <img className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" src={b.src} alt={b.title || `Grid ${idx + 1}`} />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent flex items-end">
                            <div className="text-white p-6 w-full">
                                <h3 className="text-2xl font-bold mb-2">{b.title}</h3>
                                <p className="text-sm mb-3 opacity-90">{b.subtitle}</p>
                                <div className="flex items-center gap-2 text-sm font-semibold">
                                    <span>Explore</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Hero;