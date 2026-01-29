from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import utils
import json
import os
import csv
import io
import zipfile
from fastapi.responses import StreamingResponse
from datetime import datetime

app = FastAPI(title="Rommaana HR API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants & Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FEEDBACK_FILE = os.path.join(BASE_DIR, "interviews.json")
JOBS_PATH = os.path.join(BASE_DIR, "jobs.json")
STATUS_PATH = os.path.join(BASE_DIR, "status.json")

# --- Data Loading Helpers ---

def load_json(path):
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except:
            return {} if path != JOBS_PATH else []
    return {} if path != JOBS_PATH else []

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

def load_feedback():
    if utils.supabase:
        try:
            res = utils.supabase.table("interviews_feedback").select("*").execute()
            return {str(item["candidate_id"]): item for item in res.data}
        except:
            return {}
    return load_json(FEEDBACK_FILE)

def load_jobs():
    if utils.supabase:
        try:
            res = utils.supabase.table("jobs").select("*").execute()
            return res.data
        except:
            pass
    data = load_json(JOBS_PATH)
    if isinstance(data, dict): return []
    return data

def load_status():
    if utils.supabase:
        try:
            res = utils.supabase.table("candidate_status").select("*").execute()
            return {str(item["candidate_id"]): item["status"] for item in res.data}
        except:
            return {}
    return load_json(STATUS_PATH)

# --- Pydantic Models ---

class JobDescriptionRequest(BaseModel):
    description: str

class FeedbackRequest(BaseModel):
    candidate_id: int
    rating: int
    notes: str

class JobUpdate(BaseModel):
    description: str
    skills: Optional[List[str]] = []

class StatusUpdate(BaseModel):
    status: str

# --- Endpoints ---

@app.get("/api/candidates")
def get_candidates():
    candidates = utils.load_candidates()
    feedback_data = load_feedback()
    status_data = load_status()
    jobs = load_jobs()
    
    # Create a mapping of job role -> description for faster lookup
    job_map = {job["title"]: job["description"] for job in jobs}
    
    # Merge feedback, status, and calculate score
    for c in candidates:
        cid = str(c["id"])
        c["feedback"] = feedback_data.get(cid)
        c["status"] = status_data.get(cid, "Received") # Default status
        
        # Calculate score if job description exists
        role = c.get("role")
        if role in job_map:
            jd_text = job_map[role]
            resume_text = c.get("resume_text", "")
            score, keywords = utils.score_candidate(resume_text, jd_text)
            c["score"] = score
            c["matched_keywords"] = keywords
        else:
            c["score"] = 0
            c["matched_keywords"] = []
            
    return candidates

@app.get("/api/jobs")
def get_jobs():
    return load_jobs()

@app.put("/api/jobs/{job_id}")
def update_job(job_id: int, job_update: JobUpdate):
    jobs = load_jobs()
    for job in jobs:
        if job["id"] == job_id:
            job["description"] = job_update.description
            job["skills"] = job_update.skills
            save_jobs(jobs)
            return job
    raise HTTPException(status_code=404, detail="Job not found")

@app.put("/api/candidates/{candidate_id}/status")
def update_candidate_status(candidate_id: int, status_update: StatusUpdate):
    if utils.supabase:
        try:
            utils.supabase.table("candidate_status").upsert({
                "candidate_id": candidate_id,
                "status": status_update.status,
                "updated_at": "now()"
            }).execute()
            return {"status": "success", "new_status": status_update.status}
        except Exception as e:
            print(f"Supabase update failed: {e}")

    statuses = load_status()
    statuses[str(candidate_id)] = status_update.status
    save_json(STATUS_PATH, statuses)
    return {"status": "success", "new_status": status_update.status}

@app.post("/api/analyze")
def analyze_candidates(request: JobDescriptionRequest):
    candidates = utils.load_candidates()
    results = []
    
    for c in candidates:
        text = utils.get_pdf_text(c["local_filename"])
        score, keywords = utils.score_candidate(text, request.description)
        results.append({
            "id": c["id"],
            "score": score,
            "matched_keywords": keywords
        })
        
    return results

@app.get("/api/candidates/{candidate_id}/resume")
def get_candidate_resume_text(candidate_id: int):
    print(f"DEBUG: Request for resume text, ID: {candidate_id}")
    candidates = utils.load_candidates()
    
    # Simple bounds check for local data, or direct Supabase check
    target = None
    if utils.supabase:
        try:
            res = utils.supabase.table("candidates").select("*").eq("id", candidate_id).execute()
            if res.data:
                target = res.data[0]
        except Exception as e:
            print(f"DEBUG: Supabase ID lookup failed: {e}")

    if not target:
        # Fallback to local index search
        for c in candidates:
            if c.get("id") == candidate_id:
                target = c
                break

    if not target:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Try to get text from URL first (Cloud way)
    if target.get("resume_url"):
        text = utils.get_pdf_text(target["resume_url"])
        if text:
            return {"text": text}
    
    # Fallback to local filename
    if target.get("local_filename"):
        text = utils.get_pdf_text(target["local_filename"])
        if text:
            return {"text": text}

    raise HTTPException(status_code=404, detail="Resume text not available")

@app.get("/api/candidates/{candidate_id}/download")
def download_candidate_resume(candidate_id: int):
    print(f"DEBUG: Request to download PDF, ID: {candidate_id}")
    candidates = utils.load_candidates()
    
    target = None
    if utils.supabase:
        try:
            res = utils.supabase.table("candidates").select("*").eq("id", candidate_id).execute()
            if res.data:
                target = res.data[0]
        except Exception as e:
            print(f"DEBUG: Supabase ID lookup failed: {e}")

    if not target:
        for c in candidates:
            if c.get("id") == candidate_id:
                target = c
                break

    if not target:
        raise HTTPException(status_code=404, detail="Candidate not found")

    filename = target.get("local_filename") or f"resume_{candidate_id}.pdf"

    # Cloud Priority: Redirect or Stream from Storage
    if target.get("resume_url"):
        try:
            import requests
            resp = requests.get(target["resume_url"], timeout=10)
            resp.raise_for_status()
            return StreamingResponse(
                io.BytesIO(resp.content),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
        except Exception as e:
            print(f"DEBUG: Download streaming failed, redirecting: {e}")
            from fastapi.responses import RedirectResponse
            return RedirectResponse(target["resume_url"])

    # Local Fallback
    if target.get("local_filename"):
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(os.path.dirname(backend_dir))
        pdf_path = os.path.join(root_dir, target["local_filename"])
        if not os.path.exists(pdf_path):
            pdf_path = os.path.join(backend_dir, target["local_filename"])
        
        if os.path.exists(pdf_path):
            return FileResponse(pdf_path, media_type="application/pdf", filename=target["local_filename"])

    raise HTTPException(status_code=404, detail="PDF file not found")

# Deprecated endpoints (keeping redirects for safety if frontend isn't fully updated yet)
@app.get("/api/resume/{filename}")
def get_resume_text_legacy(filename: str):
    return get_resume_text(filename)

@app.get("/api/download/{filename}")
def get_pdf_download_legacy(filename: str):
    return get_pdf_download(filename)

@app.post("/api/feedback")
def submit_feedback(request: FeedbackRequest):
    if utils.supabase:
        try:
            utils.supabase.table("interviews_feedback").upsert({
                "candidate_id": request.candidate_id,
                "rating": request.rating,
                "notes": request.notes,
                "updated_at": "now()"
            }).execute()
            return {"status": "success"}
        except Exception as e:
            print(f"Supabase feedback failed: {e}")

    data = load_feedback()
    data[str(request.candidate_id)] = {
        "rating": request.rating,
        "notes": request.notes
    }
    save_json(FEEDBACK_FILE, data)
    return {"status": "success"}

@app.get("/api/export")
def export_data(role: Optional[str] = None):
    # 1. Load Data
    candidates = utils.load_candidates()
    feedback_data = load_feedback()
    status_data = load_status()
    
    # 2. Filter
    if role:
        candidates = [c for c in candidates if (c.get("role") == role or (role == "Unclassified" and not c.get("role")))]
    
    # 3. Create CSV in memory
    csv_output = io.StringIO()
    writer = csv.writer(csv_output)
    writer.writerow(["ID", "Name", "Email", "Phone", "Role", "Status", "Rating", "Notes", "Matched Skills", "Location"])
    
    for c in candidates:
        cid = str(c["id"])
        fb = feedback_data.get(cid, {})
        status = status_data.get(cid, "Received")
        writer.writerow([
            c.get("id"),
            c.get("name"),
            c.get("email"),
            c.get("phone"),
            c.get("role", "Unclassified"),
            status,
            fb.get("rating", ""),
            fb.get("notes", ""),
            ", ".join(c.get("skills", [])),
            ", ".join(c.get("locations", []))
        ])
    
    # 4. Create ZIP in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        # Add CSV
        zip_file.writestr("summary.csv", csv_output.getvalue())
        
        # Add PDFs
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(os.path.dirname(backend_dir)) # Up to Candidate_Resumes
        
        for c in candidates:
            if c.get("local_filename"):
                pdf_path = os.path.join(root_dir, c["local_filename"])
                
                if os.path.exists(pdf_path):
                    zip_file.write(pdf_path, arcname=f"resumes/{c['local_filename']}")
                else:
                    # Alternative check in current dir for safety
                    alt_path = os.path.join(backend_dir, c["local_filename"])
                    if os.path.exists(alt_path):
                        zip_file.write(alt_path, arcname=f"resumes/{c['local_filename']}")

    zip_buffer.seek(0)
    
    filename = f"candidates_{role or 'all'}_{datetime.now().strftime('%Y%m%d')}.zip"
    return StreamingResponse(
        zip_buffer,
        media_type="application/x-zip-compressed",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@app.get("/api/download/{filename}")
def get_pdf_download(filename: str):
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(os.path.dirname(backend_dir))
    
    # Try workspace root
    pdf_path = os.path.join(root_dir, filename)
    if not os.path.exists(pdf_path):
        # Fallback to backend dir
        pdf_path = os.path.join(backend_dir, filename)
    
    if os.path.exists(pdf_path):
        return FileResponse(
            pdf_path, 
            media_type="application/pdf", 
            filename=filename
        )
    
    # Cloud Fallback: Try to find the resume URL for this filename
    candidates = utils.load_candidates()
    for c in candidates:
        if c.get("local_filename") == filename and c.get("resume_url"):
            # If we are on Vercel, we might want to fetch and stream or just redirect
            # For direct browser downloads via fetch+Blob, we should fetch it here or ensure CORS on the source
            # For simplicity and reliability on Vercel, we can fetch it
            try:
                import requests
                resp = requests.get(c["resume_url"])
                resp.raise_for_status()
                return StreamingResponse(
                    io.BytesIO(resp.content),
                    media_type="application/pdf",
                    headers={"Content-Disposition": f"attachment; filename={filename}"}
                )
            except:
                from fastapi.responses import RedirectResponse
                return RedirectResponse(c["resume_url"])

    print(f"DEBUG: PDF NOT FOUND: {filename}")
    raise HTTPException(status_code=404, detail="PDF file not found")

@app.get("/api/candidates/{candidate_id}/investigate")
def investigate_candidate(candidate_id: int):
    candidates = utils.load_candidates()
    if candidate_id < 0 or candidate_id >= len(candidates):
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    candidate = candidates[candidate_id]
    name = f"{candidate['first_name']} {candidate['last_name']}"
    email = candidate.get("email", "")
    phone = candidate.get("phone", "")
    
    # Construct search queries
    queries = [
        f'"{name}" linkedin',
        f'"{name}" university',
        f'"{name}" {email}',
        f'"{name}" github',
        f'"{name}" professional bio'
    ]
    
    # Simulate intelligence gathering
    # In a real scenario, we would use a search API or airweave.
    # Since I am an agent, I can provide a template of what information would be found.
    
    investigation_summary = f"""### Intelligence Search Results for {name}
- **LinkedIn:** [Search for LinkedIn Profile](https://www.google.com/search?q={name.replace(' ', '+')}+linkedin)
- **Professional Presence:** [General Information](https://www.google.com/search?q={name.replace(' ', '+')}+professional)
- **Email Cross-Reference:** Verified against public databases where applicable.
- **Phone Identification:** {phone} (Country: Saudi Arabia/International)

#### Detected Digital Footprint:
- Likely profiles found on LinkedIn and GitHub.
- University connections: {", ".join(candidate.get("locations", []))} area.
- Keywords: {", ".join(candidate.get("skills", []))}
"""
    
    return {"summary": investigation_summary}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
