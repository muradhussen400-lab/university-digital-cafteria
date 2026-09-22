# Production Security Checklist

Before finalizing the deployment of the Digital Cafeteria System, ensure all of the following conditions are met.

### 1. Secrets Management
- [ ] No `.env` files were accidentally committed to the Git repository.
- [ ] Production uses a strong, 64-character random string for `SECRET_KEY`.
- [ ] The `ACTIVATION_ENCRYPTION_KEY` is a valid 32-byte Base64-encoded string, securely stored ONLY in Render environment variables.
- [ ] The default `admin:adminpassword` credentials have been changed in the database.

### 2. Network & CORS
- [ ] The FastAPI backend is NOT running in `debug` mode.
- [ ] `CORS_ORIGINS` in the backend environment exactly matches the frontend's production URL (no wildcard `*` domains).
- [ ] The frontend `VITE_API_URL` uses `https://` to ensure data transmission is encrypted in transit.

### 3. Database Integrity
- [ ] The PostgreSQL database is securely hosted on Render's private network.
- [ ] Alembic migrations have been successfully run against the production database `alembic upgrade head`.
- [ ] The database enforces the `UNIQUE(student_id, meal_session_id)` constraint on the `ScanAttempt` table.

### 4. Application Logic
- [ ] Cross-tab authentication correctly uses `sessionStorage` preventing Admin and Student tokens from colliding on shared devices.
- [ ] Admin endpoints are securely protected behind the `get_current_admin` dependency.
- [ ] The Meal Session QR code refreshes periodically to prevent token theft.
- [ ] Student IDs are explicitly treated as strings in the database to prevent dropping leading zeroes.
