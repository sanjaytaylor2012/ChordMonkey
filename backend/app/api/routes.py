from __future__ import annotations

import os
import tempfile
import logging
from pathlib import Path
from starlette.background import BackgroundTask
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List

from ..controllers.midi_conversion import convert_upload_to_midi_path
from ..controllers.chord_analysis import analyze_midi_chords
from ..controllers.chord_recommendation  import recommend_next_chords


router = APIRouter()
logger = logging.getLogger(__name__)

"""
All API and networking logic lives in routes.py. All actual business logic
is stored in controllers. This breaks up concern between network infra and 
actaul meaningful code.
"""

@router.get("/test")
async def test():
    return "hello world"


@router.post("/transcribe-to-midi")
async def transcribe_to_midi(file: UploadFile = File(...)):
    # Create an output path
    fd, out_path_str = tempfile.mkstemp(suffix=".mid")

    # close it because we just want the path not the file
    os.close(fd)
    out_path = Path(out_path_str)

    try:
        await convert_upload_to_midi_path(upload=file, out_midi_path=out_path)
    except Exception:
        if out_path.exists():
            try: os.remove(out_path)
            except: pass
        raise

    # the background task runs AFTER the return statement to remove the output path
    # so we dont accumulate midi files in the backend
    return FileResponse(
        path=str(out_path),
        media_type="audio/midi",
        filename="output.mid",
        background=BackgroundTask(lambda p: os.remove(p), str(out_path)),
    )

@router.post("/analyze-midi")
async def analyze_midi(file: UploadFile = File(...)):
    suffix = os.path.splitext(file.filename or "")[1] or ".mid"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        return analyze_midi_chords(tmp_path)
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass


class RecommendRequest(BaseModel):
    progression: List[str]
    current_chord: str | None = None
    max_recs: int = 6
    forced_key: str | None = None
    previous_key: str | None = None

@router.post("/recommendations")
async def recommendations(req: RecommendRequest):
    logger.info(
        "recommendations request progression=%s current_chord=%s forced_key=%s previous_key=%s",
        req.progression,
        req.current_chord,
        req.forced_key,
        req.previous_key,
    )
    result = recommend_next_chords(
        progression=req.progression,
        current_chord=req.current_chord,
        max_recs=req.max_recs,
        forced_key=req.forced_key,
        previous_key=req.previous_key,
    )
    logger.info(
        "recommendations response key_guess=%s confidence=%s rec_count=%s top_scores=%s",
        result.get("key_guess"),
        result.get("confidence"),
        len(result.get("recommendations", [])),
        result.get("debug_key_scores", [])[:3],
    )
    return result
