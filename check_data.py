import re
import json

try:
    with open('products_final.js', 'r') as f:
        content = f.read()

    # Extract the array content
    # Look for "const nastyCollectionProducts = [" and the ending "];"
    start = content.find('[')
    end = content.rfind(']') + 1
    
    json_str = content[start:end]
    
    # Python's JSON parser is strict, JS might have trailing commas or comments.
    # The file seems to be auto-generated JSON-like structure.
    # Let's try to load it.
    products = json.loads(json_str)

    print(f"Loaded {len(products)} products.")

    products_with_variance = []
    
    for p in products:
        title = p.get('title', 'Unknown')[:30]
        variants = p.get('variants', [])
        
        images = [v.get('image') for v in variants if v.get('image')]
        unique_images = set(images)
        
        if len(unique_images) > 1:
            products_with_variance.append({
                'id': p.get('id'),
                'title': title,
                'unique_count': len(unique_images),
                'total_variants': len(variants),
                'example_image_1': list(unique_images)[0],
                'example_image_2': list(unique_images)[1]
            })

    if not products_with_variance:
        print("CRITICAL: No products found with distinct variant images.")
        print("All variants for every product share the exact same image URL.")
    else:
        print(f"Found {len(products_with_variance)} products with verifiable visual variants.")
        for p in products_with_variance:
            print(f"- [{p['id']}] {p['title']} ({p['unique_count']} unique images / {p['total_variants']} variants)")

except Exception as e:
    print(f"Error parsing: {e}")
