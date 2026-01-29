import docx
import json
import re
import os

DOC_PATH = r"C:\Rommaana_C\WixResumes\Candidate_Resumes\_Job Descriptions - Rommaana Sep 25 (1).docx"
OUTPUT_PATH = r"C:\Rommaana_C\WixResumes\Candidate_Resumes\dashboard\backend\jobs.json"

# Known Titles to help split the document
KNOWN_TITLES = [
    "Operations Manager Associate",
    "Junior Software Engineer",
    "Business Development / Operations CO-OP Trainee",
    "Product Designer",
    "Sales & Operations Trainee",
    "Senior Software Engineer",
    # Mappings/Aliases encountered in text
    "Business Development / Operations Intern",
    "UX Designer Intern" 
]

def parse_docx():
    if not os.path.exists(DOC_PATH):
        print(f"Error: File not found at {DOC_PATH}")
        return

    doc = docx.Document(DOC_PATH)
    jobs = []
    current_job = {}
    buffer = []
    
    # Simple state machine
    # We iterate paragraphs. If a paragraph looks like a title, we save current job and start new.
    
    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
            
        # Check if this line is a Title
        is_title = False
        for title in KNOWN_TITLES:
            if text.startswith(title) or (title in text and ("HIRING" in text or len(text) < 60)):
                is_title = True
                break
        
        if is_title:
            # Save previous job
            if current_job:
                current_job["description"] = "\n".join(buffer)
                jobs.append(current_job)
            
            # Start new job
            current_job = {
                "id": len(jobs) + 1,
                "title": text.replace("- HIRING", "").strip(),
                "description": "",
                "skills": [],
                "responsibilities": [],
                "location": "Riyadh (Hybrid)" # Default
            }
            buffer = []
        else:
            # Add to buffer
            buffer.append(text)
            
            # Extract basic metadata on the fly
            lower_text = text.lower()
            if "skills:" in lower_text or "what we’re looking for" in lower_text:
                pass # marker
            
            # Simple list detection for skills could go here, but doing it post-processing
            # or in the description is safer for now.
    
    # Save last job
    if current_job:
        current_job["description"] = "\n".join(buffer)
        jobs.append(current_job)
        
    # Post-process to clean up and extract specific fields if possible
    for job in jobs:
        desc = job["description"]
        # Try to extract location
        if "Remote" in desc:
            job["location"] = "Remote"
        elif "Europe" in desc:
            job["location"] = "Europe"
            
    # Save to JSON
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(jobs, f, indent=2)
    
    print(f"Successfully parsed {len(jobs)} jobs to {OUTPUT_PATH}")

if __name__ == "__main__":
    parse_docx()
