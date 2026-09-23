from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class DashboardStats(BaseModel):
    total_students: int
    activated_students: int
    unactivated_students: int
    breakfast_claims: int
    lunch_claims: int
    dinner_claims: int
    duplicate_attempts: int
    invalid_scans: int
    active_alerts: int

class AlertResponse(BaseModel):
    id: UUID
    severity: str
    message: str
    status: str
    created_at: datetime
    
class QRSessionCreate(BaseModel):
    meal_session_id: UUID
    expires_in_minutes: int = 5

class StudentActivationInfo(BaseModel):
    student_id: str
    full_name: str
    status: str
    is_activated: bool
    activated_at: Optional[datetime] = None
    activation_code: Optional[str] = None
    expires_at: Optional[datetime] = None

class SystemSettingsUpdate(BaseModel):
    academic_year: Optional[str] = None
    strict_scanning: Optional[bool] = None
    auto_archive_alerts: Optional[bool] = None

class ActivationReissueRequest(BaseModel):
    student_id: str

class AdminMealSessionResponse(BaseModel):
    id: str
    name: str
    startTime: str
    endTime: str
    status: str
    served: int
    total: int

class AdminScanResponse(BaseModel):
    id: str
    student: str
    studentId: str
    meal: str
    time: str
    status: str

class MealSessionCreate(BaseModel):
    meal_name: str
    start_time: str # "HH:MM"
    end_time: str # "HH:MM"

class MealSessionUpdate(BaseModel):
    start_time: str # "HH:MM"
    end_time: str # "HH:MM"

class StudentCreate(BaseModel):
    student_id: str
    full_name: str
