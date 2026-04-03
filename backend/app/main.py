import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.api.routes import router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.include_router(router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # allow all origins
    allow_credentials=True,
    allow_methods=["*"],        # allow all HTTP methods
    allow_headers=["*"],        # allow all headers
)

@app.middleware("http")
async def verify_api_key(request: Request, call_next):
    expected_key = os.environ.get("API_KEY")
    # If API_KEY is not configured, skip validation (e.g. local dev without key)
    if expected_key:
        provided_key = request.headers.get("X-API-Key")
        if provided_key != expected_key:
            return JSONResponse({"detail": "Invalid or missing API key"}, status_code=401)
    return await call_next(request)

'''

uv sync
source .venv/bin/activate
uvicorn app.main:app --reload



'''