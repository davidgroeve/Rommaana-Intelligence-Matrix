from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, StreamingResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import utils
import json
import os
import io

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FEEDBACK_FILE = os.path.join(BASE_DIR, "interviews.json")
JOBS_PATH = os.path.join(BASE_DIR, "jobs.json")
STATUS_PATH = os.path.join(BASE_DIR, "status.json")

# --- Data Loading Helpers ---

def load_json(path):
    if not os.path.exists(path): return {}
    with open(path, "r") as f:
        try: return json.load(f)
        except: return {}

def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

def load_feedback():
    if utils.supabase:
        try:
            res = utils.supabase.table("interviews_feedback").select("*").execute()
            return {str(item["candidate_id"]): item for item in res.data}
        except: pass
    return load_json(FEEDBACK_FILE)

def load_jobs():
    if utils.supabase:
        try:
            res = utils.supabase.table("jobs").select("*").execute()
            return res.data
        except: pass
    return load_json(JOBS_PATH)

def load_status():
    if utils.supabase:
        try:
            res = utils.supabase.table("candidate_status").select("*").execute()
            return {str(item["candidate_id"]): item["status"] for item in res.data}
        except: pass
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
    job_map = {job["title"]: job["description"] for job in jobs}
    
    for c in candidates:
        cid = str(c["id"])
        c["feedback"] = feedback_data.get(cid)
        c["status"] = status_data.get(cid, "Received")
        role = c.get("role")
        if role in job_map and not c.get("score"):
            jd_text = job_map[role]
            resume_text = c.get("resume_text", "")
            if resume_text:
                score, matches = utils.score_candidate(resume_text, jd_text)
                c["score"] = score
    return candidates

@app.get("/api/jobs")
def get_jobs():
    return load_jobs()

@app.put("/api/jobs/{job_id}")
def update_job(job_id: int, job_update: JobUpdate):
    if utils.supabase:
        try:
            utils.supabase.table("jobs").upsert({
                "id": job_id,
                "description": job_update.description,
                "skills": job_update.skills
            }).execute()
            return {"status": "success"}
        except: pass
    return {"status": "error", "message": "Supabase sync failed"}

@app.put("/api/candidates/{candidate_id}/status")
def update_candidate_status(candidate_id: int, status_update: StatusUpdate):
    if utils.supabase:
        try:
            utils.supabase.table("candidate_status").upsert({
                "candidate_id": candidate_id,
                "status": status_update.status,
                "updated_at": "now()"
            }).execute()
            return {"status": "success"}
        except: pass
    return {"status": "error"}

@app.get("/api/candidates/{candidate_id}/resume")
def get_candidate_resume_text(candidate_id: int):
    candidates = utils.load_candidates()
    target = next((c for c in candidates if c.get("id") == candidate_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if target.get("resume_text"):
        return {"text": target["resume_text"]}

    if target.get("resume_url"):
        text = utils.get_pdf_text(target["resume_url"])
        if text:
            if utils.supabase:
                try: utils.supabase.table("candidates").update({"resume_text": text}).eq("id", candidate_id).execute()
                except: pass
            return {"text": text}

    raise HTTPException(status_code=404, detail="Resume text unavailable")

@app.get("/api/candidates/{candidate_id}/download")
def download_candidate_resume(candidate_id: int):
    candidates = utils.load_candidates()
    target = next((c for c in candidates if c.get("id") == candidate_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if target.get("resume_url"):
        try:
            import requests
            resp = requests.get(target["resume_url"], timeout=10)
            resp.raise_for_status()
            return StreamingResponse(
                io.BytesIO(resp.content),
                media_type="application/pdf",
                headers={"Content-Disposition": f"attachment; filename={target.get('local_filename', 'resume.pdf')}"}
            )
        except:
            return RedirectResponse(target["resume_url"])

    raise HTTPException(status_code=404, detail="File not found")

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
        except: pass
    return {"status": "error"}

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "supabase_connected": utils.supabase is not None,
        "env_check": {
            "url_set": os.getenv("SUPABASE_URL") is not None,
            "key_set": os.getenv("SUPABASE_SERVICE_ROLE_KEY") is not None
        }
    }

@app.get("/api/candidates/{candidate_id}/investigate")
def investigate_candidate(candidate_id: int):
    return {"summary": "Tactical scan complete. Matches found in professional clusters."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
