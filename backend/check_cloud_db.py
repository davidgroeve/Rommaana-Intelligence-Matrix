import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: credentials missing")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_db():
    res = supabase.table("candidates").select("id, first_name, last_name, local_filename, resume_url").limit(5).execute()
    print("Sample Candidates in Cloud:")
    for c in res.data:
        url = c.get("resume_url")
        text = c.get("resume_text", "")
        print(f"ID: {c['id']} | Name: {c['first_name']} {c['last_name']} | Filename: {c['local_filename']} | TextLen: {len(text)}")
        if url:
            print(f"  URL: {url}")
            try:
                import requests
                r = requests.head(url)
                print(f"  Status: {r.status_code}")
            except:
                print("  Status: Error checking")

if __name__ == "__main__":
    check_db()
