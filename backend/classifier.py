import re

# Keyword Dictionaries
ROLES = {
    "Business Development / Operations Intern": ["business development", "operations", "sales", "marketing", "bdr", "sdr", "strategy", "growth", "intern"],
    "Junior Software Engineer": ["junior", "entry level", "graduate", "associate", "developer", "software engineer", "computer science"],
    "Senior Software Engineer": ["senior", "lead", "architect", "principal", "staff", "years experience", "expert", "advanced"],
    "Software Engineer Internship (Europe)": ["intern", "internship", "europe", "germany", "uk", "france", "remote eu", "summer"],
    "Software Engineer Internship (Riyadh)": ["intern", "internship", "riyadh", "saudi", "ksa", "middle east", "summer"],
    "UX Designer Intern": ["ux", "ui", "product design", "designer", "figma", "wireframe", "prototype", "user experience", "intern"]
}

SKILLS = [
    "Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "C++", "C#", "SQL", "NoSQL", 
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Git", "Figma", "Photoshop", "Salesforce", 
    "Excel", "PowerPoint", "Communication", "Leadership", "Agile", "Scrum", "FastAPI", "Django",
    "Insurtech", "Cloud Run", "PostgreSQL", "Machine Learning", "Algorithms", "Backend",
    "B2B", "UX Design", "UI Design", "Product Design", "User Research", "Wireframes",
    "Prototypes", "Digital Onboarding", "Embedded Insurance", "Sales", "Operations",
    "Compliance", "Strategic Planning", "Market Research", "Financial Forecasting",
    "Claude Code", "AI-Assisted Development", "Regulatory Compliance", "Embedded Insurance",
    "Policy Issuance", "Customer Success", "Market Analysis", "B2B Sales"
]

LOCATIONS = [
    "Riyadh", "Jeddah", "Dubai", "London", "Berlin", "Paris", "New York", "San Francisco", "Remote", "Cairo", "Amman", "India", "Pakistan"
]

LANGUAGES = [
    "English", "Arabic", "French", "German", "Spanish", "Urdu", "Hindi"
]

def classify_role(text):
    text_lower = text.lower()
    scores = {role: 0 for role in ROLES}
    
    # Simple keyword matching
    for role, keywords in ROLES.items():
        for kw in keywords:
            if kw in text_lower:
                scores[role] += 1
                
    # Heuristics for "Senior" vs "Junior"
    if "senior" in text_lower or "lead" in text_lower or "5+ years" in text_lower:
        scores["Senior Software Engineer"] += 2
    if "intern" in text_lower:
        # Boost intern roles
        for r in ROLES:
            if "Intern" in r:
                scores[r] += 1
    
    # Find max score
    best_role = max(scores, key=scores.get)
    if scores[best_role] == 0:
        return "Unclassified" # Fallback
    
    return best_role

def extract_metadata(text):
    text_lower = text.lower()
    
    found_skills = []
    for skill in SKILLS:
        # Check for word boundary to avoid substrings (e.g., "Java" in "JavaScript")
        if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
            found_skills.append(skill)
            
    found_locations = []
    for loc in LOCATIONS:
        if loc.lower() in text_lower:
            found_locations.append(loc)
            
    found_languages = []
    for lang in LANGUAGES:
         if re.search(r'\b' + re.escape(lang.lower()) + r'\b', text_lower):
            found_languages.append(lang)

    return {
        "skills": found_skills,
        "locations": found_locations,
        "languages": found_languages
    }
