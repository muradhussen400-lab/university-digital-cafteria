import hashlib
import string
import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from models import PasswordResetToken, User
from services.encryption_service import encrypt_code

def generate_secure_reset_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(8))

def hash_reset_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()

def create_reset_token(db: Session, user_id_uuid: str) -> str:
    # 1. Invalidate any existing unused reset tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user_id_uuid,
        PasswordResetToken.is_used == False
    ).update({"is_used": True, "used_at": datetime.now(timezone.utc)})

    # 2. Generate new code
    raw_code = generate_secure_reset_code()
    encrypted_code = encrypt_code(raw_code)
    expires_at = datetime.now(timezone.utc) + timedelta(days=5)

    # 3. Save to database
    new_token = PasswordResetToken(
        user_id=user_id_uuid,
        encrypted_code=encrypted_code,
        expires_at=expires_at,
        is_used=False
    )
    db.add(new_token)
    db.commit()
    
    return raw_code
