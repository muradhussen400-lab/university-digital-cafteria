import hashlib
import secrets
import string
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from models import StudentActivation, Student
from services.encryption_service import encrypt_code

def generate_secure_activation_code() -> str:
    # 8 character alphanumeric code
    alphabet = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(8))

def hash_activation_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()

def create_or_reissue_activation(db: Session, student_id_uuid: str, expires_hours: int = 48) -> str:
    # 1. Generate code
    raw_code = generate_secure_activation_code()
    code_hash = hash_activation_code(raw_code)
    encrypted_code = encrypt_code(raw_code)
    expires_at = datetime.now(timezone.utc) + timedelta(days=5) # Changed to 5 days as requested

    # 2. Check if one exists
    existing = db.query(StudentActivation).filter(StudentActivation.student_id == student_id_uuid).first()
    
    if existing:
        existing.code_hash = code_hash
        existing.encrypted_code = encrypted_code
        existing.expires_at = expires_at
        existing.is_used = False
        existing.activated_at = None
    else:
        new_activation = StudentActivation(
            student_id=student_id_uuid,
            code_hash=code_hash,
            encrypted_code=encrypted_code,
            expires_at=expires_at,
            is_used=False
        )
        db.add(new_activation)
        
    db.commit()
    
    return raw_code
