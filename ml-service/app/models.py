from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class JobSeekerProfile(BaseModel):
    id: int
    skills: List[str]
    experience_years: float
    education: str
    resume_text: str
    current_title: Optional[str] = None

class JobPosting(BaseModel):
    id: int
    title: str
    description: str
    requirements: List[str]
    company: str
    location: Optional[str] = None

class MatchRequest(BaseModel):
    job_seeker_id: int
    job_ids: List[int]

class MatchResponse(BaseModel):
    job_id: int
    match_score: float
    match_details: Dict[str, Any]