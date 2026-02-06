import json
import os
import shutil

# Config
DUMP_FILE = 'shopify_full_dump.json'
OUTPUT_DIR = 'product_data'

def process_dump():
    # Read Dump
    print(f"Reading {DUMP_FILE}...")
    try:
        with open(DUMP_FILE, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading dump file: {e}")
        return

    products = data.get('products', [])
    print(f"Found {len(products)} products.")

    # Prepare Output Directory
    if os.path.exists(OUTPUT_DIR):
        # shutil.rmtree(OUTPUT_DIR) # Optional: Clean start
        pass
    else:
        os.makedirs(OUTPUT_DIR)

    # Write Individual Files
    count = 0
    for p in products:
        handle = p.get('handle')
        if not handle:
            continue
        
        filename = f"{OUTPUT_DIR}/{handle}.json"
        with open(filename, 'w') as f:
            # Wrap in "product" key if the original individual fetch format used it
            # Standard Shopify API individual return is {"product": {...}}
            # But the list returns objects directly.
            # Let's check what build_products.js expects.
            # build_products.js does: const product = JSON.parse(fs.readFileSync(file, 'utf8')).product;
            # So we MUST wrap it in {"product": p}
            json.dump({"product": p}, f, indent=2)
        
        count += 1

    print(f"Success! Wrote {count} product files to {OUTPUT_DIR}/")

if __name__ == "__main__":
    process_dump()
