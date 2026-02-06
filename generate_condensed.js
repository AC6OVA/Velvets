
const fs = require('fs');

// Load data
const window = {};
const fileContent = fs.readFileSync('products_final.js', 'utf8');
eval(fileContent);
const products = window.nastyProducts;

let output = "| Product | Variant Group | Sell | Buy (Est) | Ship | Total (Cust) | Profit | Notes |\n";
output += "|---|---|---|---|---|---|---|---|\n";

products.forEach(p => {
    // 1. Group variants by financial profile
    const groups = {};

    p.variants.forEach(v => {
        const price = parseFloat(v.price) || 0;
        const cost = v.comparePrice ? parseFloat(v.comparePrice) : 0;
        const weight = v.weight || 0;

        let shippingCost = 0;
        let shippingType = "Econ";

        if (price >= 100) {
            shippingCost = 0;
            shippingType = "Free";
        } else if (weight < 1000) {
            shippingCost = 6.99;
            shippingType = "Econ";
        } else {
            shippingCost = 12.99;
            shippingType = "Std";
        }

        const key = `${price}_${cost}_${shippingCost}_${shippingType}`;

        if (!groups[key]) {
            groups[key] = {
                price, cost, shippingCost, shippingType,
                variants: [],
                weight
            };
        }

        // Push simplified variant name (e.g., "S", "Red")
        // If title is "Blue / S", we might want to just keep track of count or a specific list
        // Let's try to be smart: if logic matches "Color / Size", just store the whole title for now
        groups[key].variants.push(v.title);
    });

    // 2. Generate Rows for this product
    Object.values(groups).forEach(g => {
        const customerTotal = g.price + g.shippingCost;
        const profit = customerTotal - g.cost;

        // Summarize variants
        let variantSummary = "";
        const count = g.variants.length;
        if (count === p.variants.length) {
            variantSummary = "All Variants";
        } else if (count > 5) {
            variantSummary = `${count} Variants`; // Too many to list
        } else {
            // Abbreviations to save space
            variantSummary = g.variants.map(n => (n || "Variant").replace(/Large/g, 'L').replace(/Small/g, 'S').replace(/Medium/g, 'M')).join(', ');
            if (variantSummary.length > 30) variantSummary = `${count} Variants`;
        }

        let notes = "";
        if (g.price <= g.cost) notes = "⚠️COST>PRICE";
        else if (profit < 5) notes = "⚠️Low Mrgn";
        else if (g.shippingType === 'Free') notes = "Free Ship";

        // Shorten Title
        let cleanTitle = p.title.replace("Women's ", "").replace("Sexy ", "").substring(0, 25);
        if (p.title.length > 25) cleanTitle += "..";

        output += `| ${cleanTitle} | ${variantSummary} | $${g.price.toFixed(2)} | $${g.cost.toFixed(2)} | $${g.shippingCost.toFixed(2)} | $${customerTotal.toFixed(2)} | **$${profit.toFixed(2)}** | ${notes} |\n`;
    });
});

fs.writeFileSync('compressed_profit_blueprint.md', output);
console.log("Generated compressed blueprint.");
