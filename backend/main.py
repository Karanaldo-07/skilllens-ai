from fastapi import FastAPI, File, UploadFile, Form, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from skill_engine import SKILL_GROUPS, extract_skills, calculate_final_score
from roadmap_engine import generate_roadmap
from resume_parser import extract_text_from_pdf
from ai_suggestions import generate_resume_suggestions

from database import SessionLocal, engine
from models import Analysis, Base, User
from auth import hash_password, verify_password, create_access_token

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import letter

import shutil
import os
from typing import Optional


app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

SECRET_KEY = "supersecretkey"
ALGORITHM = "HS256"


# ================= REQUIRED USER =================
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ================= OPTIONAL USER (NEW) =================
def get_user_optional(request: Request) -> Optional[str]:
    auth = request.headers.get("Authorization")

    if not auth:
        return None

    try:
        token = auth.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except:
        return None


# ================= ANALYZE =================
@app.post("/analyze/")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    current_user: Optional[str] = Depends(get_user_optional)
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

    roadmap, total_days = generate_roadmap(fully_missing)

    if match_score < 40:
        readiness = "High Risk - Major skill gaps"
    elif match_score < 70:
        readiness = "Moderate - Needs Improvement"
    elif match_score < 85:
        readiness = "Strong - Interview Possible"
    else:
        readiness = "Interview Ready"

    suggestions = generate_resume_suggestions(
        match_score,
        fully_missing,
        partially_matched,
        resume_skills
    )

    # ================= SAVE ONLY IF LOGGED IN =================
    if current_user:
        db = SessionLocal()

        user = db.query(User).filter(User.email == current_user).first()

        if user:
            db_analysis = Analysis(
                resume_name=file.filename,
                match_score=match_score,
                estimated_days=total_days,
                user_id=user.id
            )

            db.add(db_analysis)
            db.commit()

        db.close()

    return {
        "match_score": match_score,
        "resume_skills": resume_skills,
        "fully_matched": fully_matched,
        "partially_matched": partially_matched,
        "fully_missing": fully_missing,
        "estimated_days_to_ready": total_days,
        "roadmap": roadmap,
        "readiness_level": readiness,
        "suggestions": suggestions
    }


# ================= REGISTER =================
@app.post("/register/")
def register(email: str, password: str):
    db = SessionLocal()

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = User(
        email=email,
        password=hash_password(password)
    )

    db.add(new_user)
    db.commit()
    db.close()

    return {"message": "User registered successfully"}


# ================= LOGIN =================
@app.post("/login/")
def login(email: str, password: str):
    db = SessionLocal()

    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.email})

    db.close()

    return {"access_token": token}


# ================= HISTORY =================
@app.get("/history/")
def get_history(current_user: str = Depends(get_current_user)):
    db = SessionLocal()

    user = db.query(User).filter(User.email == current_user).first()

    records = db.query(Analysis).filter(
        Analysis.user_id == user.id
    ).all()

    db.close()
    return records


@app.delete("/history/{analysis_id}")
def delete_history(
    analysis_id: int,
    current_user: str = Depends(get_current_user)
):
    db = SessionLocal()

    user = db.query(User).filter(User.email == current_user).first()

    record = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == user.id
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Not found")

    db.delete(record)
    db.commit()
    db.close()

    return {"message": "Deleted"}


# ================= REPORT =================
@app.post("/generate-report/")
def generate_report(
    match_score: float = Form(...),
    readiness: str = Form(...),
    missing_skills: str = Form(...),
    days: int = Form(...),
    current_user: str = Depends(get_current_user)
):
    file_path = "report.pdf"

    doc = SimpleDocTemplate(file_path, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("SkillLens AI Report", styles["Title"]))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Match Score: {match_score}%", styles["Normal"]))
    elements.append(Paragraph(f"Readiness Level: {readiness}", styles["Normal"]))
    elements.append(Paragraph(f"Estimated Days: {days}", styles["Normal"]))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("Missing Skills:", styles["Heading2"]))
    elements.append(Paragraph(missing_skills, styles["Normal"]))

    doc.build(elements)

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename="SkillLens_Report.pdf"
    )
