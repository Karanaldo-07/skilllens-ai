def generate_resume_suggestions(
    match_score,
    missing_skills,
    partially_matched,
    resume_skills
):
    suggestions = []

    # Score based suggestions
    if match_score < 40:
        suggestions.append(
            "Your resume has major skill gaps. Focus on learning core required technologies first."
        )
    elif match_score < 70:
        suggestions.append(
            "You are close to the job requirements. Strengthen your weak areas and add more projects."
        )
    else:
        suggestions.append(
            "Your profile is strong. Focus on polishing achievements and interview preparation."
        )

    # Missing skills suggestions
    if missing_skills:
        suggestions.append(
            f"Consider adding these skills: {', '.join(missing_skills[:5])}"
        )

    # Partial skills suggestions
    if partially_matched:
        suggestions.append(
            "You have related knowledge. Improve depth in partially matched skills."
        )

    # Project suggestion
    if len(resume_skills) < 5:
        suggestions.append(
            "Add more technical projects to strengthen your resume."
        )

    # ATS suggestion
    suggestions.append(
        "Use action verbs and quantify achievements (e.g., Improved accuracy by 20%)."
    )

    return suggestions
