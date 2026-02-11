from fastapi import FastAPI, File, UploadFile, Form
from skill_engine import SKILL_GROUPS
from roadmap_engine import generate_roadmap


import shutil
import os

from resume_parser import extract_text_from_pdf
from skill_engine import extract_skills, calculate_final_score
from fastapi.middleware.cors import CORSMiddleware

        


app = FastAPI()

app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.post("/analyze/")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    resume_text = extract_text_from_pdf(file_path)

    resume_skills = extract_skills(resume_text)
    jd_skills = extract_skills(job_description)

    fully_matched = []
    partially_matched = []
    fully_missing = []

    for jd_skill in jd_skills:
        if jd_skill in resume_skills:
            fully_matched.append(jd_skill)
        else:
            partial = False
            for group in SKILL_GROUPS.values():
                if jd_skill in group:
                    if any(skill in resume_skills for skill in group):
                        partially_matched.append(jd_skill)
                        partial = True
                        break
            if not partial:
                fully_missing.append(jd_skill)


    match_score = calculate_final_score(
    resume_text,
    job_description,
    resume_skills,
    jd_skills
    )

    print("Resume skills:", resume_skills)
    print("JD skills:", jd_skills)
    print("Matched:", list(set(resume_skills) & set(jd_skills)))

    roadmap, total_days = generate_roadmap(fully_missing)
    if match_score < 40:
        readiness = "High Risk - Major skill gaps"
    elif match_score < 70:
        readiness = "Moderate - Needs Improvement"
    elif match_score < 85:
        readiness = "Strong - Interview Possible"
    else:
        readiness = "Interview Ready"



    return {
    "match_score": match_score,
    "resume_skills": resume_skills,
    "fully_matched": fully_matched,
    "partially_matched": partially_matched,
    "fully_missing": fully_missing,
    "estimated_days_to_ready": total_days,
    "roadmap": roadmap,
    "readiness_level": readiness

    } 


