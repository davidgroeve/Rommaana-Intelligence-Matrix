import io
import csv
import pypdf
import re
import json
from collections import Counter
import classifier
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Constants
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))
CSV_PATH = os.path.join(DATA_DIR, "Recruitment.csv")
CACHE_PATH = os.path.join(BASE_DIR, "metadata_cache.json")

# Cloud Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"CRITICAL: Supabase init failed: {e}")

def load_cache():
    if os.path.exists(CACHE_PATH):
        try:
            with open(CACHE_PATH, "r") as f:
                return json.load(f)
        except:
            return {}
    return {}

def save_cache(data):
    with open(CACHE_PATH, "w") as f:
        json.dump(data, f, indent=2)

def load_candidates(force_local=False):
    # Attempt to load from Cloud (Supabase) if configured
    if supabase and not force_local:
        try:
            response = supabase.table("candidates").select("*").execute()
            return response.data or []
        except Exception as e:
            print(f"Cloud fetch failed: {e}. Falling back to local.")

    if not os.path.exists(CSV_PATH):
        return []
    
    candidates = []
    # Load cache
    metadata_cache = load_cache()
    auth_cache_updated = False

    try:
        with open(CSV_PATH, mode='r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for index, row in enumerate(reader):
                # precise column names:
                # Submission time,First name,Last name,Email,Phone,Are you currently working?,Attach you Resume
                
                resume_url = row.get("Attach you Resume", "")
                if not resume_url:
                    resume_url = ""
                    
                local_filename = ""
                if resume_url:
                    resume_url = resume_url.strip()
                    path_part = resume_url.split('?')[0]
                    parts = path_part.split('/')
                    if parts:
                        local_filename = parts[-1].strip()
                    
                    if local_filename and not local_filename.lower().endswith('.pdf'):
                        match = re.search(r'([a-zA-Z0-9_-]+\.pdf)', resume_url, re.IGNORECASE)
                        if match:
                            local_filename = match.group(1)
                
                # Check cache for metadata
                cid = str(index)
                metadata = metadata_cache.get(cid, {})
                
                if (not metadata or "text" not in metadata):
                    extraction_source = local_filename if (local_filename and os.path.exists(os.path.join(DATA_DIR, local_filename))) else resume_url
                    
                    if extraction_source:
                        text = get_pdf_text(extraction_source)
                        if text:
                            role = classifier.classify_role(text)
                            meta_entities = classifier.extract_metadata(text)
                            metadata = {
                                "role": role,
                                "skills": meta_entities["skills"],
                                "locations": meta_entities["locations"],
                                "languages": meta_entities["languages"],
                                "text": text
                            }
                            metadata_cache[cid] = metadata
                            auth_cache_updated = True
                        else:
                            metadata = {"role": "Unclassified", "skills": [], "locations": [], "languages": []}
                    else:
                        metadata = {"role": "Unclassified", "skills": [], "locations": [], "languages": []}

                candidates.append({
                    "id": index,
                    "submission_time": row.get("Submission time", ""),
                    "first_name": row.get("First name", ""),
                    "last_name": row.get("Last name", ""),
                    "email": row.get("Email", ""),
                    "phone": row.get("Phone", ""),
                    "working_status": row.get("Are you currently working?", ""),
                    "resume_url": resume_url,
                    "local_filename": local_filename,
                    "role": metadata.get("role", "Unclassified"),
                    "skills": metadata.get("skills", []),
                    "locations": metadata.get("locations", []),
                    "languages": metadata.get("languages", []),
                    "resume_text": metadata.get("text", "")
                })
    except Exception as e:
        print(f"Error reading CSV: {e}")
        return []

    if auth_cache_updated:
        save_cache(metadata_cache)
        
    return candidates

def get_pdf_text(filename_or_url):
    # If it looks like a URL, fetch it
    if filename_or_url.startswith("http"):
        try:
            import requests
            response = requests.get(filename_or_url)
            response.raise_for_status()
            f = io.BytesIO(response.content)
            reader = pypdf.PdfReader(f)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text
        except Exception as e:
            print(f"Error fetching remote PDF {filename_or_url}: {e}")
            return ""

    file_path = os.path.join(DATA_DIR, filename_or_url)
    if not os.path.exists(file_path):
        # Fallback to backend dir
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        alt_path = os.path.join(backend_dir, filename_or_url)
        if os.path.exists(alt_path):
            file_path = alt_path
        else:
            return ""
    
    try:
        reader = pypdf.PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error reading {filename_or_url}: {e}")
        return ""

def score_candidate(resume_text, job_description):
    if not resume_text or not job_description:
        return 0, []
    
    # Normalize text
    def clean_text(text):
        return re.sub(r'[^a-zA-Z0-9\s]', '', text.lower())

    resume_words = set(clean_text(resume_text).split())
    jd_words = clean_text(job_description).split()
    
    # Filter stopwords (basic list to avoid zero-info matches)
    stopwords = {"and", "the", "of", "in", "to", "a", "is", "for", "with", "on", "at", "by", "an", "be", "this", "that", "it", "are", "from", "or", "as", "if", "but", "not"}
    important_keywords = [w for w in jd_words if w not in stopwords and len(w) > 2]
    
    matched_keywords = []
    score = 0
    
    # Simple scoring: +1 for each unique keyword found
    # We could do frequency based, but presence is usually a good first filter
    unique_jd_keywords = set(important_keywords)
    for kw in unique_jd_keywords:
        if kw in resume_words:
            score += 1
            matched_keywords.append(kw)
            
    # Calculate percentage
    max_score = len(unique_jd_keywords)
    final_score = (score / max_score * 100) if max_score > 0 else 0
    
    return round(final_score, 1), matched_keywords
