from fastapi import BackgroundTasks, FastAPI, File, UploadFile, Form, Depends, HTTPException, Request
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import text
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from pydantic import BaseModel
from xml.sax.saxutils import escape

from skill_engine import SKILL_GROUPS, extract_skills, calculate_final_score
from roadmap_engine import generate_roadmap
from resume_parser import extract_text_from_pdf
from ai_suggestions import generate_resume_suggestions

from database import SessionLocal, engine
from models import Analysis, Base, User
from auth import hash_password, verify_password, create_access_token
from config import SECRET_KEY, ALGORITHM, ALLOWED_ORIGINS

from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import letter

import os
import uuid
from typing import Optional


app = FastAPI(title="SkillLens AI API")

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
MAX_UPLOAD_BYTES = 10 * 1024 * 1024

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login/")


class AuthPayload(BaseModel):
    email: str
    password: str


@app.get("/")
def root():
    return {"status": "ok", "service": "SkillLens AI API"}


@app.get("/health")
def health():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok"}
    finally:
        db.close()


# ================= REQUIRED USER =================
def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ================= OPTIONAL USER =================
def get_user_optional(request: Request) -> Optional[str]:
    auth = request.headers.get("Authorization", "")
    scheme, _, token = auth.partition(" ")

    if scheme.lower() != "bearer" or not token:
        return None

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        return email if email else None
    except JWTError:
        return None


# ================= ANALYZE =================
@app.post("/analyze/")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: str = Form(...),
    job_role: Optional[str] = Form(None),
    current_user: Optional[str] = Depends(get_user_optional),
):
    filename = (file.filename or "").strip()
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported")

    if file.content_type not in (None, "", "application/pdf", "application/octet-stream"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF")

    safe_filename = f"{uuid.uuid4().hex}.pdf"
    file_path = os.path.join(UPLOAD_FOLDER, safe_filename)
    total_bytes = 0

    try:
        with open(file_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)
                if not chunk:
                    break
                total_bytes += len(chunk)
                if total_bytes > MAX_UPLOAD_BYTES:
                    raise HTTPException(status_code=413, detail="Resume must be 10 MB or smaller")
                buffer.write(chunk)

        if total_bytes == 0:
            raise HTTPException(status_code=400, detail="Uploaded PDF is empty")

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
                    if jd_skill in group and any(skill in resume_skills for skill in group):
                        partially_matched.append(jd_skill)
                        partial = True
                        break
                if not partial:
                    fully_missing.append(jd_skill)

        match_score = calculate_final_score(
            resume_text,
            job_description,
            resume_skills,
            jd_skills,
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
            resume_skills,
        )

        if current_user:
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.email == current_user).first()
                if user:
                    db_analysis = Analysis(
                        resume_name=filename,
                        match_score=match_score,
                        estimated_days=total_days,
                        user_id=user.id,
                    )
                    db.add(db_analysis)
                    db.commit()
            finally:
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
            "suggestions": suggestions,
            "job_role": job_role,
        }
    finally:
        try:
            await file.close()
        except Exception:
            pass
        if os.path.exists(file_path):
            os.remove(file_path)


# ================= REGISTER =================
@app.post("/register/")
def register(payload: AuthPayload):
    email = payload.email.strip().lower()
    password = payload.password

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    db = SessionLocal()
    try:
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="User already exists")

        new_user = User(email=email, password=hash_password(password))
        db.add(new_user)
        db.commit()
        return {"message": "User registered successfully"}
    finally:
        db.close()


# ================= LOGIN =================
@app.post("/login/")
def login(payload: AuthPayload):
    email = payload.email.strip().lower()
    password = payload.password

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        token = create_access_token({"sub": user.email})
        return {"access_token": token}
    finally:
        db.close()


# ================= HISTORY =================
@app.get("/history/")
def get_history(current_user: str = Depends(get_current_user)):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == current_user).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return db.query(Analysis).filter(Analysis.user_id == user.id).all()
    finally:
        db.close()


@app.delete("/history/{analysis_id}")
def delete_history(
    analysis_id: int,
    current_user: str = Depends(get_current_user),
):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == current_user).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        record = db.query(Analysis).filter(
            Analysis.id == analysis_id,
            Analysis.user_id == user.id,
        ).first()

        if not record:
            raise HTTPException(status_code=404, detail="Not found")

        db.delete(record)
        db.commit()
        return {"message": "Deleted"}
    finally:
        db.close()


# ================= REPORT =================
def remove_file(path: str):
    try:
        if os.path.exists(path):
            os.remove(path)
    except OSError:
        pass


@app.post("/generate-report/")
def generate_report(
    background_tasks: BackgroundTasks,
    match_score: float = Form(...),
    readiness: str = Form(...),
    missing_skills: str = Form(...),
    days: int = Form(...),
    current_user: str = Depends(get_current_user),
):
    file_path = os.path.join(UPLOAD_FOLDER, f"report-{uuid.uuid4().hex}.pdf")

    safe_readiness = escape(str(readiness))
    safe_missing_skills = escape(str(missing_skills)).replace("\n", "<br/>")

    doc = SimpleDocTemplate(file_path, pagesize=letter)
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("SkillLens AI Report", styles["Title"]))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph(f"Match Score: {match_score}%", styles["Normal"]))
    elements.append(Paragraph(f"Readiness Level: {safe_readiness}", styles["Normal"]))
    elements.append(Paragraph(f"Estimated Days: {days}", styles["Normal"]))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("Missing Skills:", styles["Heading2"]))
    elements.append(Paragraph(safe_missing_skills or "None", styles["Normal"]))

    try:
        doc.build(elements)
    except Exception:
        remove_file(file_path)
        raise

    background_tasks.add_task(remove_file, file_path)

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename="SkillLens_Report.pdf",
        background=background_tasks,
    )
