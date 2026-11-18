"""SignSync sign-recognition API. The app records a short clip of one sign and posts it here.

    cd server
    .venv\\Scripts\\activate
    uvicorn main:app --host 0.0.0.0 --port 8000

Errors use the app's shape: {"error": {"code": ..., "message": ...}}.
"""
import json
import os
import shutil
import tempfile
import time

import cv2
import numpy as np

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from recognizer import RecognitionError, SignRecognizer

MAX_UPLOAD_BYTES = 30 * 1024 * 1024

# Debug mode (off by default): set SIGNSYNC_DEBUG=1 to keep every clip in server/debug/ together with
# its landmarks, a contact sheet of frames with the detected hands/body drawn on, and the answer.
# The clips show the signer's face: delete the folder when you are done.
DEBUG_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "debug") if os.environ.get("SIGNSYNC_DEBUG") == "1" else None


def save_debug(path: str, info: dict, result: dict | None, error: str | None):
    os.makedirs(DEBUG_DIR, exist_ok=True)
    stem = os.path.join(DEBUG_DIR, time.strftime("%Y%m%d_%H%M%S"))
    shutil.copy(path, stem + os.path.splitext(path)[1])
    thumbs = info.pop("thumbs", [])
    raw = info.pop("raw", [])
    if raw:
        np.save(stem + "_raw.npy", np.asarray(raw, np.float32))
        hands = np.asarray(raw)[:, :126].reshape(len(raw), 2, 63)
        info["left_hand_frames"] = int((np.abs(hands[:, 0]).sum(1) > 0).sum())
        info["right_hand_frames"] = int((np.abs(hands[:, 1]).sum(1) > 0).sum())
        info["pose_frames"] = int((np.abs(np.asarray(raw)[:, 126:129]).sum(1) > 0).sum())
    if thumbs:
        pick = [thumbs[i] for i in np.linspace(0, len(thumbs) - 1, min(8, len(thumbs))).round().astype(int)]
        h = max(t.shape[0] for t in pick)
        pick = [cv2.copyMakeBorder(t, 0, h - t.shape[0], 0, 4, cv2.BORDER_CONSTANT) for t in pick]
        cv2.imwrite(stem + "_sheet.jpg", np.hstack(pick))
    with open(stem + ".json", "w", encoding="utf-8") as f:
        json.dump({**info, "result": result, "error": error}, f, indent=1, default=float)

app = FastAPI(title="SignSync AI sign recognition", version="1.0.0")
# The Expo web build runs on another port, so the browser needs CORS. The API holds no user data.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET", "POST"], allow_headers=["*"])

recognizer = SignRecognizer()

# Test results of the deployed model, copied from pipeline/asl20_conformer_face/RESULTS.md.
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "model_info.json"), encoding="utf-8") as f:
    MODEL_INFO = json.load(f)


def error(status: int, code: str, message: str) -> JSONResponse:
    return JSONResponse(status_code=status, content={"error": {"code": code, "message": message}})


@app.get("/health")
def health():
    return {"status": "ok", "model": "asl20_conformer_face", "language": "ASL", "labels": recognizer.labels}


@app.get("/model")
def model():
    return MODEL_INFO


# A plain def runs in FastAPI's thread pool, so a slow clip does not block other requests.
@app.post("/recognize")
def recognize(video: UploadFile = File(...)):
    suffix = os.path.splitext(video.filename or "")[1] or ".mp4"
    fd, path = tempfile.mkstemp(suffix=suffix)
    try:
        size = 0
        with os.fdopen(fd, "wb") as out:
            while chunk := video.file.read(1024 * 1024):
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    return error(413, "too_large", "The video is too large. Record a shorter clip.")
                out.write(chunk)
        if size == 0:
            return error(400, "bad_video", "The video is empty.")
        info = {} if DEBUG_DIR else None
        try:
            result = recognizer.recognize(path, debug=info)
        except RecognitionError as e:
            if DEBUG_DIR:
                save_debug(path, info, None, e.code)
            raise
        if DEBUG_DIR:
            save_debug(path, info, result, None)
        return result
    except RecognitionError as e:
        return error(422, e.code, e.message)
    finally:
        try:
            os.remove(path)
        except OSError:
            pass
