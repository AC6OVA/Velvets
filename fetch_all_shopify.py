import requests
import json
import os
import time

BASE_URL = "https://ova-26.myshopify.com/products.json?limit=250"
OUTPUT_DIR = "product_data"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def fetch_all_products():
    products = []
    page = 1
    url = BASE_URL
    
    print(f"🔄 Starting Fresh Shopify Pull...")

    while True:
        print(f"  - Fetching page {page}...")
        try:
            response = requests.get(url)
            if response.status_code != 200:
                print(f"❌ Failed to fetch: {response.status_code} {response.text}")
                break
                
            data = response.json()
            batch = data.get('products', [])
            
            if not batch:
                break
                
            products.extend(batch)
            print(f"    ✅ Got {len(batch)} products")
            
            # Check for next page (if Shopify uses header-based pagination, normally it's slightly different, 
            # but for simple public .json endpoints without auth, sometimes page=N works or they return all.
            # Actually, standard Shopify public endpoint behavior usually allows basic pagination via page param 
            # or simply gives 250 max. Given the user instructions, we'll try to get everything. 
            # Assuming standard behavior: if 250 returned, there might be more.
            # But the public endpoint often doesn't support deep pagination easily without tokens.
            # However, prompt said "Paginate if required".
            # Let's check typical behavior. Usually ?page=2 works for public json.)
            
            if len(batch) < 250:
                break
                
            page += 1
            url = f"{BASE_URL}&page={page}"
            time.sleep(0.5)
            
        except Exception as e:
            print(f"❌ Error: {e}")
            break

    print(f"✅ Total Products Fetched: {len(products)}")
    
    # Save individual files
    print(f"💾 Saving to {OUTPUT_DIR}/...")
    for p in products:
        # Use handle as filename for readability, or ID for safety. ID is safer.
        # Keeping matching format: product_{id}.json containing {"product": ...}
        # adhering to build_products.js expectation (it expects {product: ...} root object?)
        # Let's check build_products.js line 40: const product = data.product;
        # Yes.
        
        filename = f"{OUTPUT_DIR}/{p['handle']}.json"
        
        # Enforce structure
        wrapped_data = {"product": p}
        
        with open(filename, 'w') as f:
            json.dump(wrapped_data, f, indent=2)
            
    print(f"🎉 Saved {len(products)} file artifacts.")

if __name__ == "__main__":
    fetch_all_products()
