import os
import sys
from datetime import datetime, timedelta, timezone

# Ensure we can import from backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import SessionLocal, engine
import models
from core.security import get_password_hash
from services.activation_service import create_or_reissue_activation

def reset_db():
    print("Clearing database tables...")
    db = SessionLocal()
    # Delete in reverse dependency order
    db.query(models.AuditLog).delete()
    db.query(models.SecurityAlert).delete()
    db.query(models.ScanAttempt).delete()
    db.query(models.MealClaim).delete()
    db.query(models.QRSession).delete()
    db.query(models.MealSession).delete()
    db.query(models.MealType).delete()
    db.query(models.User).delete()
    db.query(models.StudentActivation).delete()
    db.query(models.Student).delete()
    db.commit()
    db.close()

def seed_data():
    db = SessionLocal()

    # 1. ADMIN USER
    print("Creating admin user...")
    admin_user = models.User(
        username="admin",
        password_hash=get_password_hash("admin"),
        role=models.UserRole.ADMIN,
        is_active=True
    )
    db.add(admin_user)
    db.commit()

    # 2. MEAL TYPES
    print("Creating meal types...")
    breakfast = models.MealType(name="BREAKFAST", default_start_time="06:00", default_end_time="10:00")
    lunch = models.MealType(name="LUNCH", default_start_time="11:30", default_end_time="14:30")
    dinner = models.MealType(name="DINNER", default_start_time="17:00", default_end_time="20:00")
    
    db.add_all([breakfast, lunch, dinner])
    db.commit()

    # 3. OPEN MEAL SESSION FOR TESTING
    today = datetime.now(timezone.utc).date()
    now = datetime.now(timezone.utc)
    lunch_session = models.MealSession(
        meal_type_id=lunch.id,
        date=today,
        starts_at=now - timedelta(hours=1),
        ends_at=now + timedelta(hours=2),
        status=models.MealSessionStatus.OPEN
    )
    db.add(lunch_session)
    db.commit()

    # 4. APPROVED STUDENTS
    print("Creating approved test students...")
    students = [
        {"id": "1802629", "name": "Miftah Hussen"},
        {"id": "1802345", "name": "Seid Ali"},
        {"id": "1802456", "name": "Rehima Seid"},
        {"id": "1802653", "name": "Bety Belete"},
    ]
    
    test_codes = {}
    
    for s_data in students:
        s = models.Student(
            student_id=s_data["id"],
            full_name=s_data["name"]
        )
        db.add(s)
        db.commit()
        db.refresh(s)
        
        # We will activate 1802629 (Miftah) so there's one active student for easy testing
        if s.student_id == "1802629":
            user = models.User(
                student_id=s.id,
                username=s.student_id,
                password_hash=get_password_hash("password123"),
                role=models.UserRole.STUDENT,
                is_active=True
            )
            db.add(user)
            db.commit()
            print(f"Activated student {s.student_id} (Password: password123)")
        else:
            # Generate activation codes for the others
            raw_code = create_or_reissue_activation(db, s.id)
            test_codes[s.student_id] = raw_code
    
    print("\n==============================================")
    print("TEST STUDENT ACTIVATION CODES")
    print("==============================================")
    for sid, code in test_codes.items():
        print(f"Student: {sid} | Activation Code: {code}")
    print("==============================================\n")

    db.close()
    print("Database seeding complete!")

if __name__ == "__main__":
    reset_db()
    seed_data()
