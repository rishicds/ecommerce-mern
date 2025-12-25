import React, { useEffect, useState } from "react";
import { useShop } from '../context/ShopContex';
import Title from "./Title";
import ProductItem from "./ProductItem";

const RelatedProducts = ({ product, selectedSize }) => {
  const { products } = useShop();
  const [related, setRelated] = useState([]);

  useEffect(() => {
    if (!product || !products.length) return;

    const base = product;

    // Prefer variant-level data when available
    const baseVariant = (base.variants && base.variants.length)
      ? (selectedSize ? base.variants.find(v => v.size === selectedSize) || base.variants[0] : base.variants[0])
      : null;

    const basePrice = Number(baseVariant?.price ?? base.price ?? 0);
    const baseCategories = Array.isArray(base.categories) ? base.categories : (base.category ? [base.category] : []);
    const baseFlavour = (baseVariant?.flavour ?? base.flavour ?? '').toString().toLowerCase();
    const baseBrand = (base.brand || base.manufacturer || baseVariant?.brand || '').toString().toLowerCase();
    const baseNic = (baseVariant?.nicotine || baseVariant?.nicotineStrength || base.nicotine || base.nicotineStrength || '').toString().toLowerCase();
    const baseType = (baseVariant?.type || base.type || base.productType || '').toString().toLowerCase();

    const scored = products
      .filter(p => p._id !== base._id) // exclude same product
      .map(p => {
        let score = 0;

        // candidate variant selection
        const candVariant = (p.variants && p.variants.length)
          ? (selectedSize ? p.variants.find(v => v.size === selectedSize) || p.variants[0] : p.variants[0])
          : null;

        const pPrice = Number(candVariant?.price ?? p.price ?? 0);

        // categories (array intersection)
        const pCats = Array.isArray(p.categories) ? p.categories : (p.category ? [p.category] : []);
        const categoryCommon = pCats.filter(c => baseCategories.includes(c));
        if (categoryCommon.length) score += 5;

        // brand
        const pBrand = (p.brand || p.manufacturer || candVariant?.brand || '').toString().toLowerCase();
        if (baseBrand && pBrand && baseBrand === pBrand) score += 4;

        // flavour
        const pFlavour = (candVariant?.flavour ?? p.flavour ?? '').toString().toLowerCase();
        if (baseFlavour && pFlavour && baseFlavour === pFlavour) score += 3;

        // nicotine strength
        const pNic = (candVariant?.nicotine || candVariant?.nicotineStrength || p.nicotine || p.nicotineStrength || '').toString().toLowerCase();
        if (baseNic && pNic && baseNic === pNic) score += 3;

        // type
        const pType = (candVariant?.type || p.type || p.productType || '').toString().toLowerCase();
        if (baseType && pType && baseType === pType) score += 2;

        // price proximity
        if (basePrice && pPrice) {
          const diff = Math.abs(basePrice - pPrice);
          const pct = diff / Math.max(1, basePrice);
          if (pct <= 0.1) score += 3; // within 10%
          else if (pct <= 0.25) score += 2; // within 25%
          else if (pct <= 0.5) score += 1; // within 50%
        }

        return { product: p, score };
      })
      .filter(x => x.score > 0) // only show related if some relevance
      .sort((a, b) => b.score - a.score)
      .map(x => x.product)
      .slice(0, 6);

    // Fallback: if no related by score, show some items from same category or any other products
    if (scored.length === 0) {
      const fallback = products.filter(p => p._id !== base._id).slice(0, 6);
      setRelated(fallback);
    } else {
      setRelated(scored);
    }

  }, [products, product, selectedSize]);

  return (
    <div className="my-24">
      <div className="text-center text-3xl py-2">
        <Title text1="RELATED" text2="PRODUCTS" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
        {related.map(item => {
          // Image Fallback Logic
          const fallbackVariant = item.variants?.find(v => v.image);
          const displayImages = (item.images && item.images.length > 0)
            ? item.images
            : (fallbackVariant ? [{ url: fallbackVariant.image }] : []);

          if (!displayImages || displayImages.length === 0) return null;

          return (
            <ProductItem
              key={item._id}
              id={item._id}
              name={item.name}
              price={item.price}
              images={displayImages}
            />
          )
        })}
      </div>
    </div>
  );
};

export default RelatedProducts;
