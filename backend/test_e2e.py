import requests
import json
from uuid import uuid4
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"

# 1. Admin Login
res = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin", "password": "admin"})
assert res.status_code == 200, f"Admin login failed: {res.text}"
admin_token = res.json()["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}
print("TEST 1: Admin Login SUCCESS")

# 2. Student Login
res = requests.post(f"{BASE_URL}/auth/login", data={"username": "1802629", "password": "password123"})
assert res.status_code == 200, f"Student login failed: {res.text}"
student_token = res.json()["access_token"]
student_headers = {"Authorization": f"Bearer {student_token}"}
print("TEST: Student Login SUCCESS")

# 3. Create Meal Session
res = requests.post(f"{BASE_URL}/admin/meals", json={
    "meal_name": "LUNCH",
    "start_time": "12:00",
    "end_time": "16:00"
}, headers=admin_headers)
if res.status_code == 400 and "already exists" in res.text:
    print("TEST: Meal already exists")
    # Fetch existing
    res = requests.get(f"{BASE_URL}/admin/meals", headers=admin_headers)
    meal_id = next(m["id"] for m in res.json() if m["name"] == "LUNCH")
else:
    assert res.status_code == 200, res.text
    meal_id = res.json()["id"]
    print("TEST: Create Meal SUCCESS")

# 4. Edit Meal Session
res = requests.put(f"{BASE_URL}/admin/meals/{meal_id}", json={
    "start_time": "00:00", # Set it to something definitely in the past to make it OPEN right now
    "end_time": "23:59"
}, headers=admin_headers)
assert res.status_code == 200, res.text
print("TEST: Edit Meal SUCCESS")

# 5. Fetch QR Current
res = requests.get(f"{BASE_URL}/admin/qr/current", headers=admin_headers)
assert res.status_code == 200, res.text
assert res.json()["status"] == "success"
qr_token = res.json()["qr_token"]
print("TEST: Get QR Current SUCCESS")

# 6. Scan QR Code as Student
res = requests.post(f"{BASE_URL}/student/scan", json={"qr_token": qr_token}, headers=student_headers)
print("TEST: Scan QR Code as Student Response:", res.text)
if res.json().get("status") == "DUPLICATE":
    print("Already scanned! Success for duplicate check.")
else:
    assert res.json().get("status") == "ACCESS_GRANTED", res.text

# 7. Scan QR Code again (Duplicate)
res = requests.post(f"{BASE_URL}/student/scan", json={"qr_token": qr_token}, headers=student_headers)
assert res.json().get("status") == "DUPLICATE", res.text
print("TEST: Duplicate Scan Detection SUCCESS")

# 8. Role Protection
res = requests.get(f"{BASE_URL}/admin/reports", headers=student_headers)
assert res.status_code == 403, "Student should not access admin reports"
print("TEST: Role Protection SUCCESS")

print("ALL API TESTS PASSED")
