ROADMAP_DB = {
    "fastapi": {
        "days": 7,
        "tasks": [
            "Learn FastAPI basics",
            "Build CRUD API project",
            "Deploy on Render"
        ]
    },
    "docker": {
        "days": 5,
        "tasks": [
            "Learn Docker fundamentals",
            "Dockerize a Python app",
            "Push image to Docker Hub"
        ]
    },
    "system design": {
        "days": 7,
        "tasks": [
            "Learn scalability basics",
            "Study load balancing",
            "Design URL shortener system"
        ]
    },
    "rest api": {
        "days": 4,
        "tasks": [
            "Understand REST principles",
            "Learn HTTP methods",
            "Build RESTful backend"
        ]
    },
    "postgresql": {
        "days": 5,
        "tasks": [
            "Learn PostgreSQL basics",
            "Practice joins and indexing",
            "Integrate with backend project"
        ]
    },
    "aws": {
        "days": 7,
        "tasks": [
            "Learn EC2 basics",
            "Deploy app on AWS",
            "Understand S3 and IAM"
        ]
    }
}

def generate_roadmap(missing_skills):
    roadmap = []
    total_days = 0

    for skill in missing_skills:
        if skill in ROADMAP_DB:
            roadmap.append({
                "skill": skill,
                "duration_days": ROADMAP_DB[skill]["days"],
                "tasks": ROADMAP_DB[skill]["tasks"]
            })
            total_days += ROADMAP_DB[skill]["days"]

    return roadmap, total_days
