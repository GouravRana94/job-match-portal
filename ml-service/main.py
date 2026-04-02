from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import psycopg2
import os
import json
import logging
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Job Match ML Service", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('DB_HOST'),
        database=os.getenv('DB_NAME'),
        user=os.getenv('DB_USER'),
        password=os.getenv('DB_PASSWORD'),
        port=os.getenv('DB_PORT', '5432')
    )

# Load model
logger.info("Loading model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
logger.info("✅ Model loaded")

# -----------------------------
# SKILL WEIGHTS
# -----------------------------
SKILL_WEIGHTS = {
    'react': 1.5,
    'node.js': 1.3,
    'python': 1.2,
    'javascript': 1.2,
    'typescript': 1.3,
    'aws': 1.4,
    'docker': 1.3,
    'kubernetes': 1.4,
    'postgresql': 1.2,
    'mongodb': 1.1,
    'django': 1.2,
    'flask': 1.1,
    'tensorflow': 1.3,
    'pytorch': 1.3,
}

def calculate_weighted_skill_match(seeker_skills, job_requirements):
    """Calculate weighted skill match"""
    total_weight = 0
    matched_weight = 0

    for req_skill in job_requirements:
        weight = SKILL_WEIGHTS.get(req_skill.lower(), 1.0)
        total_weight += weight

        if req_skill.lower() in [s.lower() for s in seeker_skills]:
            matched_weight += weight

    return (matched_weight / total_weight * 100) if total_weight > 0 else 0

# -----------------------------
# MODELS
# -----------------------------
class MatchRequest(BaseModel):
    job_seeker_id: int
    job_ids: Optional[List[int]] = None

class MatchResponse(BaseModel):
    job_id: int
    title: str
    company: str
    match_score: float
    match_details: Dict[str, Any]

# -----------------------------
# MATCHER CLASS
# -----------------------------
class JobMatcher:
    def __init__(self):
        self.model = model

    def calculate_match_score(self, seeker: Dict, job: Dict) -> Dict[str, Any]:

        seeker_skills = seeker.get('skills', [])
        job_skills = job.get('requirements', [])

        seeker_skills_lower = set([s.lower().strip() for s in seeker_skills])
        job_skills_lower = set([r.lower().strip() for r in job_skills])

        # -----------------------------
        # SKILL MATCH (30%) - weighted
        # -----------------------------
        weighted_match = calculate_weighted_skill_match(seeker_skills, job_skills)
        skill_score = (weighted_match / 100) * 30
        matching_skills = seeker_skills_lower.intersection(job_skills_lower)

        # -----------------------------
        # EXPERIENCE (20%)
        # -----------------------------
        exp = seeker.get('experience_years', 0)

        if exp >= 5:
            experience_score = 20
        elif exp >= 3:
            experience_score = 15
        elif exp >= 1:
            experience_score = 10
        else:
            experience_score = 5

        # -----------------------------
        # TITLE MATCH (10%)
        # -----------------------------
        title_score = 0
        seeker_title = seeker.get('current_title', '').lower()
        job_title = job.get('title', '').lower()

        if seeker_title and job_title:
            if seeker_title in job_title or job_title in seeker_title:
                title_score = 10

        # -----------------------------
        # SENIORITY (10%)
        # -----------------------------
        seniority_score = 0
        if 'senior' in job_title:
            if exp >= 5:
                seniority_score = 10
            elif exp >= 3:
                seniority_score = 5

        if 'lead' in job_title and exp >= 5:
            seniority_score = 10

        # -----------------------------
        # TEXT SIMILARITY (20%)
        # -----------------------------
        seeker_text = f"{seeker.get('resume_text', '')} {' '.join(seeker_skills_lower)}"
        job_text = f"{job.get('title', '')} {job.get('description', '')} {' '.join(job_skills_lower)}"

        try:
            s_emb = self.model.encode([seeker_text])[0]
            j_emb = self.model.encode([job_text])[0]
            similarity = cosine_similarity([s_emb], [j_emb])[0][0]
            text_score = similarity * 20
        except Exception:
            text_score = 10

        # -----------------------------
        # EDUCATION (5%)
        # -----------------------------
        edu = seeker.get('education', '').lower()

        if 'phd' in edu:
            edu_score = 5
        elif 'master' in edu:
            edu_score = 4
        elif 'bachelor' in edu:
            edu_score = 3
        else:
            edu_score = 2

        # -----------------------------
        # LOCATION (5%)
        # -----------------------------
        location_score = 5

        # -----------------------------
        # FINAL SCORE
        # -----------------------------
        final_score = (
            skill_score +
            experience_score +
            title_score +
            seniority_score +
            text_score +
            edu_score +
            location_score
        )

        final_score = min(100, final_score)

        if final_score >= 80:
            level = "Excellent"
        elif final_score >= 60:
            level = "Good"
        elif final_score >= 40:
            level = "Average"
        else:
            level = "Low"

        return {
            "match_score": round(final_score, 2),
            "match_level": level,
            "match_details": {
                "matching_skills": list(matching_skills),
                "missing_skills": list(job_skills_lower - seeker_skills_lower),
                "weighted_skill_match": round(weighted_match, 2),
                "skill_score": round(skill_score, 2),
                "experience_score": experience_score,
                "title_score": title_score,
                "seniority_score": seniority_score,
                "text_score": round(text_score, 2),
                "education_score": edu_score,
                "location_score": location_score
            }
        }

matcher = JobMatcher()

# -----------------------------
# ROUTES
# -----------------------------
@app.get("/")
def root():
    return {"status": "ML service running", "version": "3.0.0"}

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": True,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/model-info")
def model_info():
    return {
        "model_name": "all-MiniLM-L6-v2",
        "model_type": "Sentence Transformer",
        "embedding_dimension": 384,
        "skill_weights": SKILL_WEIGHTS,
        "features": [
            "Weighted skill matching",
            "Semantic text similarity",
            "Experience level analysis",
            "Seniority matching",
            "Education qualification matching"
        ]
    }

@app.post("/api/match", response_model=List[MatchResponse])
async def match_jobs(request: MatchRequest, background_tasks: BackgroundTasks):
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Get seeker
        cur.execute("""
            SELECT id, skills, experience_years, education, resume_text, current_title
            FROM job_seekers WHERE id = %s
        """, (request.job_seeker_id,))

        s = cur.fetchone()
        if not s:
            raise HTTPException(404, "User not found")

        seeker = {
            "id": s[0],
            "skills": s[1] or [],
            "experience_years": s[2] or 0,
            "education": s[3] or "",
            "resume_text": s[4] or "",
            "current_title": s[5] or ""
        }

        # Get jobs
        if request.job_ids:
            placeholders = ','.join(['%s'] * len(request.job_ids))
            cur.execute(f"""
                SELECT id, title, description, requirements, company, location
                FROM jobs WHERE id IN ({placeholders}) AND is_active = true
            """, request.job_ids)
        else:
            cur.execute("""
                SELECT id, title, description, requirements, company, location
                FROM jobs WHERE is_active = true
            """)

        jobs = cur.fetchall()
        results = []

        for j in jobs:
            job = {
                "id": j[0],
                "title": j[1],
                "description": j[2],
                "requirements": j[3] or [],
                "company": j[4],
                "location": j[5]
            }

            match = matcher.calculate_match_score(seeker, job)

            cur.execute("""
                INSERT INTO job_matches (job_seeker_id, job_id, match_score, match_details)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (job_seeker_id, job_id)
                DO UPDATE SET 
                    match_score = EXCLUDED.match_score,
                    match_details = EXCLUDED.match_details
            """, (seeker["id"], job["id"], match["match_score"], json.dumps(match["match_details"])))

            results.append(MatchResponse(
                job_id=job["id"],
                title=job["title"],
                company=job["company"],
                match_score=match["match_score"],
                match_details=match["match_details"]
            ))

        conn.commit()
        cur.close()
        conn.close()

        return sorted(results, key=lambda x: x.match_score, reverse=True)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in match_jobs: {e}", exc_info=True)
        raise HTTPException(500, str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)