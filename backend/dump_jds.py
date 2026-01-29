import docx
import os

DOC_PATH = r"C:\Rommaana_C\WixResumes\Candidate_Resumes\_Job Descriptions - Rommaana Sep 25 (1).docx"
doc = docx.Document(DOC_PATH)

with open("jd_dump.txt", "w", encoding="utf-8") as f:
    for para in doc.paragraphs:
        if para.text.strip():
            f.write(para.text + "\n")
