from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class StudentProfile(BaseModel):
    student_id: str
    full_name: str
    status: str

    class Config:
        from_attributes = True

class ScanRequest(BaseModel):
    qr_token: str

class ScanResponse(BaseModel):
    status: str
    message: str

class MealSessionInfo(BaseModel):
    id: UUID
    meal_type: str
    status: str
    starts_at: datetime
    ends_at: datetime

class HistoryClaim(BaseModel):
    meal_type: str
    claimed_at: datetime
    date: datetime

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
