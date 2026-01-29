import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def update_urls():
    print("Fetching candidates from cloud...")
    res = supabase.table("candidates").select("id, local_filename").execute()
    candidates = res.data
    
    if not candidates:
        print("No candidates found in Supabase.")
        return

    print(f"Updating {len(candidates)} candidates...")
    
    # Base URL for public storage objects
    # Pattern: https://[ref].supabase.co/storage/v1/object/public/[bucket]/[filename]
    project_ref = SUPABASE_URL.split("//")[1].split(".")[0]
    base_storage_url = f"https://{project_ref}.supabase.co/storage/v1/object/public/resumes"

    for c in candidates:
        cid = c["id"]
        filename = c.get("local_filename")
        
        if filename:
            public_url = f"{base_storage_url}/{filename}"
            print(f"Linking ID {cid} -> {filename}")
            try:
                supabase.table("candidates").update({"resume_url": public_url}).eq("id", cid).execute()
            except Exception as e:
                print(f"Failed to update {cid}: {e}")
        else:
            print(f"ID {cid} has no filename, skipping.")

    print("\nURL Linking Complete! Your intelligence matrix is now connected to the cloud files.")

if __name__ == "__main__":
    update_urls()
