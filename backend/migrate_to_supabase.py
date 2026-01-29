import os
import json
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv
import utils

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def migrate_candidates():
    print("Phase 1: Migrating Candidates...")
    candidates = utils.load_candidates(force_local=True)
    if not candidates:
        print("No candidates found locally.")
        return

    # Prepare for bulk upsert
    # Note: We use 'id' as the unique key if it exists, but since index was used as ID,
    # we should check if they already exist.
    for c in candidates:
        # Map fields to match database schema if necessary
        # Here we'll just push as is, but we should handle types
        payload = {
            "first_name": c.get("first_name"),
            "last_name": c.get("last_name"),
            "email": c.get("email"),
            "phone": c.get("phone"),
            "role": c.get("role"),
            "skills": c.get("skills"),
            "resume_url": c.get("resume_url"),
            "local_filename": c.get("local_filename"),
            "resume_text": c.get("resume_text"),
            "id": c.get("id")
        }
        try:
            supabase.table("candidates").upsert(payload).execute()
        except Exception as e:
            print(f"Failed to upsert candidate {c.get('email')}: {e}")
    print(f"Successfully migrated/updated {len(candidates)} candidates.")

def migrate_feedback_and_status():
    print("\nPhase 2: Migrating Feedback and Status...")
    
    # Load local data
    feedback = utils.load_cache() # Actually utils.load_cache is for metadata_cache, let's use main's paths
    # We can just use the files directly or import from main
    
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    FEEDBACK_FILE = os.path.join(BASE_DIR, "interviews.json")
    STATUS_FILE = os.path.join(BASE_DIR, "status.json")

    if os.path.exists(FEEDBACK_FILE):
        with open(FEEDBACK_FILE, "r") as f:
            fb_data = json.load(f)
            for cid, data in fb_data.items():
                try:
                    supabase.table("interviews_feedback").upsert({
                        "candidate_id": int(cid),
                        "rating": data.get("rating"),
                        "notes": data.get("notes")
                    }).execute()
                except Exception as e:
                    print(f"Failed feedback {cid}: {e}")
            print(f"Migrated {len(fb_data)} feedback entries.")

    if os.path.exists(STATUS_FILE):
        with open(STATUS_FILE, "r") as f:
            st_data = json.load(f)
            for cid, status in st_data.items():
                try:
                    supabase.table("candidate_status").upsert({
                        "candidate_id": int(cid),
                        "status": status
                    }).execute()
                except Exception as e:
                    print(f"Failed status {cid}: {e}")
            print(f"Migrated {len(st_data)} status entries.")

if __name__ == "__main__":
    print("Starting Cloud Migration to Supabase...")
    migrate_candidates()
    migrate_feedback_and_status()
    print("\nMigration Complete! Your dashboard is now cloud-ready.")
