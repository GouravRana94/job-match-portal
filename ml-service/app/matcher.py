import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobMatcher:
    def __init__(self):
        """Initialize the job matcher with ML models"""
        logger.info("Loading sentence transformer model...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("Model loaded successfully")
    
    def calculate_match_score(self, seeker: Dict, job: Dict) -> Dict[str, Any]:
        """Calculate match score between job seeker and job posting"""
        
        # Skill match
        seeker_skills = set([s.lower().strip() for s in seeker.get('skills', [])])
        job_skills = set([r.lower().strip() for r in job.get('requirements', [])])
        
        if job_skills:
            matching_skills = seeker_skills.intersection(job_skills)
            skill_match_ratio = len(matching_skills) / len(job_skills)
        else:
            skill_match_ratio = 0.5
            matching_skills = []
        
        # Experience match
        experience_years = seeker.get('experience_years', 0)
        experience_score = min(1.0, experience_years / 5.0)
        
        # Text similarity using embeddings
        seeker_text = f"{seeker.get('resume_text', '')} {' '.join(seeker_skills)}"
        job_text = f"{job.get('title', '')} {job.get('description', '')} {' '.join(job_skills)}"
        
        try:
            seeker_embedding = self.model.encode([seeker_text])[0]
            job_embedding = self.model.encode([job_text])[0]
            text_similarity = cosine_similarity([seeker_embedding], [job_embedding])[0][0]
        except Exception as e:
            logger.error(f"Error calculating text similarity: {e}")
            text_similarity = 0.5
        
        # Combine scores with weights
        final_score = (
            skill_match_ratio * 0.5 +
            experience_score * 0.2 +
            text_similarity * 0.3
        ) * 100
        
        return {
            'match_score': round(final_score, 2),
            'match_details': {
                'skill_match_ratio': round(skill_match_ratio * 100, 2),
                'experience_score': round(experience_score * 100, 2),
                'text_similarity': round(text_similarity * 100, 2),
                'matching_skills': list(matching_skills),
                'missing_skills': list(job_skills - seeker_skills) if job_skills else []
            }
        }