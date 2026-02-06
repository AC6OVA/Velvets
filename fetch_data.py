import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://ova-26.myshopify.com/products.json?limit=250"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, context=ctx) as response:
    data = json.loads(response.read().decode())
    with open('all_products.json', 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Successfully saved {len(data['products'])} products to all_products.json")
