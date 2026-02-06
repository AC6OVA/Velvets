#!/bin/bash
# NASTY Collection - Batch Product Extractor
# Fetches all product data from Shopify JSON API

echo "🔄 Starting batch product extraction..."

# Product handles
handles=(
  "elegant-leopard-print-sheer-bodysuit-high-nylon-lingerie-for-long-sleeve-high-elasticity-full-body-fishnet-design"
  "cm-yaya-beach-sexy-sweatsuit-women-two-2-piece-set-outfits-crop-tops-and-lace-up-midi-mini-skirts-matching-set-tracksuit-5-color"
  "2-piece-sets-women-denim-shorts-suit-sexy-vest-top-strap-backless-jeans-short-pants-pockets-outfits-2025-streetwear-ensemble"
  "2025-autumn-and-winter-new-womens-solid-color-strapless-slim-sexy-big-backless-sleeveless-pencil-jumpsuit-elegant-lady"
  "app-remote-control-telescopic-thrust-vibrator-woman-sex-toys-dildo-charging-heating-vibrator-sex-machine-adult-products-sex-shop"
  "bdsm-bed-set-sex-toy-handcuffs-for-couple-woman-adult-kit-supplies-bdsm-restraints-bed-bondage-rope-sexual-handcuffs-sexy-game"
  "cutenew-sexy-coquette-2-piece-set-women-velvet-cross-tank-tops-patchwork-hollow-high-waist-skirts-matching-clubwear-outfits"
  "dulzura-women-2024-autumn-winter-long-sleeves-crop-tops-long-pants-two-piece-matching-sets-tracksuit-wholesale-items-s3613114k"
  "erotic-crotchless-lingerie-women-hollow-open-bodysuit-thong-sexy-costumes-deep-v-neck-babydoll-lace-dress-porno-underwear-set"
  "erotic-fishnet-bodystocking-temptation-womens-crotchless-transparent-hollow-out-porn-sexy-lingerie-bodysuit-exotic-costumes"
)

BASE_URL="https://ova-26.myshopify.com/products"
count=0

# Create output directory
mkdir -p product_data

# Fetch each product
for handle in "${handles[@]}"; do
  count=$((count + 1))
  echo "[$count/10] Fetching: ${handle:0:50}..."
  
  curl -s "${BASE_URL}/${handle}.json" > "product_data/${handle}.json"
  
  if [ $? -eq 0 ]; then
    echo "  ✅ Success"
  else
    echo "  ❌ Failed"
  fi
  
  sleep 0.5  # Rate limiting
done

echo ""
echo "✅ Extraction complete! Fetched $count products"
echo "📁 Data saved to: product_data/"
