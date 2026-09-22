import os
import sys
from datetime import datetime, timedelta, timezone

# Ensure we can import from backend modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database import SessionLocal, engine
import models
from core.security import get_password_hash

def seed_production():
    print("Starting production database seeding...")
    db = SessionLocal()
    
    # 1. Ensure Admin User Exists
    print("Checking admin user...")
    admin = db.query(models.User).filter(models.User.username == "admin").first()
    if not admin:
        print("Creating production admin user...")
        admin_user = models.User(
            username="admin",
            password_hash=get_password_hash("admin"),
            role=models.UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
        db.commit()
        print("Admin user created.")
    else:
        print("Admin user already exists. Skipping.")

    # 2. Ensure Meal Types Exist
    print("Checking meal types...")
    meal_types = [
        {"name": "BREAKFAST", "start": "06:00", "end": "10:00"},
        {"name": "LUNCH", "start": "11:30", "end": "14:30"},
        {"name": "DINNER", "start": "17:00", "end": "20:00"}
    ]
    
    for mt in meal_types:
        existing = db.query(models.MealType).filter(models.MealType.name == mt["name"]).first()
        if not existing:
            new_mt = models.MealType(name=mt["name"], default_start_time=mt["start"], default_end_time=mt["end"])
            db.add(new_mt)
            db.commit()
            print(f"MealType {mt['name']} created.")
        else:
            print(f"MealType {mt['name']} already exists. Skipping.")

    # 3. Ensure Approved Students Exist
    print("Checking approved students...")
    students_to_seed = [
        {"id": "1802629", "name": "Miftah Hussen"},
        {"id": "1802345", "name": "Seid Ali"},
        {"id": "1802456", "name": "Rehima Seid"},
        {"id": "1802653", "name": "Bety Belete"},
        {"id": "DBU1800528", "name": "Tsion"} # Taking first name from original script
    ]
    
    for s_data in students_to_seed:
        existing = db.query(models.Student).filter(models.Student.student_id == s_data["id"]).first()
        if not existing:
            s = models.Student(
                student_id=s_data["id"],
                full_name=s_data["name"]
            )
            db.add(s)
            db.commit()
            print(f"Student {s_data['name']} ({s_data['id']}) inserted.")
        else:
            print(f"Student {s_data['id']} already exists. Skipping.")
            
    db.close()
    print("Production database seeding complete! No destructive operations were performed.")

if __name__ == "__main__":
    seed_production()
