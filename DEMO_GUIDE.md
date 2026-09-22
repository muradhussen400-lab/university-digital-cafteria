# University Digital Cafeteria - Teacher Demonstration Guide

This guide will walk you through the exact steps to demonstrate the full capabilities of the Digital Cafeteria system to your university teacher.

## Preparation Before Demo
1. Ensure the PostgreSQL database is running.
2. Ensure both the backend (`uvicorn`) and frontend (`vite`) servers are running.
3. Open two different incognito/private windows or two different web browsers (e.g., Chrome and Edge) to simulate two different physical devices.

---

## The Demonstration Flow

### 1. Show the Admin Portal & Students
- **Action**: Open the Admin Portal (usually `http://localhost:5173/admin/login`).
- **Explain**: "This is the control center where cafeteria administrators manage the system."
- **Action**: Log in as the administrator (Username: `admin`, Password: `adminpassword`).
- **Action**: Navigate to the **Students** tab.
- **Explain**: "We have pre-loaded the database with the active student list. As you can see, duplicate ID inputs were successfully intercepted and blocked."
- **Action**: Click **Generate Code** next to a student (e.g., DBU1802629 - Miftah). Show the teacher the activation code that appears.

### 2. Show Student Activation & Login (Browser 2)
- **Action**: Open the Student Portal in your second browser (`http://localhost:5173/login`).
- **Explain**: "This is what the student sees on their phone."
- **Action**: Click **Activate Account**. Enter the Student ID (`DBU1802629`) and the exact code generated in the previous step. Set a secure password.
- **Action**: Log in using the Student ID and newly created password. Show the dashboard.

### 3. Show Meal Scheduling & QR Display
- **Action**: Return to the **Admin Portal**. Go to **Meal Sessions**.
- **Explain**: "Here we manage Breakfast, Lunch, and Dinner. I will open the current meal session."
- **Action**: Start a meal session. Go to **QR Display**.
- **Explain**: "This screen represents the physical screen mounted in the cafeteria. The QR code dynamically refreshes to prevent students from taking photos of it and using it from home."

### 4. Show the Live QR Scan & Duplicate Protection
- **Action**: Return to the **Student Portal**. Click the **Scan** button.
- **Explain**: "The system requests camera access on the student's phone."
- **Action**: (If on PC, the webcam will turn on). Point it at the Admin QR Display.
- **Explain**: "Watch the Admin screen. A live SUCCESS notification appears instantly."
- **Action**: Click Scan again in the Student Portal and scan the same QR code.
- **Explain**: "The system detects the duplicate immediately and rejects the scan."

### 5. Show Live Reporting & Security
- **Action**: In the **Admin Portal**, navigate to **Live Scans**.
- **Explain**: "Every scan is logged in real-time."
- **Action**: Use the Filter dropdown. Select **DUPLICATE** under Results. Watch the table update.
- **Action**: Click **Export**. Show the downloaded CSV file.
- **Action**: Navigate to **Security Alerts**.
- **Explain**: "Because a duplicate scan was attempted, a high-severity security alert was automatically generated for the administrators to review."

### 6. Show Student Calendar & Dark Mode
- **Action**: In the **Student Portal**, click **Calendar**.
- **Explain**: "The student's history is recorded here. The checkmark indicates they successfully claimed today's meal."
- **Action**: Navigate to **Profile** -> Toggle the theme.
- **Explain**: "The system fully supports Dark Mode preferences across both portals."

## End of Demo
"This concludes the demonstration of a secure, real-time, zero-hardware meal verification system."
