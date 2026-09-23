from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import datetime, timezone, timedelta

from database import get_db
from models import User, Student, MealSession, MealClaim, SecurityAlert, MealSessionStatus, ScanAttempt, ScanResult, QRSession
from core.dependencies import get_current_admin
from schemas.admin import DashboardStats, AlertResponse, QRSessionCreate
from schemas.qr import QRGenerateResponse
from services.qr_service import generate_qr_token

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    today = datetime.now(timezone.utc).date()
    
    total_students = db.query(Student).count()
    activated_students = db.query(Student).join(User).count()
    unactivated_students = total_students - activated_students
    
    # Meal claims
    breakfast_claims = db.query(MealClaim).join(MealSession).join(MealType).filter(MealSession.date == today, func.upper(MealType.name) == 'BREAKFAST').count()
    lunch_claims = db.query(MealClaim).join(MealSession).join(MealType).filter(MealSession.date == today, func.upper(MealType.name) == 'LUNCH').count()
    dinner_claims = db.query(MealClaim).join(MealSession).join(MealType).filter(MealSession.date == today, func.upper(MealType.name) == 'DINNER').count()
    
    # Scans today
    from sqlalchemy import cast, Date
    duplicate_attempts = db.query(ScanAttempt).filter(cast(ScanAttempt.scanned_at, Date) == today, ScanAttempt.result == ScanResult.DUPLICATE).count()
    
    # All non-SUCCESS and non-DUPLICATE scans
    invalid_scans = db.query(ScanAttempt).filter(
        cast(ScanAttempt.scanned_at, Date) == today,
        ScanAttempt.result.in_([ScanResult.INVALID, ScanResult.EXPIRED, ScanResult.CLOSED, ScanResult.ERROR])
    ).count()

    active_alerts = db.query(SecurityAlert).filter(SecurityAlert.status == "OPEN").count()
    
    return DashboardStats(
        total_students=total_students,
        activated_students=activated_students,
        unactivated_students=unactivated_students,
        breakfast_claims=breakfast_claims,
        lunch_claims=lunch_claims,
        dinner_claims=dinner_claims,
        duplicate_attempts=duplicate_attempts,
        invalid_scans=invalid_scans,
        active_alerts=active_alerts
    )

@router.post("/qr/generate", response_model=QRGenerateResponse)
def create_qr_session(
    req: QRSessionCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Verify the meal session exists and is OPEN
    meal_session = db.query(MealSession).filter(MealSession.id == req.meal_session_id).first()
    if not meal_session:
        raise HTTPException(status_code=404, detail="Meal session not found")
    if meal_session.status != MealSessionStatus.OPEN:
        raise HTTPException(status_code=400, detail="Meal session is not OPEN")
        
    return generate_qr_token(db, str(req.meal_session_id), expires_minutes=req.expires_in_minutes, expires_seconds=0)

@router.get("/qr/current")
def get_current_qr(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    local_now = get_local_now()
    today = local_now.date()
    
    # Find currently OPEN meal
    active_session = None
    sessions = db.query(MealSession).filter(MealSession.date == today).all()
    for s in sessions:
        if s.status == MealSessionStatus.CLOSED:
            continue
        if s.starts_at <= local_now <= s.ends_at:
            active_session = s
            break
            
    if not active_session:
        return {"status": "no_active_meal"}
        
    utc_now = datetime.now(timezone.utc)
    
    # Find active QR token for this session
    from models import QRSession
    active_qr = db.query(QRSession).filter(
        QRSession.meal_session_id == active_session.id,
        QRSession.is_active == True,
        QRSession.expires_at > utc_now
    ).order_by(QRSession.expires_at.desc()).first()
    
    # We cannot return the raw token for an existing QRSession because it's hashed in the DB.
    # Therefore, we MUST generate a new token if the frontend asks for the current one.
    # We generate a new one immediately when requested and invalidate the old one.
    db.query(QRSession).filter(
        QRSession.meal_session_id == active_session.id,
        QRSession.is_active == True
    ).update({"is_active": False})
    
    new_qr_resp = generate_qr_token(db, str(active_session.id), expires_minutes=0, expires_seconds=20)
    return {
        "status": "success",
        "meal": active_session.meal_type.name,
        "qr_token": new_qr_resp.qr_token,
        "expires_at": new_qr_resp.expires_at.isoformat(),
        "meal_ends_at": active_session.ends_at.isoformat()
    }

from typing import Optional
from sqlalchemy import cast, Date, or_

@router.get("/alerts", response_model=List[AlertResponse])
def get_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    date: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    query = db.query(SecurityAlert)
    
    if status and status != "ALL":
        query = query.filter(SecurityAlert.status == status)
        
    if severity and severity != "ALL":
        query = query.filter(SecurityAlert.severity == severity)
        
    if date:
        try:
            parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(cast(SecurityAlert.created_at, Date) == parsed_date)
        except ValueError:
            pass
            
    if search:
        query = query.outerjoin(Student, SecurityAlert.student_id == Student.id).filter(
            or_(
                SecurityAlert.message.ilike(f"%{search}%"),
                Student.full_name.ilike(f"%{search}%"),
                Student.student_id.ilike(f"%{search}%")
            )
        )
        
    alerts = query.order_by(SecurityAlert.created_at.desc()).limit(100).all()
    return [
        {
            "id": a.id,
            "severity": a.severity.value,
            "message": a.message,
            "status": a.status.value,
            "created_at": a.created_at
        } for a in alerts
    ]

from schemas.admin import StudentActivationInfo, ActivationReissueRequest
from services.activation_service import create_or_reissue_activation

from services.encryption_service import decrypt_code

@router.get("/activations", response_model=List[StudentActivationInfo])
def list_student_activations(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    from models import StudentStatus
    students = db.query(Student).filter(Student.status == StudentStatus.ACTIVE).all()
    results = []
    for s in students:
        is_activated = s.account is not None
        activated_at = s.activation.activated_at if s.activation else None
        
        activation_code = None
        expires_at = None
        if not is_activated and s.activation and not s.activation.is_used and s.activation.encrypted_code:
            try:
                activation_code = decrypt_code(s.activation.encrypted_code)
                expires_at = s.activation.expires_at
            except Exception:
                pass
                
        results.append({
            "student_id": s.student_id,
            "full_name": s.full_name,
            "status": s.status.value,
            "is_activated": is_activated,
            "activated_at": activated_at,
            "activation_code": activation_code,
            "expires_at": expires_at
        })
    return results

@router.post("/activations/generate")
def generate_activation_code(
    req: ActivationReissueRequest,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    student = db.query(Student).filter(Student.student_id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    if student.account is not None:
        raise HTTPException(status_code=400, detail="Student is already activated")
        
    raw_code = create_or_reissue_activation(db, student.id)
    # WARNING: Returning the raw code in the API response is ONLY for the Admin to physically give to the student!
    return {"status": "success", "activation_code": raw_code, "student_id": req.student_id}

@router.post("/students/{student_id}/deactivate")
def deactivate_student(student_id: str, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    from models import StudentStatus
    student.status = StudentStatus.INACTIVE
    
    # Invalidate user account if activated
    if student.account:
        student.account.is_active = False
        
    db.commit()
    return {"status": "success", "message": "Student deactivated successfully"}

from schemas.admin import AdminMealSessionResponse, AdminScanResponse, MealSessionCreate, MealSessionUpdate, StudentCreate
from models import ScanAttempt, MealType, StudentStatus
from fastapi.responses import Response
from core.timezone import get_local_now

@router.post("/students")
def create_student(req: StudentCreate, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    student_id = req.student_id.strip()
    full_name = req.full_name.strip()
    if not student_id or not full_name:
        raise HTTPException(status_code=400, detail="Student ID and Full Name are required")
        
    existing = db.query(Student).filter(Student.student_id == student_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Student with ID '{student_id}' already exists")
        
    new_student = Student(
        student_id=student_id,
        full_name=full_name,
        status=StudentStatus.ACTIVE
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    return {"status": "success", "student_id": new_student.student_id, "full_name": new_student.full_name}


@router.get("/meals", response_model=List[AdminMealSessionResponse])
def get_admin_meals(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    local_now = get_local_now()
    today = local_now.date()
    sessions = db.query(MealSession).filter(MealSession.date == today).all()
    
    total_eligible = db.query(Student).filter(Student.status == "ACTIVE").count()
    
    results = []
    for s in sessions:
        served = db.query(MealClaim).filter(MealClaim.meal_session_id == s.id).count()
        
        # Dynamically compute status
        if s.status == MealSessionStatus.CLOSED:
            computed_status = "CLOSED"
        elif local_now < s.starts_at:
            computed_status = "UPCOMING"
        elif s.starts_at <= local_now <= s.ends_at:
            computed_status = "OPEN"
        else:
            computed_status = "ENDED"
            
        # Update db status if it changed
        if s.status.value != computed_status and computed_status != "CLOSED":
            try:
                s.status = MealSessionStatus(computed_status)
                db.commit()
            except ValueError:
                pass
                
        results.append({
            "id": str(s.id),
            "name": s.meal_type.name,
            "startTime": s.starts_at.strftime("%I:%M %p"),
            "endTime": s.ends_at.strftime("%I:%M %p"),
            "status": computed_status,
            "served": served,
            "total": total_eligible
        })
    return results

@router.post("/meals")
def create_meal_session(req: MealSessionCreate, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    local_now = get_local_now()
    today = local_now.date()
    
    meal_type = db.query(MealType).filter(func.upper(MealType.name) == req.meal_name.upper()).first()
    if not meal_type:
        # Create meal type if it doesn't exist
        meal_type = MealType(name=req.meal_name.upper(), default_start_time=req.start_time, default_end_time=req.end_time)
        db.add(meal_type)
        db.commit()
        db.refresh(meal_type)
        
    existing = db.query(MealSession).filter(MealSession.meal_type_id == meal_type.id, MealSession.date == today).first()
    if existing:
        raise HTTPException(status_code=400, detail="Meal session already exists for today")
        
    try:
        # Parse times
        sh, sm = map(int, req.start_time.split(':'))
        eh, em = map(int, req.end_time.split(':'))
        
        starts_at = local_now.replace(hour=sh, minute=sm, second=0, microsecond=0)
        ends_at = local_now.replace(hour=eh, minute=em, second=0, microsecond=0)
        
        if ends_at <= starts_at:
            raise HTTPException(status_code=400, detail="End time must be after start time")
            
        new_session = MealSession(
            meal_type_id=meal_type.id,
            date=today,
            starts_at=starts_at,
            ends_at=ends_at,
            status=MealSessionStatus.UPCOMING
        )
        db.add(new_session)
        db.commit()
        return {"status": "success", "id": str(new_session.id)}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")

@router.put("/meals/{session_id}")
def update_meal_session(session_id: str, req: MealSessionUpdate, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    session = db.query(MealSession).filter(MealSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Meal session not found")
        
    local_now = get_local_now()
    try:
        sh, sm = map(int, req.start_time.split(':'))
        eh, em = map(int, req.end_time.split(':'))
        
        starts_at = session.starts_at.astimezone(local_now.tzinfo).replace(hour=sh, minute=sm, second=0, microsecond=0)
        ends_at = session.ends_at.astimezone(local_now.tzinfo).replace(hour=eh, minute=em, second=0, microsecond=0)
        
        # If end time is earlier than or equal to start time, assume overnight session (ends tomorrow)
        if ends_at <= starts_at:
            ends_at = ends_at + timedelta(days=1)
            
        session.starts_at = starts_at
        session.ends_at = ends_at
        
        # Dynamically update status
        if starts_at <= local_now <= ends_at:
            session.status = MealSessionStatus.OPEN
        elif local_now < starts_at:
            session.status = MealSessionStatus.UPCOMING
        else:
            session.status = MealSessionStatus.CLOSED
            
        db.commit()
        return {"status": "success"}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")

@router.delete("/meals/{session_id}")
def delete_meal_session(session_id: str, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    session = db.query(MealSession).filter(MealSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Meal session not found")
        
    # Delete related dependencies first to prevent FK constraint errors
    # Get all QR sessions for this meal session
    qr_sessions = db.query(QRSession).filter(QRSession.meal_session_id == session.id).all()
    qr_session_ids = [qr.id for qr in qr_sessions]
    
    # Delete all scan attempts linked to this meal session or its QR sessions
    if qr_session_ids:
        db.query(ScanAttempt).filter(ScanAttempt.qr_session_id.in_(qr_session_ids)).delete(synchronize_session=False)
    db.query(ScanAttempt).filter(ScanAttempt.meal_session_id == session.id).delete(synchronize_session=False)
    
    db.query(MealClaim).filter(MealClaim.meal_session_id == session.id).delete(synchronize_session=False)
    db.query(QRSession).filter(QRSession.meal_session_id == session.id).delete(synchronize_session=False)
    
    db.delete(session)
    db.commit()
    return {"status": "success", "message": "Meal session deleted successfully"}

@router.post("/meals/{session_id}/open-now")
def open_meal_session_now(session_id: str, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    session = db.query(MealSession).filter(MealSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Meal session not found")
        
    local_now = get_local_now()
    session.starts_at = local_now - timedelta(minutes=5)
    session.ends_at = local_now + timedelta(hours=3)
    session.status = MealSessionStatus.OPEN
    db.commit()
    return {"status": "success", "message": f"{session.meal_type.name} session opened for next 3 hours"}

@router.post("/meals/quick-start")
def quick_start_meal(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    local_now = get_local_now()
    today = local_now.date()
    
    # Check if there is an existing session for today that can be opened
    session = db.query(MealSession).filter(MealSession.date == today).order_by(MealSession.created_at.desc()).first()
    if not session:
        meal_type = db.query(MealType).first()
        if not meal_type:
            meal_type = MealType(name="DINNER", default_start_time="00:00", default_end_time="23:59")
            db.add(meal_type)
            db.commit()
            db.refresh(meal_type)
        session = MealSession(
            meal_type_id=meal_type.id,
            date=today,
            starts_at=local_now - timedelta(minutes=5),
            ends_at=local_now + timedelta(hours=3),
            status=MealSessionStatus.OPEN
        )
        db.add(session)
    else:
        session.starts_at = local_now - timedelta(minutes=5)
        session.ends_at = local_now + timedelta(hours=3)
        session.status = MealSessionStatus.OPEN
        
    db.commit()
    return {"status": "success", "id": str(session.id)}


@router.get("/scans", response_model=List[AdminScanResponse])
def get_admin_scans(
    date: Optional[str] = None,
    meal: Optional[str] = None,
    result: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    query = db.query(ScanAttempt)
    
    if date:
        try:
            parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(cast(ScanAttempt.scanned_at, Date) == parsed_date)
        except ValueError:
            pass
            
    if meal and meal != "ALL":
        from models import MealType
        query = query.join(ScanAttempt.meal_session).join(MealSession.meal_type).filter(func.upper(MealType.name) == meal.upper())
        
    if result and result != "ALL":
        query = query.filter(ScanAttempt.result == result)
        
    if search:
        query = query.outerjoin(ScanAttempt.student).filter(
            or_(
                Student.full_name.ilike(f"%{search}%"),
                Student.student_id.ilike(f"%{search}%")
            )
        )

    scans = query.order_by(ScanAttempt.scanned_at.desc()).limit(100).all()
    results = []
    for scan in scans:
        results.append({
            "id": str(scan.id)[:8],
            "student": scan.student.full_name if scan.student else "Unknown",
            "studentId": scan.student.student_id if scan.student else "N/A",
            "meal": scan.meal_session.meal_type.name if scan.meal_session else "N/A",
            "time": scan.scanned_at.strftime("%I:%M:%S %p"),
            "status": scan.result.value
        })
    return results

try:
    from fpdf import FPDF
except ImportError:
    pass

@router.post("/activations/export-pdf")
def export_activation_codes_pdf(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    students = db.query(Student).order_by(Student.full_name).all()
    
    from fpdf import FPDF
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=12)
    
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, "UNIVERSITY CAFETERIA SYSTEM", ln=True, align='C')
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(200, 10, "STUDENT ACCOUNT ACTIVATION CODES", ln=True, align='C')
    
    pdf.set_font("Arial", 'I', 10)
    pdf.cell(200, 10, "Confidential - For authorized university administration use only.", ln=True, align='C')
    pdf.cell(200, 10, f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}", ln=True, align='C')
    pdf.ln(10)
    
    pdf.set_font("Arial", 'B', 10)
    pdf.cell(60, 10, 'Student Name', 1)
    pdf.cell(40, 10, 'Student ID', 1)
    pdf.cell(40, 10, 'Activation Code', 1)
    pdf.cell(40, 10, 'Status/Expires', 1)
    pdf.ln()
    
    pdf.set_font("Arial", '', 10)
    for s in students:
        is_activated = s.account is not None
        if is_activated:
            code_display = "N/A"
            status_display = "ACTIVATED"
        else:
            if s.activation and not s.activation.is_used and s.activation.encrypted_code and s.activation.expires_at > datetime.now(timezone.utc):
                try:
                    code_display = decrypt_code(s.activation.encrypted_code)
                    status_display = f"Expires {s.activation.expires_at.strftime('%d %b %Y')}"
                except Exception:
                    code_display = "ERROR"
                    status_display = "ENCRYPTION ERROR"
            else:
                code_display = "N/A"
                status_display = "CODE UNAVAILABLE - REISSUE REQUIRED"
            
        pdf.cell(60, 10, s.full_name, 1)
        pdf.cell(40, 10, s.student_id, 1)
        pdf.cell(40, 10, code_display, 1)
        pdf.cell(40, 10, status_display, 1)
        pdf.ln()
        
    pdf_bytes = pdf.output(dest='S').encode('latin1')
    return Response(content=pdf_bytes, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=activation_codes.pdf"})

from services.reset_service import create_reset_token

@router.post("/students/{student_id}/reset-password-code")
def generate_reset_code(student_id: str, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    user = db.query(User).filter(User.student_id == student.id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Student is not activated")
        
    raw_code = create_reset_token(db, user.id)
    return {"status": "success", "reset_code": raw_code, "expires_in_days": 5}

from models import SystemSetting, Notification
from schemas.admin import SystemSettingsUpdate

@router.get("/settings")
def get_settings(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    settings_records = db.query(SystemSetting).all()
    # Defaults
    settings_dict = {
        "academic_year": "2023 - 2024",
        "strict_scanning": True,
        "auto_archive_alerts": False
    }
    for s in settings_records:
        if s.key == "academic_year":
            settings_dict["academic_year"] = s.value
        elif s.key == "strict_scanning":
            settings_dict["strict_scanning"] = s.value.lower() == 'true'
        elif s.key == "auto_archive_alerts":
            settings_dict["auto_archive_alerts"] = s.value.lower() == 'true'
            
    return settings_dict

@router.put("/settings")
def update_settings(req: SystemSettingsUpdate, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    def update_or_create(key: str, value: str):
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting:
            setting.value = value
        else:
            db.add(SystemSetting(key=key, value=value))
            
    if req.academic_year is not None:
        update_or_create("academic_year", req.academic_year)
    if req.strict_scanning is not None:
        update_or_create("strict_scanning", str(req.strict_scanning))
    if req.auto_archive_alerts is not None:
        update_or_create("auto_archive_alerts", str(req.auto_archive_alerts))
        
    db.commit()
    return {"status": "success"}

@router.get("/notifications")
def get_notifications(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    notifications = db.query(Notification).order_by(Notification.created_at.desc()).limit(20).all()
    return [
        {
            "id": str(n.id),
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at,
            "link": n.link
        }
        for n in notifications
    ]

@router.post("/notifications/mark-all-read")
def mark_all_notifications_read(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"status": "success"}

@router.get("/scans/live")
def get_live_scans(since: str, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    from dateutil.parser import parse
    try:
        since_time = parse(since)
    except ValueError:
        return []
        
    scans = db.query(ScanAttempt).filter(ScanAttempt.scanned_at > since_time).order_by(ScanAttempt.scanned_at.asc()).all()
    results = []
    for scan in scans:
        results.append({
            "id": str(scan.id),
            "student_name": scan.student.full_name if scan.student else "Unknown",
            "student_id": scan.student.student_id if scan.student else "Unknown",
            "meal": scan.meal_session.meal_type.name if scan.meal_session else "Unknown",
            "result": scan.result.value,
            "time": scan.scanned_at.isoformat(),
            "reason": scan.reason
        })
    return results

@router.get("/reports")
def get_reports(current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    # Basic report stats
    total_students = db.query(Student).count()
    total_scans = db.query(ScanAttempt).count()
    successful_claims = db.query(ScanAttempt).filter(ScanAttempt.result == ScanResult.SUCCESS).count()
    duplicate_attempts = db.query(ScanAttempt).filter(ScanAttempt.result == ScanResult.DUPLICATE).count()
    invalid_scans = total_scans - successful_claims - duplicate_attempts

    return {
        "total_students": total_students,
        "total_scans": total_scans,
        "successful_claims": successful_claims,
        "duplicate_attempts": duplicate_attempts,
        "invalid_scans": invalid_scans
    }

@router.get("/reports/export")
def export_reports(
    date: Optional[str] = None,
    meal: Optional[str] = None,
    result: Optional[str] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_admin), 
    db: Session = Depends(get_db)
):
    query = db.query(ScanAttempt)
    
    if date:
        try:
            parsed_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(cast(ScanAttempt.scanned_at, Date) == parsed_date)
        except ValueError:
            pass
            
    if meal and meal != "ALL":
        from models import MealType
        query = query.join(ScanAttempt.meal_session).join(MealSession.meal_type).filter(func.upper(MealType.name) == meal.upper())
        
    if result and result != "ALL":
        query = query.filter(ScanAttempt.result == result)
        
    if search:
        query = query.outerjoin(ScanAttempt.student).filter(
            or_(
                Student.full_name.ilike(f"%{search}%"),
                Student.student_id.ilike(f"%{search}%")
            )
        )

    scans = query.order_by(ScanAttempt.scanned_at.desc()).all()
    
    import io
    import csv
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Student ID", "Student Name", "Meal Type", "Result", "Reason", "Scanned At"])
    
    for scan in scans:
        writer.writerow([
            str(scan.id),
            scan.student.student_id if scan.student else "N/A",
            scan.student.full_name if scan.student else "N/A",
            scan.meal_session.meal_type.name if scan.meal_session else "N/A",
            scan.result.value,
            scan.reason,
            scan.scanned_at.isoformat()
        ])
        
    response = Response(content=output.getvalue(), media_type="text/csv")
    filename_date = date if date else datetime.now(timezone.utc).strftime("%Y-%m-%d")
    response.headers["Content-Disposition"] = f"attachment; filename=live-scans-{filename_date}.csv"
    return response
