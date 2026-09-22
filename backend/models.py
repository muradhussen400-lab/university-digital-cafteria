from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Date, UniqueConstraint, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM as PgEnum
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timezone
import enum

from database import Base

# ENUMS
class StudentStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"

class UserRole(enum.Enum):
    STUDENT = "STUDENT"
    ADMIN = "ADMIN"
    CAFETERIA = "CAFETERIA"

class MealSessionStatus(enum.Enum):
    UPCOMING = "UPCOMING"
    OPEN = "OPEN"
    CLOSED = "CLOSED"

class ScanResult(enum.Enum):
    SUCCESS = "SUCCESS"
    DUPLICATE = "DUPLICATE"
    INVALID = "INVALID"
    EXPIRED = "EXPIRED"
    CLOSED = "CLOSED"
    ERROR = "ERROR"

class AlertSeverity(enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AlertStatus(enum.Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"

# MODELS
class Student(Base):
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    status = Column(PgEnum(StudentStatus, name="student_status"), default=StudentStatus.ACTIVE, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    account = relationship("User", back_populates="student", uselist=False)
    activation = relationship("StudentActivation", back_populates="student", uselist=False)
    meal_claims = relationship("MealClaim", back_populates="student")
    scan_attempts = relationship("ScanAttempt", back_populates="student")

class StudentActivation(Base):
    __tablename__ = "student_activations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), unique=True, nullable=False)
    code_hash = Column(String, nullable=True) # Keep for legacy
    encrypted_code = Column(String, nullable=True) # New encrypted field
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)
    activated_at = Column(DateTime(timezone=True), nullable=True)

    student = relationship("Student", back_populates="activation")

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=True) # Nullable for Admin/Cafeteria
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(PgEnum(UserRole, name="user_role"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    student = relationship("Student", back_populates="account")
    audit_logs = relationship("AuditLog", back_populates="user")

class MealType(Base):
    __tablename__ = "meal_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False) # e.g., BREAKFAST, LUNCH, DINNER
    default_start_time = Column(String, nullable=False) # Store as HH:MM format for simplicity
    default_end_time = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

    sessions = relationship("MealSession", back_populates="meal_type")

class MealSession(Base):
    __tablename__ = "meal_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meal_type_id = Column(UUID(as_uuid=True), ForeignKey("meal_types.id"), nullable=False)
    date = Column(Date, nullable=False)
    starts_at = Column(DateTime(timezone=True), nullable=False)
    ends_at = Column(DateTime(timezone=True), nullable=False)
    status = Column(PgEnum(MealSessionStatus, name="meal_session_status"), default=MealSessionStatus.UPCOMING, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    meal_type = relationship("MealType", back_populates="sessions")
    qr_sessions = relationship("QRSession", back_populates="meal_session")
    claims = relationship("MealClaim", back_populates="meal_session")
    scan_attempts = relationship("ScanAttempt", back_populates="meal_session")

    __table_args__ = (
        UniqueConstraint('meal_type_id', 'date', name='uq_meal_type_date'),
    )

class QRSession(Base):
    __tablename__ = "qr_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meal_session_id = Column(UUID(as_uuid=True), ForeignKey("meal_sessions.id"), nullable=False)
    token_hash = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)

    meal_session = relationship("MealSession", back_populates="qr_sessions")
    scan_attempts = relationship("ScanAttempt", back_populates="qr_session")

class MealClaim(Base):
    __tablename__ = "meal_claims"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=False)
    meal_session_id = Column(UUID(as_uuid=True), ForeignKey("meal_sessions.id"), nullable=False)
    claimed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    student = relationship("Student", back_populates="meal_claims")
    meal_session = relationship("MealSession", back_populates="claims")

    __table_args__ = (
        # THIS IS THE CRITICAL RULE! A student can only claim a meal session once!
        UniqueConstraint('student_id', 'meal_session_id', name='uq_student_meal_session'),
    )

class ScanAttempt(Base):
    __tablename__ = "scan_attempts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=True)
    meal_session_id = Column(UUID(as_uuid=True), ForeignKey("meal_sessions.id"), nullable=True)
    qr_session_id = Column(UUID(as_uuid=True), ForeignKey("qr_sessions.id"), nullable=True)
    result = Column(PgEnum(ScanResult, name="scan_result"), nullable=False)
    reason = Column(String, nullable=True)
    scanned_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    device_identifier = Column(String, nullable=True)

    student = relationship("Student", back_populates="scan_attempts")
    meal_session = relationship("MealSession", back_populates="scan_attempts")
    qr_session = relationship("QRSession", back_populates="scan_attempts")

class SecurityAlert(Base):
    __tablename__ = "security_alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=True)
    scan_attempt_id = Column(UUID(as_uuid=True), ForeignKey("scan_attempts.id"), nullable=True)
    alert_type = Column(String, nullable=False)
    severity = Column(PgEnum(AlertSeverity, name="alert_severity"), nullable=False)
    message = Column(String, nullable=False)
    status = Column(PgEnum(AlertStatus, name="alert_status"), default=AlertStatus.OPEN, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

class Cafeteria(Base):
    __tablename__ = "cafeterias"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class CafeteriaDevice(Base):
    __tablename__ = "cafeteria_devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cafeteria_id = Column(UUID(as_uuid=True), ForeignKey("cafeterias.id"), nullable=False)
    name = Column(String, nullable=False)
    device_type = Column(String, nullable=False) # DISPLAY, ADMIN_TERMINAL
    device_identifier = Column(String, unique=True, nullable=False)
    is_active = Column(Boolean, default=True)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    metadata_info = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="audit_logs")

class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    encrypted_code = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime(timezone=True), nullable=True)

class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    link = Column(String, nullable=True)
