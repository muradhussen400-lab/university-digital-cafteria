from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone

from database import get_db
from models import User, Student, MealSession, MealClaim, MealSessionStatus
from core.dependencies import get_current_student
from schemas.student import StudentProfile, ScanRequest, ScanResponse, MealSessionInfo, HistoryClaim, ChangePasswordRequest
from services.scan_service import verify_scan
from core.security import verify_password, get_password_hash

router = APIRouter(prefix="/student", tags=["student"])

@router.get("/me", response_model=StudentProfile)
def get_student_profile(current_user: User = Depends(get_current_student), db: Session = Depends(get_db)):
    return current_user.student

@router.get("/meals/today", response_model=List[MealSessionInfo])
def get_today_meals(db: Session = Depends(get_db)):
    today = datetime.now(timezone.utc).date()
    sessions = db.query(MealSession).filter(MealSession.date == today).all()
    
    return [
        {
            "id": s.id,
            "meal_type": s.meal_type.name,
            "status": s.status.value,
            "starts_at": s.starts_at,
            "ends_at": s.ends_at
        } for s in sessions
    ]

@router.post("/scan", response_model=ScanResponse)
def scan_qr_code(
    scan_req: ScanRequest, 
    current_user: User = Depends(get_current_student), 
    db: Session = Depends(get_db)
):
    student = current_user.student
    if not student:
        raise HTTPException(status_code=400, detail="User has no associated student profile")
        
    result = verify_scan(db, student, scan_req.qr_token)
    
    if result == "ACCESS_GRANTED":
        return ScanResponse(status="ACCESS_GRANTED", message="Meal claimed successfully")
    elif result == "DUPLICATE":
        return ScanResponse(status="DUPLICATE", message="You have already claimed this meal")
    else:
        # For INVALID, EXPIRED, CLOSED, ERROR
        return ScanResponse(status=result, message=f"Scan failed: {result}")

@router.get("/history", response_model=List[HistoryClaim])
def get_student_history(current_user: User = Depends(get_current_student), db: Session = Depends(get_db)):
    claims = db.query(MealClaim).filter(MealClaim.student_id == current_user.student_id).order_by(MealClaim.claimed_at.desc()).limit(20).all()
    
    return [
        {
            "meal_type": c.meal_session.meal_type.name,
            "claimed_at": c.claimed_at,
            "date": c.meal_session.date
        } for c in claims
    ]

@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user: User = Depends(get_current_student), db: Session = Depends(get_db)):
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
        
    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    return {"status": "success", "message": "Password updated successfully"}
