from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone
import logging

from models import Student, StudentStatus, QRSession, MealSession, MealSessionStatus, MealClaim, ScanAttempt, ScanResult, SecurityAlert, AlertSeverity
from services.qr_service import hash_qr_token
from core.timezone import get_local_now

logger = logging.getLogger(__name__)

def verify_scan(db: Session, student: Student, qr_token: str) -> str:
    """
    Core 8-step scan verification engine.
    """
    token_hash = hash_qr_token(qr_token)
    now = datetime.now(timezone.utc)
    
    # 1 & 2 & 3. Authentication & Account Status
    if student.status != StudentStatus.ACTIVE:
        _log_attempt(db, student.id, None, None, ScanResult.ERROR, "Student account inactive")
        return "ERROR: Student account inactive"
        
    if not student.account:
        _log_attempt(db, student.id, None, None, ScanResult.ERROR, "Student account is not activated")
        return "ERROR: Student account is not activated"

    # 4. QR Validity
    qr_session = db.query(QRSession).filter(QRSession.token_hash == token_hash).first()
    if not qr_session:
        _log_attempt(db, student.id, None, None, ScanResult.INVALID, "Invalid QR Token")
        return "INVALID"

    # 5 & 6. QR Expiration and Active Status
    if not qr_session.is_active or qr_session.expires_at < now:
        _log_attempt(db, student.id, qr_session.meal_session_id, qr_session.id, ScanResult.EXPIRED, "Expired QR Token")
        return "EXPIRED"

    # 7. Meal Open Status
    meal_session = qr_session.meal_session
    local_now = get_local_now()
    if not meal_session or meal_session.status == MealSessionStatus.CLOSED:
        _log_attempt(db, student.id, qr_session.meal_session_id, qr_session.id, ScanResult.CLOSED, "Meal session closed")
        return "CLOSED"
    if not (meal_session.starts_at <= local_now <= meal_session.ends_at):
        _log_attempt(db, student.id, qr_session.meal_session_id, qr_session.id, ScanResult.CLOSED, "Meal session is not currently open")
        return "CLOSED"

    # 8. Duplicate Check via Database Integrity
    # We attempt to insert the MealClaim. The DB unique constraint protects us from race conditions.
    try:
        new_claim = MealClaim(
            student_id=student.id,
            meal_session_id=meal_session.id
        )
        db.add(new_claim)
        
        # We also create the successful scan attempt in the same transaction
        attempt = ScanAttempt(
            student_id=student.id,
            meal_session_id=meal_session.id,
            qr_session_id=qr_session.id,
            result=ScanResult.SUCCESS,
            reason="Verified"
        )
        db.add(attempt)
        db.commit()
        return "ACCESS_GRANTED"
        
    except IntegrityError as e:
        db.rollback()
        # This is a DUPLICATE!
        attempt = _log_attempt(db, student.id, meal_session.id, qr_session.id, ScanResult.DUPLICATE, "Student already claimed this meal")
        
        # Create a Security Alert for the duplicate scan
        alert = SecurityAlert(
            student_id=student.id,
            scan_attempt_id=attempt.id,
            alert_type="DUPLICATE_SCAN",
            severity=AlertSeverity.MEDIUM,
            message=f"Duplicate meal claim attempt by {student.student_id}"
        )
        db.add(alert)
        
        # Create an Admin Notification
        from models import Notification
        notification = Notification(
            title="Duplicate Scan Attempt",
            message=f"Student {student.full_name} ({student.student_id}) attempted a duplicate scan.",
            link="/admin/alerts"
        )
        db.add(notification)
        
        db.commit()
        return "DUPLICATE"
    except Exception as e:
        db.rollback()
        logger.error(f"Scan verification error: {e}")
        return "ERROR: Internal verification failure"

def _log_attempt(db: Session, student_id, meal_session_id, qr_session_id, result: ScanResult, reason: str):
    attempt = ScanAttempt(
        student_id=student_id,
        meal_session_id=meal_session_id,
        qr_session_id=qr_session_id,
        result=result,
        reason=reason
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    return attempt
