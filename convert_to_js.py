import json

with open('all_products.json', 'r') as f:
    data = json.load(f)

# Attach to window explicitly
js_content = f"window.products = {json.dumps(data['products'], indent=2)};"

with open('products.js', 'w') as f:
    f.write(js_content)

print("Created products.js with window attachment")
