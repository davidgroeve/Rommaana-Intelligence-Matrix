import requests
url = "https://ptnvbmeiexzwfwsjmfwf.supabase.co/storage/v1/object/public/resumes/7f06_be87aa18044c4602a076d81b50f984bb.pdf"
try:
    resp = requests.head(url)
    print(f"Status: {resp.status_code}")
    print(f"Headers: {resp.headers}")
except Exception as e:
    print(f"Error: {e}")
