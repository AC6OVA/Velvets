
const fs = require('fs');
const path = require('path');

// Load the products data
// We need to simulate the browser environment where 'window' entities are defined
const window = {};
const fileContent = fs.readFileSync('products_final.js', 'utf8');
eval(fileContent); // This populates window.nastyProducts

const products = window.nastyProducts;

let markdown = "# ANTI-GRAVITY PROFIT & SHIPPING BLUEPRINT\n\n";
markdown += `> Generated on ${new Date().toLocaleString()}\n`;
markdown += "> **Note:** Supplier Cost is derived from the 'Compare At' price in the Shopify data, which appears to track the original AliExpress/DSers cost.\n\n";

markdown += "| Product | Variant | Weight | Stock | Price | Cost (Est) | Shipping | Cust. Total | Profit | Notes |\n";
markdown += "|---|---|---|---|---|---|---|---|---|---|\n";

let totalProducts = 0;
let totalVariants = 0;

products.forEach(p => {
    p.variants.forEach(v => {
        totalVariants++;

        let variantName = v.title;
        if (!variantName || variantName === 'undefined') {
            const parts = [];
            if (v.color) parts.push(v.color);
            if (v.size) parts.push(v.size);
            if (v.option1 && !v.color) parts.push(v.option1); // Fallback
            variantName = parts.length > 0 ? parts.join(' / ') : 'Default Title';
        }

        const price = parseFloat(v.price) || 0;
        const cost = v.comparePrice ? parseFloat(v.comparePrice) : 0;
        const weight = v.weight || 0; // grams
        const available = v.available;

        // Shipping Logic calculation for SINGLE ITEM
        // Free shipping is > $100, so mostly single items will pay shipping unless high ticket
        let shippingCost = 0;
        let shippingType = "";

        if (price >= 100) {
            shippingCost = 0;
            shippingType = "Free (>$100)";
        } else if (weight < 1000) {
            shippingCost = 6.99;
            shippingType = "Economy";
        } else {
            shippingCost = 12.99;
            shippingType = "Standard";
        }

        const customerTotal = price + shippingCost;
        // Profit = (Price + ShippingCharged) - SupplierCost
        const profit = customerTotal - cost;

        const stockIcon = available ? "✅" : "🔴";
        const stockStatus = available ? "In Stock" : "Sold Out";

        let notes = shippingType;
        if (price <= cost) {
            notes += " ⚠️ PRICE <= COST";
        } else if (profit < 5) {
            notes += " ⚠️ Low Margin";
        }

        // Formatting
        const row = `| ${p.title.substring(0, 30)}... | ${variantName} | ${weight}g | ${stockIcon} ${stockStatus} | $${price.toFixed(2)} | $${cost.toFixed(2)} | $${shippingCost.toFixed(2)} | $${customerTotal.toFixed(2)} | **$${profit.toFixed(2)}** | ${notes} |`;

        markdown += row + "\n";
    });
});

markdown += "\n## Multi-Unit & Shipping Notes\n";
markdown += "- **Free Shipping**: Automatically applied when the Order Subtotal is **$100+**.\n";
markdown += "- **Profit Calculation**: `(Price + Shipping Charged) - Supplier Cost`.\n";
markdown += "- **Low Margin Warning**: specific variants may need price adjustments if Price <= Cost.\n";


const artifactPath = '/Users/ashtoncampbell/.gemini/antigravity/brain/2cccddbf-e3a7-4d18-85ca-81d3d0673ec0/profit_blueprint.md';
fs.writeFileSync(artifactPath, markdown);
console.log(`Generated blueprint for ${products.length} products and ${totalVariants} variants at ${artifactPath}`);
