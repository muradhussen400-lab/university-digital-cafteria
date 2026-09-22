import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from models import QRSession
from schemas.qr import QRGenerateResponse

def generate_qr_token(db: Session, meal_session_id: str, expires_minutes: int = 0, expires_seconds: int = 60) -> QRGenerateResponse:
    # 1. Generate a secure random token
    raw_token = secrets.token_urlsafe(32)
    
    # 2. Hash it for database storage
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    
    # 3. Calculate expiration
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes, seconds=expires_seconds)
    
    # 4. Save the hashed token to the database
    new_qr = QRSession(
        meal_session_id=meal_session_id,
        token_hash=token_hash,
        expires_at=expires_at,
        is_active=True
    )
    db.add(new_qr)
    db.commit()
    
    # 5. Return the raw token (only shown once to the Admin UI)
    return QRGenerateResponse(
        qr_token=raw_token,
        expires_at=expires_at,
        meal_session_id=meal_session_id
    )

def hash_qr_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode()).hexdigest()
