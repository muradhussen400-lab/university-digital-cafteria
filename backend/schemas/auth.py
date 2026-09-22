from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserResponse(BaseModel):
    id: UUID
    username: str
    role: str
    student_id: Optional[UUID] = None

    class Config:
        from_attributes = True

class ActivationRequest(BaseModel):
    student_id: str
    activation_code: str
    password: str

class PasswordResetRequest(BaseModel):
    student_id: str
    reset_code: str
    new_password: str

class AdminPasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

