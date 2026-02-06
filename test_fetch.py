import requests
import json

handle = "womens-sexy-backless-jumpsuits-top-see-through-full-sleeve-bodysuit-fashion-rompers-activewear-party-nightclub-costume"
url = f"https://ova-26.myshopify.com/products/{handle}.json"

print(f"Fetching {url}...")
try:
    r = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
    print(f"Status: {r.status_code}")
    print(f"Headers: {r.headers}")
    if r.status_code == 200:
        print("Success!")
        data = r.json()
        print(json.dumps(data, indent=2)[:500])
    else:
        print("Failed.")
except Exception as e:
    print(f"Error: {e}")
