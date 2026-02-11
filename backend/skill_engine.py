from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


# Basic skill list (expand later)
SKILL_DB = [
    "python", "java", "c++", "sql", "mysql", "postgresql",
    "machine learning", "deep learning", "tensorflow", "pytorch",
    "react", "node.js", "fastapi", "flask", "django",
    "data structures", "algorithms", "system design",
    "aws", "azure", "gcp",
    "docker", "kubernetes",
    "rest api", "microservices",
    "html", "css", "javascript",
    "mongodb", "redis",
    "git", "linux"
]

SKILL_GROUPS = {
    "cloud": ["aws", "azure", "gcp"],
    "backend_framework": ["fastapi", "flask", "django"],
    "database": ["sql", "mysql", "postgresql", "mongodb"],
}


def extract_skills(text):
    text = text.lower()
    found_skills = []
    for skill in SKILL_DB:
        if skill in text:
            found_skills.append(skill)
    return found_skills


def calculate_similarity(resume_text, job_description):
    vectorizer = TfidfVectorizer(stop_words="english")

    tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])

    similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])

    score = similarity[0][0]

    return float(round(score * 100, 2))


def calculate_final_score(resume_text, job_description, resume_skills, jd_skills):
    semantic_score = calculate_similarity(resume_text, job_description)

    if len(jd_skills) == 0:
        skill_coverage = 0
    else:
        matched_skills = 0

    for jd_skill in jd_skills:
        if jd_skill in resume_skills:
            matched_skills += 1
        else:
            # check group similarity
            for group in SKILL_GROUPS.values():
                if jd_skill in group:
                    if any(skill in resume_skills for skill in group):
                        matched_skills += 0.5  # partial credit

        important_keywords = ["required", "must", "mandatory", "strong"]

        weighted_total = 0
        weighted_matched = 0

        for jd_skill in jd_skills:
            weight = 1
            for keyword in important_keywords:
                if keyword in job_description.lower():
                    weight = 1.5

            weighted_total += weight

            if jd_skill in resume_skills:
                weighted_matched += weight

        skill_coverage = (weighted_matched / weighted_total) * 100


    # Weighted score
    final_score = (0.4 * semantic_score) + (0.6 * skill_coverage)

    return float(round(final_score, 2))
