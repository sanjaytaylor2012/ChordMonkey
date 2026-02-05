from __future__ import annotations

import os
import tempfile
from pathlib import Path
from starlette.background import BackgroundTask
from fastapi import APIRouter, UploadFile, File
from fastapi.responses import FileResponse

from ..controllers.midi_conversion import convert_upload_to_midi_path


router = APIRouter()

"""
All API and networking logic lives in routes.py. All actual business logic
is stored in controllers. This breaks up concern between network infra and 
actaul meaningful code.
"""

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
