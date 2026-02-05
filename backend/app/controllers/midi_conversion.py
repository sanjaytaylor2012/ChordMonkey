import subprocess
import tempfile
from pathlib import Path
from fastapi import HTTPException, UploadFile
from basic_pitch.inference import predict

# this is the pretrained model
from basic_pitch import ICASSP_2022_MODEL_PATH


def _ffmpeg_to_wav(input_path: Path, output_path: Path) -> None:
    """
    Helper function to convert webm file to a WAV file. Browser records in webm but 
    basic pitch model requires a WAV file. Download ffmpeg using chocolatey.
    """

    """
    -y: overwrite output file if it already exists
    "-i", str(input_path): tells ffmpeg where the input file is
    "-ac", "1": forces audio to monochannel (basic pitch wants mono)
    "-ar", "22050": sets sample rate to 22050 Hz 
    """
    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_path),
        "-ac", "1",
        "-ar", "22050",
        str(output_path),
    ]

    # execute the conversion in a subprocess
    # check = true: if it fails raise an error
    # stdout=DEVNULL, stderr=DEVNULL: discard ffmpeg output (keeps our logs cleaner)
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        raise HTTPException(status_code=400, detail="Audio decode failed (ffmpeg).")


async def convert_upload_to_midi_path(upload: UploadFile, out_midi_path: Path) -> None:
    if not upload.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")

    # Use a temp dir for intermediates cuz we dont want to actually store this stuff
    with tempfile.TemporaryDirectory() as td:
        tmpdir = Path(td)

        # read input file into the temp dir
        raw_in = tmpdir / f"input_{upload.filename}"
        raw_in.write_bytes(await upload.read())

        # convert input to wav
        wav_path = tmpdir / "input.wav"
        _ffmpeg_to_wav(raw_in, wav_path)

        # run the inference
        try:
            _, midi_data, _ = predict(str(wav_path), model_or_model_path=ICASSP_2022_MODEL_PATH)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Basic Pitch failed: {e}")

        # Write MIDI to the durable path (outside temp dir)
        midi_data.write(str(out_midi_path))
