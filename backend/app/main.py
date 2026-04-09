import os
import uuid
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from app.api.routes import router
from fastapi.middleware.cors import CORSMiddleware


def _get_client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=_get_client_ip)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.include_router(router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id

    expected_key = os.environ.get("API_KEY")
    if expected_key:
        provided_key = request.headers.get("X-API-Key")
        if provided_key != expected_key:
            return JSONResponse({"detail": "Invalid or missing API key"}, status_code=401)

    response = await call_next(request)
    response.headers["X-Request-Id"] = request_id
    return response


'''

uv sync
source .venv/bin/activate
uvicorn app.main:app --reload



'''
