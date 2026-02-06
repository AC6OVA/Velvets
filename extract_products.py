#!/usr/bin/env python3
"""
NASTY Collection - Shopify Product Scraper
Extracts all products with real CDN images from Shopify API
"""

import json
import requests
from typing import List, Dict

# Base URL for Shopify store
BASE_URL = "https://ova-26.myshopify.com"

# Product handles extracted from collection scan
PRODUCT_HANDLES = [
    "2-piece-sets-women-denim-shorts-suit-sexy-vest-top-strap-backless-jeans-short-pants-pockets-outfits-2025-streetwear-ensemble",
    "2025-autumn-and-winter-new-womens-solid-color-strapless-slim-sexy-big-backless-sleeveless-pencil-jumpsuit-elegant-lady",
    "app-remote-control-telescopic-thrust-vibrator-woman-sex-toys-dildo-charging-heating-vibrator-sex-machine-adult-products-sex-shop",
    "bdsm-bed-set-sex-toy-handcuffs-for-couple-woman-adult-kit-supplies-bdsm-restraints-bed-bondage-rope-sexual-handcuffs-sexy-game",
    "cm-yaya-beach-sexy-sweatsuit-women-two-2-piece-set-outfits-crop-tops-and-lace-up-midi-mini-skirts-matching-set-tracksuit-5-color",
    "cutenew-sexy-coquette-2-piece-set-women-velvet-cross-tank-tops-patchwork-hollow-high-waist-skirts-matching-clubwear-outfits",
    "dulzura-women-2024-autumn-winter-long-sleeves-crop-tops-long-pants-two-piece-matching-sets-tracksuit-wholesale-items-s3613114k",
    "elegant-leopard-print-sheer-bodysuit-high-nylon-lingerie-for-long-sleeve-high-elasticity-full-body-fishnet-design",
    "erotic-crotchless-lingerie-women-hollow-open-bodysuit-thong-sexy-costumes-deep-v-neck-babydoll-lace-dress-porno-underwear-set",
    "erotic-fishnet-bodystocking-temptation-womens-crotchless-transparent-hollow-out-porn-sexy-lingerie-bodysuit-exotic-costumes",
    "new-sheer-micro-bikini-women-sexy-lingerie-erotic-v-shaped-bodysuit-fancy-mini-underwear-porn-cosplay-outfits-backbare-sex-set",
    "one-piece-crotchless-bodystocking-for-sex-transparent-sexy-lingerie-sexiest-bodysuit-erotic-costumes-rose-full-body-stockings",
    "sexy-and-fashionable-womens-elegant-short-dress-with-hanging-neck-backless-bottom-chest-sequin-party-girl-dance-dress",
    "sexy-bodysuit-for-woman-open-bra-crotchless-underwear-sexy-lingerie-lace-bodysuit-lenceria-erotic-mujer-sexi-costumes",
    "sexy-high-waist-wrapped-hip-skirt-women-leather-black-comfortable-split-short-lady-skirt-party-dress-nightclub",
    "sexy-hollow-fishnet-teddies-bodysuit-women-erotic-crotchless-lingerie-full-sleeve-bodystockings-perspective-teddy-mesh-dress",
    "sexy-lingerie-mesh-bodystockings-fishnet-jumpsuit-hollow-see-through-tight-lingerie-erotic-pajamas-elastic-night-club-underwear",
    "ultra-short-crotchless-sexual-dress-ladies-erotic-nightgown-hot-thong-pajama-set-porno-big-backless-bodycon-lingerie-sex-doll",
    "weird-puss-sexy-cross-hollow-women-2-piece-set-tracksuit-slash-neck-fur-patchwork-tops-high-waist-leggings-matching-streetwear",
    "winter-solid-lucky-label-letter-embroidery-two-piece-sets-women-sweatshirt-leggings-casual-sporty-tracksuits-female",
    "women-sexy-adult-fishnet-mesh-bodystockings-lingerie-catsuit-transparent-open-crotch-erotic-clothing-see-through-bodysuits-as001",
    "women-sexy-suspender-mid-length-bodycon-dress-fashion-solid-color-leather-bandage-backless-skinny-split-dress-for-female-mujer",
    "womens-sexy-backless-jumpsuits-top-see-through-full-sleeve-bodysuit-fashion-rompers-activewear-party-nightclub-costume",
    "womens-sleepwear-summer-floral-print-satin-nightgown-casual-sleeveless-backless-slip-night-dress-sexy-nightdress-home-clothes"
]

def fetch_product_data(handle: str) -> Dict:
    """Fetch product data from Shopify JSON API"""
    url = f"{BASE_URL}/products/{handle}.json"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()['product']
    return None

def extract_product_info(product: Dict, index: int) -> Dict:
    """Extract and format product information"""
    
    # Get all images with IDs
    images = [{'id': img['id'], 'src': img['src']} for img in product.get('images', [])]
    
    # Get variants
    variants = []
    for variant in product.get('variants', []):
        variants.append({
            'id': variant['id'],
            'sku': variant['sku'],
            'price': float(variant['price']),
            'option1': variant.get('option1'),
            'option2': variant.get('option2'),
            'option3': variant.get('option3'),
            'image_id': variant.get('image_id'),
            'available': variant.get('available', True),
            'inventory_quantity': variant.get('inventory_quantity', 0)
        })
    
    # Extract base price
    price = float(variants[0]['price']) if variants else 0.0
    
    return {
        'id': f'nc_{str(index+1).zfill(3)}',
        'title': product['title'],
        'description': product.get('body_html', '').strip()[:200],  # First 200 chars
        'handle': product['handle'],
        'price': price,
        'images': images,
        'variants': variants,
        'link': f"{BASE_URL}/products/{product['handle']}"
    }

def main():
    print("🔄 Extracting product data from Shopify...")
    products = []
    
    for i, handle in enumerate(PRODUCT_HANDLES):
        print(f"  [{i+1}/{len(PRODUCT_HANDLES)}] Fetching {handle[:50]}...")
        product_data = fetch_product_data(handle)
        
        if product_data:
            product_info = extract_product_info(product_data, i)
            products.append(product_info)
        else:
            print(f"    ⚠️  Failed to fetch {handle}")
    
    # Save to JSON
    output_file = 'nasty_products_real.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Successfully extracted {len(products)} products")
    print(f"📁 Saved to: {output_file}")
    print(f"\n📊 Summary:")
    print(f"   - Total Products: {len(products)}")
    print(f"   - Total Images: {sum(len(p['images']) for p in products)}")
    print(f"   - Total Variants: {sum(len(p['variants']) for p in products)}")

if __name__ == "__main__":
    main()
