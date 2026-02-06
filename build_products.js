#!/usr/bin/env node
/**
 * NASTY Collection - Premium Product Data Processor
 * Converts Shopify JSON to JavaScript product database with advanced features
 */

const fs = require('fs');
const path = require('path');

// Read all JSON files from product_data directory
const productDataDir = './product_data';
const files = fs.readdirSync(productDataDir).filter(f => f.endsWith('.json'));

console.log(`📦 Processing ${files.length} product files...`);

const products = [];
let totalImages = 0;

// Helper to clean variant names
function cleanVariantName(name) {
    if (!name) return null;

    // Remove Shopify internal IDs or weird codes
    let clean = name.replace(/14:\d+|5:\d+|#\w+/g, '').trim();

    // Premium transformations: if it ends with a number, format it
    clean = clean.replace(/(\w+)\s+(\d+)$/, '$1 (Type $2)');

    // Remove trailing semicolons or separators
    clean = clean.replace(/[;:]+$/, '');

    return clean.trim();
}

files.forEach((file, index) => {
    const filePath = path.join(productDataDir, file);
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(raw);
        const product = data.product;

        if (!product) {
            console.log(`❌ No product data in ${file}`);
            return;
        }

        // 1. Build Image Map (ID -> SRC)
        const imageMap = new Map();
        product.images.forEach(img => {
            imageMap.set(img.id, img.src);
        });

        const images = product.images.map(img => ({
            id: img.id,
            src: img.src
        }));
        totalImages += images.length;

        // 2. Identify Options (Color, Size, etc)
        const optionMap = new Map(); // pos -> name (e.g. 1 -> "Color")
        product.options.forEach(opt => {
            const name = opt.name.toLowerCase();
            if (name.includes('color') || name.includes('colour')) optionMap.set(opt.position, 'color');
            else if (name.includes('size')) optionMap.set(opt.position, 'size');
            else if (name.includes('style') || name.includes('type')) optionMap.set(opt.position, 'type');
            else optionMap.set(opt.position, opt.name.toLowerCase()); // fallback
        });

        // 3. Process Variants with Image Mapping
        const variants = product.variants.map(v => {
            // Determine variant attributes dynamically based on position
            const colorVal = optionMap.get(1) === 'color' ? v.option1 :
                optionMap.get(2) === 'color' ? v.option2 :
                    optionMap.get(3) === 'color' ? v.option3 : null;

            const sizeVal = optionMap.get(1) === 'size' ? v.option1 :
                optionMap.get(2) === 'size' ? v.option2 :
                    optionMap.get(3) === 'size' ? v.option3 : null;

            const typeVal = optionMap.get(1) !== 'color' && optionMap.get(1) !== 'size' ? v.option1 : null;

            // Resolve Image ID - Handle both flat image_id and nested featured_image.id
            const imageId = v.image_id || (v.featured_image ? v.featured_image.id : null);

            // Resolve Image URL
            let variantImage = imageMap.get(imageId);

            // Strict Fallback: Use string "null" or empty if not found, do NOT auto-assign main image yet.
            // But for backward compatibility with existing UI that expects an image, we can default to main image URL
            // However, we MUST preserve image_id for the strict lookup logic.
            if (!variantImage && images.length > 0) variantImage = images[0].src;

            return {
                id: v.id,
                sku: v.sku,
                price: parseFloat(v.price),
                weight: v.grams || 0,
                comparePrice: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
                option1: v.option1,
                option2: v.option2,
                option3: v.option3,
                color: cleanVariantName(colorVal),
                size: cleanVariantName(sizeVal),
                type: cleanVariantName(typeVal),
                image_id: imageId, // CRITICAL: Preserve ID
                image: variantImage, // Resolved URL
                available: v.available
            };
        });

        // Determine category
        let category = 'Intimate Apparel';
        const title = product.title.toLowerCase();
        if (title.includes('piece set') || title.includes('tracksuit') || title.includes('sweatsuit')) {
            category = 'Loungewear';
        } else if (title.includes('dress') || title.includes('jumpsuit') || title.includes('skirt')) {
            category = 'Party Dresses';
        } else if (title.includes('vibrator') || title.includes('bdsm') || title.includes('sex toy') || title.includes('machine')) {
            category = 'Wellness';
        }

        // Create product entry
        products.push({
            id: `nc_${String(index + 1).padStart(3, '0')}`,
            title: product.title,
            subtitle: (Array.isArray(product.tags) ? product.tags[0] : (product.tags ? product.tags.split(',')[0] : 'Premium Collection')) || 'Premium Collection',
            description: product.body_html ? product.body_html.replace(/<[^>]*>?/gm, '') : product.title,
            category,
            tags: Array.isArray(product.tags) ? product.tags : (product.tags ? product.tags.split(',') : []),
            price: parseFloat(variants[0].price),
            comparePrice: variants[0].comparePrice,
            images, // Now array of objects {id, src}
            link: `https://ova-26.myshopify.com/products/${product.handle}`,
            variants,
            viral: index < 5,
            newArrival: index < 8
        });

        console.log(`✅ [${index + 1}/${files.length}] ${product.title.substring(0, 40)}... (${variants.length} vars)`);

    } catch (e) {
        console.error(`Error processing ${file}:`, e.message);
    }
});

// Generate JavaScript file
const jsContent = `// NASTY Collection - Premium Product Database
// Auto-generated from Shopify JSON API with Variant-Image Mapping

const nastyCollectionProducts = ${JSON.stringify(products, null, 2)};

// Collection Definitions (ALL Products Included)
const allProductIds = nastyCollectionProducts.map(p => p.id);

const collections = {
    trending: {
        name: '🔥 Trending Now',
        description: 'Hottest items flying off the shelves',
        productIds: allProductIds
    },
    newArrivals: {
        name: '✨ New Arrivals',
        description: 'Just landed - fresh styles',
        productIds: allProductIds
    },
    intimateApparel: {
        name: '💋 Intimate Apparel',
        description: 'Feel confident and beautiful',
        productIds: nastyCollectionProducts.filter(p => p.category === 'Intimate Apparel').map(p => p.id)
    },
    loungewear: {
        name: '👗 Lounge & Sets',
        description: 'Comfy chic two-piece sets',
        productIds: nastyCollectionProducts.filter(p => p.category === 'Loungewear').map(p => p.id)
    },
    partyReady: {
        name: '💃 Party Ready',
        description: 'Make an entrance',
        productIds: nastyCollectionProducts.filter(p => p.category === 'Party Dresses').map(p => p.id)
    },
    wellness: {
        name: '🌹 Wellness',
        description: 'Premium self-care products',
        productIds: nastyCollectionProducts.filter(p => p.category === 'Wellness').map(p => p.id)
    }
};

// Product Management Class  
class NastyCollectionManager {
    constructor() {
        this.products = nastyCollectionProducts;
        this.collections = collections;
    }

    getAllProducts() {
        return this.products;
    }

    getProductById(id) {
        return this.products.find(p => p.id === id);
    }

    getProductsByCollection(collectionName) {
        const collection = this.collections[collectionName];
        if (!collection) return [];
        return collection.productIds.map(id => this.getProductById(id)).filter(p => p);
    }

    getTrendingProducts() {
        return this.getProductsByCollection('trending');
    }

    getNewArrivals() {
        return this.getProductsByCollection('newArrivals');
    }

    searchProducts(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.products.filter(p => 
            p.title.toLowerCase().includes(lowercaseQuery) ||
            p.description.toLowerCase().includes(lowercaseQuery) ||
            p.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
        );
    }
}

// Export
window.NastyCollectionManager = NastyCollectionManager;
window.nastyProducts = nastyCollectionProducts;
window.products = nastyCollectionProducts;
window.nastyCollections = collections;
`;

// Write to products.js
fs.writeFileSync('products_final.js', jsContent);

console.log('');
console.log('✅ SUCCESS! Generated products.js with variant image mapping');
console.log(`stats: ${products.length} products processed`);
