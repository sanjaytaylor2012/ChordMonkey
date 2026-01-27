from fastapi import FastAPI
from app.api.routes import router

app = FastAPI()

app.include_router(router)


'''

uv sync
source .venv/bin/activate
uvicorn app.main:app --reload



'''