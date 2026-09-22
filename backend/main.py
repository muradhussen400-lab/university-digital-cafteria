from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api import auth, student, admin
from database import engine
import models

models.Base.metadata.create_all(bind=engine)

# Automatically run safe, idempotent production seeding
try:
    from scripts.seed_production import seed_production
    seed_production()
except Exception as e:
    print(f"Automatic database seeding failed or skipped: {e}")


app = FastAPI(title="Cafeteria System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(student.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"message": "Cafeteria API is running"}
