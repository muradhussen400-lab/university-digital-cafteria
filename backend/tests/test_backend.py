import pytest
import sqlalchemy
from fastapi.testclient import TestClient

from main import app
from database import engine, get_db
from sqlalchemy.orm import sessionmaker
from models import Student, StudentStatus, User, UserRole
from core.security import get_password_hash
from services.activation_service import create_or_reissue_activation

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    session.begin_nested()
    
    @sqlalchemy.event.listens_for(session, "after_transaction_end")
    def end_savepoint(session_obj, transaction_obj):
        if transaction_obj.nested and not transaction_obj._parent.nested:
            session_obj.begin_nested()

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        yield db_session
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_admin_login(client, db_session):
    # Ensure admin exists for the test
    if not db_session.query(User).filter_by(username="admin").first():
        db_session.add(User(username="admin", password_hash=get_password_hash("admin"), role=UserRole.ADMIN))
        db_session.commit()

    response = client.post("/api/v1/auth/login", data={"username": "admin", "password": "admin"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_student_login(client, db_session):
    # Ensure a test student exists and is activated
    student_id = "test_active"
    student = db_session.query(Student).filter_by(student_id=student_id).first()
    if not student:
        student = Student(student_id=student_id, full_name="Test Active", status=StudentStatus.ACTIVE)
        db_session.add(student)
        db_session.commit()
        db_session.add(User(student_id=student.id, username=student_id, password_hash=get_password_hash("password123"), role=UserRole.STUDENT))
        db_session.commit()

    response = client.post("/api/v1/auth/login", data={"username": student_id, "password": "password123"})
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_unactivated_student_login(client, db_session):
    # Create an unactivated student
    student_id = "test_unactive"
    student = Student(student_id=student_id, full_name="Test Unactive", status=StudentStatus.ACTIVE)
    db_session.add(student)
    db_session.commit()

    response = client.post("/api/v1/auth/login", data={"username": student_id, "password": "password123"})
    assert response.status_code == 403
    assert "Account not activated" in response.json()["detail"]

def test_student_activation_flow(client, db_session):
    # Create an unactivated student for the activation flow test
    student_id = "test_flow"
    student = Student(student_id=student_id, full_name="Test Flow", status=StudentStatus.ACTIVE)
    db_session.add(student)
    db_session.commit()

    # 1. Admin generates code
    raw_code = create_or_reissue_activation(db_session, student.id)

    # 2. Invalid code attempt
    res_invalid = client.post("/api/v1/auth/activate", json={
        "student_id": student_id,
        "activation_code": "WRONG_CODE",
        "password": "newpassword123"
    })
    assert res_invalid.status_code == 400
    assert "Invalid activation code" in res_invalid.json()["detail"]

    # 3. Successful activation
    res_success = client.post("/api/v1/auth/activate", json={
        "student_id": student_id,
        "activation_code": raw_code,
        "password": "newpassword123"
    })
    assert res_success.status_code == 200
    assert res_success.json()["status"] == "success"

    # 4. Attempt to use code again
    res_reuse = client.post("/api/v1/auth/activate", json={
        "student_id": student_id,
        "activation_code": raw_code,
        "password": "newpassword123"
    })
    assert res_reuse.status_code == 400
    assert "already been activated" in res_reuse.json()["detail"]

    # 5. Login with new password
    res_login = client.post("/api/v1/auth/login", data={"username": student_id, "password": "newpassword123"})
    assert res_login.status_code == 200
    assert "access_token" in res_login.json()
