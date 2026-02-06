// Mock container
global.window = {};
global.NastyCollectionManager = class { }; // Mock dependency if needed

// Read the file content
const fs = require('fs');
const content = fs.readFileSync('products_final.js', 'utf8');

// We can't easily require it if it has global side effects that error out before assignment.
// But we defined global.window.
// Let's try eval or just require if the file is in the same dir.
// The file is /Users/ashtoncampbell/.gemini/antigravity/scratch/nasty-collection/products_final.js

try {
    // Execute the file content in this context
    eval(content);

    // Access the data
    const products = window.nastyProducts || window.products;

    if (!products) {
        console.log("Could not find products in window object.");
        process.exit(1);
    }

    console.log(`Loaded ${products.length} products.`);

    const productsWithVariance = [];

    products.forEach(p => {
        const variants = p.variants || [];
        const images = variants.map(v => v.image).filter(i => i);
        const unique = new Set(images);

        if (unique.size > 1) {
            productsWithVariance.push({
                title: p.title,
                uniqueImages: unique.size,
                totalVariants: variants.length
            });
        }
    });

    if (productsWithVariance.length === 0) {
        console.log("RESULT: NO_VARIANCE (All variants share identical image URLs)");
    } else {
        console.log(`RESULT: VARIANCE_FOUND (${productsWithVariance.length} products)`);
        productsWithVariance.forEach(p => {
            console.log(`- ${p.title.substring(0, 30)}...: ${p.uniqueImages} unique / ${p.totalVariants} variants`);
        });
    }

} catch (e) {
    console.error("Error executing file:", e);
}
