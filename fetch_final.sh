#!/bin/bash
# Extract remaining missing products

echo "🔄 Fetching 6 additional products..."

handles=(
  "new-sex-machine-for-woman-adjustable-masturbating-pumping-with-different-accessories-sex-machine-gun-for-men-wireless-machine"
  "realistic-licking-tongue-rose-vibrator-for-women-nipples-clitoral-stimulation-vibrators-sex-toys-for-adult-female-couples-18"
  "rose-sucking-sex-toys-dildo-vibrator-for-women-3in1-thrusting-g-spot-anal-vibrators-stimulator-female-vibrating-egg-adult-toys"
  "sexy-fishnet-bodysuit-women-crotchless-tights-porn-lingerie-ladies-bodystockings-erotic-mesh-body-socks-sex-babydoll-lingerie"
  "sexy-lingerie-women-for-sex-clothes-role-play-adult-games-fishnet-dress-exotic-costumes-transparent-sheath-sex-shop-full-sleeves"
  "winter-solid-lucky-label-letter-embroidery-two-piece-sets-women-sweatshirt-leggings-casual-sporty-tracksuits-female"
)

BASE_URL="https://ova-26.myshopify.com/products"
count=0

for handle in "${handles[@]}"; do
  count=$((count + 1))
  echo "[$count/6] Fetching: ${handle:0:50}..."
  
  curl -s "${BASE_URL}/${handle}.json" > "product_data/${handle}.json" 2>&1
  
  if [ $? -eq 0 ]; then
    echo "  ✅ Success"
  else
    echo "  ❌ Failed"
  fi
  
  sleep 0.5
done

echo ""
echo "✅ Complete! Fetched $count more products"
echo "🔄 Rebuilding product database..."

node build_products.js
