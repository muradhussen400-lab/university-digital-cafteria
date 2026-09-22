from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class QRGenerateResponse(BaseModel):
    qr_token: str
    expires_at: datetime
    meal_session_id: UUID
