from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import upload, ask, analytics

app = FastAPI(title="OpenHours API", version="1.0.0")

# Allow requests from the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/upload", tags=["upload"])
app.include_router(ask.router, prefix="/ask", tags=["ask"])
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])


@app.get("/")
def health_check():
    return {"status": "ok", "message": "OpenHours API is running"}
