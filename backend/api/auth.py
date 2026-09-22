from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone

from database import get_db
from models import User, Student, StudentActivation, StudentStatus, UserRole
from core.security import verify_password, create_access_token, get_password_hash
from core.config import settings
from schemas.auth import Token, UserResponse, ActivationRequest
from core.dependencies import get_current_user
from services.activation_service import hash_activation_code

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    
    if not user:
        # Check if they are an unactivated student
        student = db.query(Student).filter(Student.student_id == form_data.username).first()
        if student:
            raise HTTPException(
                status_code=403,
                detail="Account not activated. Please activate your student account first."
            )
        # If no user and no student
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role.value}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/activate", response_model=dict)
def activate_account(req: ActivationRequest, db: Session = Depends(get_db)):
    # 1. Verify student exists and is active
    student = db.query(Student).filter(Student.student_id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=400, detail="Student is not authorized for account activation.")
    
    if student.status != StudentStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Student account is inactive.")

    # 2. Check if already activated
    existing_user = db.query(User).filter(User.student_id == student.id).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="This student account has already been activated.")

    # 3. Verify activation code
    activation = db.query(StudentActivation).filter(StudentActivation.student_id == student.id).first()
    if not activation:
        raise HTTPException(status_code=400, detail="No activation code generated for this student.")
        
    if activation.is_used:
        raise HTTPException(status_code=400, detail="Activation code has already been used.")
        
    if activation.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Activation code has expired.")
        
    input_hash = hash_activation_code(req.activation_code)
    if input_hash != activation.code_hash:
        raise HTTPException(status_code=400, detail="Invalid activation code.")

    # 4. Validate password (basic checks)
    if not req.password or len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    # 5. Create the User account
    new_user = User(
        student_id=student.id,
        username=student.student_id,
        password_hash=get_password_hash(req.password),
        role=UserRole.STUDENT,
        is_active=True
    )
    db.add(new_user)
    
    # 6. Invalidate activation code
    activation.is_used = True
    activation.activated_at = datetime.now(timezone.utc)
    
    db.commit()
    
    return {"status": "success", "message": "Account activated successfully."}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "role": current_user.role.value,
        "student_id": current_user.student_id
    }

from schemas.auth import PasswordResetRequest, AdminPasswordChangeRequest
from models import PasswordResetToken
from services.reset_service import hash_reset_code
from core.dependencies import get_current_admin

@router.post("/reset-password")
def reset_password(req: PasswordResetRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.student_id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=400, detail="Student not found.")
        
    user = db.query(User).filter(User.student_id == student.id).first()
    if not user:
        raise HTTPException(status_code=400, detail="Student account is not activated.")
        
    # We must find a valid reset token
    # Wait, the reset service uses encryption. We can either decrypt and check, or check encrypted.
    # Actually, we can just fetch the active tokens for this user and try to decrypt them to match, 
    # OR since we know the raw code, we could encrypt it, but encryption is randomized (iv).
    # We MUST decrypt the stored token and check.
    from services.encryption_service import decrypt_code
    
    tokens = db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.is_used == False,
        PasswordResetToken.expires_at > datetime.now(timezone.utc)
    ).all()
    
    valid_token = None
    for t in tokens:
        try:
            if decrypt_code(t.encrypted_code) == req.reset_code:
                valid_token = t
                break
        except Exception:
            continue
            
    if not valid_token:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")
        
    if not req.new_password or len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
        
    user.password_hash = get_password_hash(req.new_password)
    valid_token.is_used = True
    valid_token.used_at = datetime.now(timezone.utc)
    
    db.commit()
    return {"status": "success", "message": "Password reset successfully."}

@router.post("/change-admin-password")
def change_admin_password(req: AdminPasswordChangeRequest, current_user: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password.")
        
    if not req.new_password or len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters long.")
        
    current_user.password_hash = get_password_hash(req.new_password)
    db.commit()
    
    return {"status": "success", "message": "Admin password changed successfully."}

