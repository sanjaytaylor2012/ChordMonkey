# ChordMonkey

ChordMonkey is a full-stack songwriting tool that records audio, converts it to MIDI, and supports downstream harmonic analysis and chord recommendation.

The repository contains:
- `frontend/` — React / Next.js client
- `backend/` — FastAPI (Python) API for audio → MIDI processing

---

## Prerequisites

- **Node.js** ≥ 18  
- **Python** ≥ 3.10  
- **FFmpeg** (required for audio decoding)  
- **uv** (Python dependency manager)

Verify installs:
```bash
node -v
python --version
ffmpeg -version
uv --version
```


## Backend Setup (FastAPI)

The backend provides the audio processing and MIDI transcription API.

### Requirements
- Python ≥ 3.10
- FFmpeg available on system PATH
- `uv` installed (`pip install uv`)

### Install Dependencies
```bash
cd backend
uv sync
```

### Required Runtime Dependency

The backend uses file uploads via UploadFile, which requires python-multipart:
```bash
uv run python -m pip install python-multipart
```

Run the Backend Server:
```bash
uv run uvicorn app.main:app --reload --port 8000
```


## Frontend Setup (React / Next.js)

The frontend provides audio recording, conversion controls, and MIDI download.

### Requirements
- Node.js ≥ 18
- npm (bundled with Node)

### Install Dependencies
```bash
cd frontend
npm install
```

### Run the Frontend
```bash
npm run dev
```


