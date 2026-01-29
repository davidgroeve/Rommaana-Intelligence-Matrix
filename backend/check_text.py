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
    res = supabase.table("candidates").select("id, first_name, resume_text").limit(10).execute()
    print("Cloud Data Check:")
    for c in res.data:
        text = c.get("resume_text")
        length = len(text) if text else 0
        print(f"ID: {c['id']} | Name: {c['first_name']} | TextLen: {length}")

if __name__ == "__main__":
    check_db()
