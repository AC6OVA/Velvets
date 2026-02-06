#!/bin/bash
# NASTY Collection - Remaining Products Extractor

echo "🔄 Fetching remaining 20 products..."

handles=(
  "new-sheer-micro-bikini-women-sexy-lingerie-erotic-v-shaped-bodysuit-fancy-mini-underwear-porn-cosplay-outfits-backbare-sex-set"
  "one-piece-crotchless-bodystocking-for-sex-transparent-sexy-lingerie-sexiest-bodysuit-erotic-costumes-rose-full-body-stockings"
  "sexy-and-fashionable-womens-elegant-short-dress-with-hanging-neck-backless-bottom-chest-sequin-party-girl-dance-dress"
  "sexy-bodysuit-for-woman-open-bra-crotchless-underwear-sexy-lingerie-lace-bodysuit-lenceria-erotic-mujer-sexi-costumes"
  "sexy-high-waist-wrapped-hip-skirt-women-leather-black-comfortable-split-short-lady-skirt-party-dress-nightclub"
  "sexy-hollow-fishnet-teddies-bodysuit-women-erotic-crotchless-lingerie-full-sleeve-bodystockings-perspective-teddy-mesh-dress"
  "sexy-lingerie-mesh-bodystockings-fishnet-jumpsuit-hollow-see-through-tight-lingerie-erotic-pajamas-elastic-night-club-underwear"
  "ultra-short-crotchless-sexual-dress-ladies-erotic-nightgown-hot-thong-pajama-set-porno-big-backless-bodycon-lingerie-sex-doll"
  "weird-puss-sexy-cross-hollow-women-2-piece-set-tracksuit-slash-neck-fur-patchwork-tops-high-waist-leggings-matching-streetwear"
  "winter-solid-lucky-label-letter-embroidery-two-piece-sets-women-sweatshirt-leggings-casual-sporty-tracksuits-female"
  "women-sexy-adult-fishnet-mesh-bodystockings-lingerie-catsuit-transparent-open-crotch-erotic-clothing-see-through-bodysuits-as001"
  "women-sexy-suspender-mid-length-bodycon-dress-fashion-solid-color-leather-bandage-backless-skinny-split-dress-for-female-mujer"
  "womens-sexy-backless-jumpsuits-top-see-through-full-sleeve-bodysuit-fashion-rompers-activewear-party-nightclub-costume"
  "womens-sleepwear-summer-floral-print-satin-nightgown-casual-sleeveless-backless-slip-night-dress-sexy-nightdress-home-clothes"
)

BASE_URL="https://ova-26.myshopify.com/products"
count=0

for handle in "${handles[@]}"; do
  count=$((count + 1))
  echo "[$count/14] Fetching: ${handle:0:50}..."
  
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
