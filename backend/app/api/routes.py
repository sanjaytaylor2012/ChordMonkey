from __future__ import annotations

import os
import time
import tempfile
import logging
from pathlib import Path
from starlette.background import BackgroundTask
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from fastapi.responses import FileResponse
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

from pydantic import BaseModel
from typing import List

MAX_AUDIO_SIZE = 20 * 1024 * 1024   # 20 MB
MAX_MIDI_SIZE  = 2 * 1024 * 1024    # 2 MB

ALLOWED_AUDIO_TYPES = {
    "audio/webm", "video/webm",   # Chrome/Firefox MediaRecorder
    "audio/wav", "audio/wave",
    "audio/ogg",
    "audio/mp4", "audio/mpeg",
}
ALLOWED_MIDI_TYPES = {
    "audio/midi", "audio/x-midi",
    "application/x-midi", "audio/mid",
}

def _is_valid_audio(content_type: str | None, data: bytes) -> bool:
    if content_type and content_type.split(";")[0].strip() not in ALLOWED_AUDIO_TYPES:
        return False
    # Magic bytes
    if data[:4] == b'RIFF':                   return True  # WAV
    if data[:4] == b'OggS':                   return True  # OGG
    if data[:4] == b'\x1a\x45\xdf\xa3':       return True  # WebM
    if len(data) >= 8 and data[4:8] == b'ftyp': return True  # MP4
    if data[:3] == b'ID3':                    return True  # MP3
    if len(data) >= 2 and data[0] == 0xFF and (data[1] & 0xE0) == 0xE0: return True  # MP3 sync
    return False

def _is_valid_midi(content_type: str | None, data: bytes) -> bool:
    if content_type and content_type.split(";")[0].strip() not in ALLOWED_MIDI_TYPES:
        return False
    return data[:4] == b'MThd'

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
@limiter.limit("5/minute")
async def transcribe_to_midi(request: Request, file: UploadFile = File(...)):
    rid = getattr(request.state, "request_id", "-")
    log = {"request_id": rid}

    logger.info("transcribe-to-midi received filename=%s content_type=%s", file.filename, file.content_type, extra=log)

    contents = await file.read()
    size_kb = len(contents) / 1024
    logger.info("transcribe-to-midi size=%.1fKB", size_kb, extra=log)

    if len(contents) > MAX_AUDIO_SIZE:
        logger.warning("transcribe-to-midi rejected: file too large size=%.1fKB", size_kb, extra=log)
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {MAX_AUDIO_SIZE // (1024 * 1024)} MB.")
    if not _is_valid_audio(file.content_type, contents):
        logger.warning("transcribe-to-midi rejected: invalid file type content_type=%s", file.content_type, extra=log)
        raise HTTPException(status_code=415, detail="Unsupported file type. Please upload a WebM, WAV, OGG, or MP4 audio file.")
    await file.seek(0)

    fd, out_path_str = tempfile.mkstemp(suffix=".mid")
    os.close(fd)
    out_path = Path(out_path_str)

    try:
        start = time.perf_counter()
        await convert_upload_to_midi_path(upload=file, out_midi_path=out_path)
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info("transcribe-to-midi conversion done duration=%.1fms", elapsed_ms, extra=log)
    except Exception as exc:
        logger.exception("transcribe-to-midi conversion failed error=%s", exc, extra=log)
        if out_path.exists():
            try: os.remove(out_path)
            except: pass
        raise

    return FileResponse(
        path=str(out_path),
        media_type="audio/midi",
        filename="output.mid",
        background=BackgroundTask(lambda p: os.remove(p), str(out_path)),
    )

@router.post("/analyze-midi")
@limiter.limit("10/minute")
async def analyze_midi(request: Request, file: UploadFile = File(...)):
    rid = getattr(request.state, "request_id", "-")
    log = {"request_id": rid}

    logger.info("analyze-midi received filename=%s content_type=%s", file.filename, file.content_type, extra=log)

    contents = await file.read()
    size_kb = len(contents) / 1024
    logger.info("analyze-midi size=%.1fKB", size_kb, extra=log)

    if len(contents) > MAX_MIDI_SIZE:
        logger.warning("analyze-midi rejected: file too large size=%.1fKB", size_kb, extra=log)
        raise HTTPException(status_code=413, detail=f"File too large. Maximum size is {MAX_MIDI_SIZE // (1024 * 1024)} MB.")
    if not _is_valid_midi(file.content_type, contents):
        logger.warning("analyze-midi rejected: invalid file type content_type=%s", file.content_type, extra=log)
        raise HTTPException(status_code=415, detail="Unsupported file type. Please upload a MIDI file.")
    await file.seek(0)

    suffix = os.path.splitext(file.filename or "")[1] or ".mid"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        start = time.perf_counter()
        result = analyze_midi_chords(tmp_path)
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info("analyze-midi done chord_count=%d duration=%.1fms", len(result.get("chords", [])), elapsed_ms, extra=log)
        return result
    except Exception as exc:
        logger.exception("analyze-midi failed error=%s", exc, extra=log)
        raise
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass


class RecommendRequest(BaseModel):
    progression: List[str]
    current_chord: str | None = None
    max_recs: int = 6
    level: str = "beginner"
    forced_key: str | None = None
    previous_key: str | None = None

@router.post("/recommendations")
@limiter.limit("30/minute")
async def recommendations(request: Request, req: RecommendRequest):
    rid = getattr(request.state, "request_id", "-")
    log = {"request_id": rid}

    logger.info(
        "recommendations request progression=%s current_chord=%s forced_key=%s previous_key=%s level=%s",
        req.progression, req.current_chord, req.forced_key, req.previous_key, req.level,
        extra=log,
    )

    try:
        start = time.perf_counter()
        result = recommend_next_chords(
            progression=req.progression,
            current_chord=req.current_chord,
            max_recs=req.max_recs,
            level=req.level,
            forced_key=req.forced_key,
            previous_key=req.previous_key,
        )
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "recommendations done key_guess=%s confidence=%s rec_count=%d duration=%.1fms",
            result.get("key_guess"),
            result.get("confidence"),
            len(result.get("recommendations", [])),
            elapsed_ms,
            extra=log,
        )
        return result
    except Exception as exc:
        logger.exception("recommendations failed error=%s", exc, extra=log)
        raise
