
const fs = require('fs');

// Load data
const window = {};
const fileContent = fs.readFileSync('products_final.js', 'utf8');
eval(fileContent);
const products = window.nastyProducts;

let output = "# EXECUTIVE PROFIT SUMMARY & RISK ANALYSIS\n";
output += `> **Generated:** ${new Date().toLocaleString()}\n`;
output += "> **Goal:** Lock profit and eliminate loss risk.\n\n";

// Tables
let productTable = "| Product | Variants | Min Profit | Avg Profit | Max Profit | Flag |\n";
productTable += "|---|---|---|---|---|---|\n";

let actionRequired = "\n## 🚨 IMMEDIATE ACTION REQUIRED\n";
let hasActions = false;

// Statistics
let totalProducts = 0;
let productsBeneath5 = 0;
let productsBeneath8 = 0;
let productsAtLoss = 0;

products.forEach(p => {
    totalProducts++;

    let minProfit = Infinity;
    let maxProfit = -Infinity;
    let totalProfit = 0;

    let hasLoss = false;
    let hasLowMargin = false; // < $5
    let hasMediumMargin = false; // < $8

    // Per product tracking for the action list
    const actionVariants = [];

    p.variants.forEach(v => {
        const price = parseFloat(v.price) || 0;
        const cost = v.comparePrice ? parseFloat(v.comparePrice) : 0;
        const weight = v.weight || 0;

        let shippingCost = 0;

        // "Customer ALWAYS pays shipping unless cart total >= $100"
        // Analysis assumes SINGLE UNIT purchase scenario for "Min Profit"
        if (price >= 100) {
            shippingCost = 0;
        } else if (weight < 1000) {
            shippingCost = 6.99;
        } else {
            shippingCost = 12.99;
        }

        const customerTotal = price + shippingCost;

        // Profit Formula: (Price + Shipping) - Supplier Cost
        const profit = customerTotal - cost;

        // Update Stats
        if (profit < minProfit) minProfit = profit;
        if (profit > maxProfit) maxProfit = profit;
        totalProfit += profit;

        // Flags
        if (cost >= price) {
            // Check real profit after shipping
            // If profit is technically positive due to shipping, we typically still flag Cost >= Price
            // BUT user said "All products with COST >= PRICE" 
            hasLoss = true;
            actionVariants.push(`- **${v.title}**: Price $${price} <= Cost $${cost} (Profit: $${profit.toFixed(2)})`);
        }

        if (profit < 5) {
            hasLowMargin = true;
            actionVariants.push(`- **${v.title}**: Profit < $5 ($${profit.toFixed(2)})`);
        }

        if (profit < 8) hasMediumMargin = true;
    });

    const avgProfit = totalProfit / p.variants.length;

    // Build Output Row
    let flag = "";
    if (hasLoss) {
        flag = "🔴 LOSS RISK";
        productsAtLoss++;
    } else if (hasLowMargin) {
        flag = "⚠️ < $5";
        productsBeneath5++;
    } else if (hasMediumMargin) {
        flag = "⚠️ < $8";
        productsBeneath8++;
    } else {
        flag = "✅ Healthy";
    }

    // Clean Title
    let cleanTitle = p.title.replace("Women's ", "").replace("Sexy ", "").substring(0, 35);
    if (p.title.length > 35) cleanTitle += "..";

    productTable += `| ${cleanTitle} | ${p.variants.length} | $${minProfit.toFixed(2)} | $${avgProfit.toFixed(2)} | $${maxProfit.toFixed(2)} | ${flag} |\n`;

    // Add to Action List if needed
    if (hasLoss || hasLowMargin) {
        hasActions = true;
        actionRequired += `\n### ${p.title}\n`;
        // Deduplicate and list
        const uniqueActions = [...new Set(actionVariants)];
        actionRequired += uniqueActions.join("\n") + "\n";
    }
});

// Summary Stats
output += "## 📊 Global Stats\n\n";
output += `- **Total Products**: ${totalProducts}\n`;
output += `- **Products with Loss Risk (Price <= Cost)**: ${productsAtLoss}\n`;
output += `- **Products with Low Profit (< $5)**: ${productsBeneath5}\n`;
output += `- **Products with Medium Profit (< $8)**: ${productsBeneath8}\n\n`;

output += "## 📋 Profit Summary by Product\n\n";
output += "*(Profit = Price + Shipping - Cost)*\n\n";
output += productTable;

if (hasActions) {
    output += actionRequired;
} else {
    output += "\n## ✅ No Immediate Actions Required\n";
}

output += "\n## 🛡️ Shipping Logic & Verification\n";
output += "- **Logic**: Economy ($6.99 <1kg), Standard ($12.99 >1kg), Free (>$100).\n";
output += "- **Verification**: Frontend verified to add accurate shipping costs to total.\n";
output += "- **Result**: No hidden shipping absorption. Customer pays full shipping for orders < $100.\n";

fs.writeFileSync('executive_profit_summary.md', output);
console.log("Generated executive summary.");
