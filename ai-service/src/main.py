from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
from datetime import datetime
import random

app = FastAPI(title="TutorXpert AI Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class MatchRequest(BaseModel):
    learnerId: str
    limit: int = 10

class MatchResponse(BaseModel):
    success: bool
    data: Dict[str, Any]

class TutorMatch(BaseModel):
    tutor: Dict[str, Any]
    score: float
    reasons: List[str]

# Mock data for demonstration (in production, this would connect to databases)
MOCK_TUTORS = [
    {
        "user_id": "tutor-1",
        "name": "Sarah Johnson",
        "profile_pic": "https://i.pravatar.cc/150?img=1",
        "rating": 4.9,
        "total_reviews": 127,
        "is_verified": True,
        "subjects": ["math-1", "science-1"],
        "experience_years": 5,
        "hourly_rate": 45,
        "languages": ["English", "Spanish"],
        "introduction": "Experienced math and science tutor passionate about helping students succeed.",
        "total_sessions": 350,
        "response_rate": 98,
    },
    {
        "user_id": "tutor-2",
        "name": "Mike Chen",
        "profile_pic": "https://i.pravatar.cc/150?img=3",
        "rating": 4.8,
        "total_reviews": 89,
        "is_verified": True,
        "subjects": ["programming-1", "math-1"],
        "experience_years": 8,
        "hourly_rate": 60,
        "languages": ["English", "Mandarin"],
        "introduction": "Software engineer turned tutor. I make coding fun and accessible.",
        "total_sessions": 280,
        "response_rate": 95,
    },
    {
        "user_id": "tutor-3",
        "name": "Emma Wilson",
        "profile_pic": "https://i.pravatar.cc/150?img=5",
        "rating": 4.7,
        "total_reviews": 64,
        "is_verified": False,
        "subjects": ["english-1", "history-1"],
        "experience_years": 4,
        "hourly_rate": 40,
        "languages": ["English"],
        "introduction": "English literature graduate with a passion for teaching writing and critical thinking.",
        "total_sessions": 180,
        "response_rate": 92,
    },
]

MOCK_LEARNERS = {
    "learner-1": {
        "preferred_subjects": ["math-1", "programming-1"],
        "learning_goals": ["Improve calculus skills", "Learn web development"],
        "learning_style": "visual",
    },
}

def calculate_match_score(learner_id: str, tutor: Dict) -> tuple[float, List[str]]:
    """
    Calculate match score between learner and tutor using collaborative filtering approach.
    Returns score (0-1) and list of match reasons.
    """
    score = 0.0
    reasons = []
    
    learner = MOCK_LEARNERS.get(learner_id, {
        "preferred_subjects": [],
        "learning_goals": [],
        "learning_style": "general",
    })
    
    # Subject match (40% weight)
    learner_subjects = set(learner.get("preferred_subjects", []))
    tutor_subjects = set(tutor.get("subjects", []))
    
    if learner_subjects:
        subject_overlap = learner_subjects.intersection(tutor_subjects)
        subject_score = len(subject_overlap) / len(learner_subjects) * 40
        score += subject_score
        if subject_overlap:
            reasons.append(f"Matches {len(subject_overlap)} of your preferred subjects")
    
    # Experience match (15% weight)
    experience_years = tutor.get("experience_years", 0)
    experience_score = min(experience_years * 3, 15)
    score += experience_score
    if experience_years >= 3:
        reasons.append(f"{experience_years} years of experience")
    
    # Rating match (20% weight)
    rating = tutor.get("rating", 0)
    rating_score = (rating / 5) * 20
    score += rating_score
    if rating >= 4.5:
        reasons.append(f"Highly rated ({rating}/5.0 stars)")
    
    # Response rate match (10% weight)
    response_rate = tutor.get("response_rate", 0)
    response_score = response_rate / 10
    score += response_score
    if response_rate >= 90:
        reasons.append(f"Quick responder ({response_rate}% response rate)")
    
    # Session volume match (15% weight)
    total_sessions = tutor.get("total_sessions", 0)
    session_score = min(total_sessions / 50, 15)
    score += session_score
    if total_sessions >= 100:
        reasons.append(f"Experienced with {total_sessions}+ sessions completed")
    
    return min(score, 100) / 100, reasons


@app.get("/")
async def root():
    return {"message": "TutorXpert AI Service", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/api/v1/match/recommend", response_model=MatchResponse)
async def get_recommendations(request: MatchRequest):
    """
    Get AI-powered tutor recommendations for a learner.
    Uses collaborative filtering and content-based matching.
    """
    try:
        # Get all available tutors (in production, fetch from database)
        tutors = MOCK_TUTORS
        
        # Calculate match scores
        matches = []
        for tutor in tutors:
            score, reasons = calculate_match_score(request.learnerId, tutor)
            if score > 0.3:  # Only include matches with score > 30%
                matches.append({
                    "tutor": tutor,
                    "score": score,
                    "reasons": reasons,
                })
        
        # Sort by score and limit
        matches.sort(key=lambda x: x["score"], reverse=True)
        top_matches = matches[:request.limit]
        
        return MatchResponse(
            success=True,
            data={
                "matches": top_matches,
                "total": len(top_matches),
                "learnerId": request.learnerId,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/analytics/learner/{learner_id}")
async def get_learner_analytics(learner_id: str):
    """
    Get personalized learning analytics and recommendations for a learner.
    """
    # Mock analytics data
    return {
        "success": True,
        "data": {
            "learnerId": learner_id,
            "totalSessions": random.randint(10, 100),
            "totalHours": random.randint(5, 50),
            "averagePerformance": round(random.uniform(70, 95), 2),
            "learningStreak": random.randint(1, 30),
            "strengths": ["Problem Solving", "Critical Thinking"],
            "areasForImprovement": ["Time Management", "Note Taking"],
            "recommendations": [
                "Focus on practice problems for 30 minutes daily",
                "Try spaced repetition for better retention",
                "Consider group study sessions for collaborative learning",
            ],
            "predictedMastery": {
                "mathematics": round(random.uniform(60, 90), 2),
                "programming": round(random.uniform(50, 85), 2),
            },
        }
    }


@app.get("/api/v1/analytics/tutor/{tutor_id}")
async def get_tutor_analytics(tutor_id: str):
    """
    Get teaching analytics and insights for a tutor.
    """
    return {
        "success": True,
        "data": {
            "tutorId": tutor_id,
            "totalSessions": random.randint(50, 500),
            "totalStudents": random.randint(10, 100),
            "averageRating": round(random.uniform(4.0, 5.0), 2),
            "responseRate": random.randint(80, 100),
            "completionRate": random.randint(90, 100),
            "earnings": {
                "today": round(random.uniform(0, 200), 2),
                "thisWeek": round(random.uniform(500, 2000), 2),
                "thisMonth": round(random.uniform(2000, 8000), 2),
            },
            "topSubjects": ["Mathematics", "Programming"],
            "studentSatisfaction": round(random.uniform(85, 98), 2),
            "recommendations": [
                "Consider offering weekend slots for more bookings",
                "Your students appreciate your clear explanations",
                "Try adding more interactive elements to sessions",
            ],
        }
    }


@app.post("/api/v1/match/calculate")
async def calculate_match(learner_id: str, tutor_id: str):
    """
    Calculate detailed match score between specific learner and tutor.
    """
    tutor = next((t for t in MOCK_TUTORS if t["user_id"] == tutor_id), None)
    
    if not tutor:
        raise HTTPException(status_code=404, detail="Tutor not found")
    
    score, reasons = calculate_match_score(learner_id, tutor)
    
    return {
        "success": True,
        "data": {
            "learnerId": learner_id,
            "tutorId": tutor_id,
            "score": score,
            "matchPercentage": round(score * 100, 2),
            "reasons": reasons,
        }
    }


@app.get("/api/v1/insights/trending")
async def get_trending_insights():
    """
    Get trending subjects and learning insights.
    """
    return {
        "success": True,
        "data": {
            "trendingSubjects": [
                {"name": "Python Programming", "growth": 45},
                {"name": "Data Science", "growth": 38},
                {"name": "Spanish", "growth": 32},
                {"name": "Calculus", "growth": 28},
            ],
            "learningTips": [
                "Practice active recall for better memory retention",
                "Break complex topics into smaller chunks",
                "Teach others to reinforce your understanding",
            ],
            "upcomingEvents": [
                {"name": "SAT Prep Workshop", "date": "2024-05-15"},
                {"name": "Coding Bootcamp", "date": "2024-05-20"},
            ],
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
