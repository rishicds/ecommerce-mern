import React, { useState, useEffect } from 'react';
import { assets } from '../assets/frontend_assets/assets';

const CACHE_NAME = 'vapee-image-cache-v1';

const CachedImage = ({ src, alt, className, onClick, ...props }) => {
    const [imageSrc, setImageSrc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let isMounted = true;

        if (!src) {
            setLoading(false);
            setError(true);
            return;
        }

        const fetchImage = async () => {
            try {
                setLoading(true);
                setError(false);

                // Check if browser supports Cache API
                if (!('caches' in window)) {
                    setImageSrc(src);
                    setLoading(false);
                    return;
                }

                const cache = await caches.open(CACHE_NAME);
                const cachedResponse = await cache.match(src);

                if (cachedResponse) {
                    const blob = await cachedResponse.blob();
                    const objectUrl = URL.createObjectURL(blob);
                    if (isMounted) {
                        setImageSrc(objectUrl);
                        setLoading(false);
                    }
                } else {
                    // Not in cache, fetch and cache
                    try {
                        const response = await fetch(src, { mode: 'cors' });
                        if (!response.ok) throw new Error('Network response was not ok');

                        // Clone before consuming
                        cache.put(src, response.clone());

                        const blob = await response.blob();
                        const objectUrl = URL.createObjectURL(blob);

                        if (isMounted) {
                            setImageSrc(objectUrl);
                            setLoading(false);
                        }
                    } catch (err) {
                        console.error("Image fetch failed, falling back to direct source", err);
                        // Fallback to normal load if fetch fails (e.g. CORS issues)
                        if (isMounted) {
                            setImageSrc(src);
                            setLoading(false);
                        }
                    }
                }
            } catch (err) {
                console.error("Cache handling error", err);
                if (isMounted) {
                    setImageSrc(src); // Fallback
                    setLoading(false);
                }
            }
        };

        fetchImage();

        return () => {
            isMounted = false;
            // potential cleanup of object URLs if memory is a concern, 
            // though browser cleans them up on document unload usually.
            // For long lived SPAs, manual revoke might be needed if many images are loaded.
        };
    }, [src]);

    // Cleanup props - remove onLoad/onError helpers if passed, as we handle basic loading flow
    // But we still fire onError if the final <img> fails
    const handleImageError = (e) => {
        setError(true);
        if (props.onError) props.onError(e);
    };

    if (error) {
        // If a fallback UI was requested via children or prop, we could render it.
        // For now, render standard broken image or nothing, relying on parent to handle "No Image"
        // But wait, the parent `ProductItem` expects `onError` to trigger its own fallback.
        // So we render the broken img tag so parent's onError can fire, OR we just return null?
        // Ideally we mirror <img> behavior.
        return <img src={src} alt={alt} className={className} onClick={onClick} onError={props.onError} {...props} />;
    }

    return (
        <img
            src={imageSrc || src}
            alt={alt || 'image'}
            className={`${className} ${loading ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'} transition-all duration-300`}
            onClick={onClick}
            onError={handleImageError}
            {...props}
        />
    );
};

export default CachedImage;
