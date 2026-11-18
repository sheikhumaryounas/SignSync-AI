"""Recognises one ASL sign from a short video clip, using the Conformer model in pipeline/.

The steps are the same ones live_predict.py uses on a webcam, so the app gets the same answers:
MediaPipe Holistic on every frame -> hands + 13 face/body points per frame (165 numbers) -> image-shape fix
(input_aspect.txt) -> trim to the frames with hands -> 60 frames -> 172 features -> ONNX Conformer.
"""
import json
import os
import sys
import time

import cv2
import numpy as np
import onnxruntime as ort

HERE = os.path.dirname(os.path.abspath(__file__))
PIPELINE_DIR = os.path.join(HERE, "pipeline")
MODEL_DIR = os.path.join(PIPELINE_DIR, "asl20_conformer_face")
sys.path.insert(0, PIPELINE_DIR)

from body import FEAT_DIM, NOSE, N_BODY, frame_to_body_vector, normalize_body, trim_body  # noqa: E402
from extract_landmarks import _holistic  # noqa: E402
from live_predict import match_aspect, read_train_aspect  # noqa: E402

MIN_HAND_FRAMES = 8          # fewer frames with a hand than this is not a sign

# The model always picks one of its 20 signs, even for a sign it was never trained on. An answer is only
# accepted when the model is sure of it AND clearly prefers it over the runner-up; otherwise the app asks
# the signer to sign again. Trained with label smoothing 0.1, so a confident answer is about 0.8 - 0.9.
# Both can be tuned without code changes, e.g. $env:SIGNSYNC_MIN_CONFIDENCE = "0.8".
MIN_CONFIDENCE = float(os.environ.get("SIGNSYNC_MIN_CONFIDENCE", 0.50))
MIN_MARGIN = float(os.environ.get("SIGNSYNC_MIN_MARGIN", 0.30))
# Movements that are not one of the 20 signs mostly come out as these two (about 94% of random hand
# movements in a test), so they need a higher score. With the margin, this cut wrongly accepted random
# movements from 80% (50% confidence alone) to 18%. Above ~0.9 even real signs rarely score, because of label smoothing.
STRICT_SIGNS = set(filter(None, os.environ.get("SIGNSYNC_STRICT_SIGNS", "callonphone,hungry").split(",")))
STRICT_CONFIDENCE = float(os.environ.get("SIGNSYNC_STRICT_CONFIDENCE", 0.90))
MAX_SIDE = 640               # frames are scaled down to this before MediaPipe; landmarks are relative, so no loss
# MediaPipe runs on at most this many frames per second of video. Each sign is resampled to 60 frames
# anyway, and live_predict.py ran at about this rate on a laptop webcam. Halves the time of a 30 fps clip.
MAX_FPS = float(os.environ.get("SIGNSYNC_MAX_FPS", 15))


class RecognitionError(Exception):
    """A problem with the clip itself (not the server). code is sent to the app."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def _draw(frame, result):
    """Small copy of a frame with the detected hands and body drawn on it (debug mode only)."""
    import mediapipe as mp

    img = frame.copy()
    draw, hol = mp.solutions.drawing_utils, mp.solutions.holistic
    draw.draw_landmarks(img, result.pose_landmarks, hol.POSE_CONNECTIONS)
    draw.draw_landmarks(img, result.left_hand_landmarks, hol.HAND_CONNECTIONS,
                        draw.DrawingSpec(color=(0, 200, 0), thickness=2, circle_radius=2))
    draw.draw_landmarks(img, result.right_hand_landmarks, hol.HAND_CONNECTIONS,
                        draw.DrawingSpec(color=(0, 0, 230), thickness=2, circle_radius=2))
    h, w = img.shape[:2]
    return cv2.resize(img, (240, round(240 * h / w)))


class SignRecognizer:
    def __init__(self, model_dir: str = MODEL_DIR):
        self.session = ort.InferenceSession(os.path.join(model_dir, "sign_conformer.onnx"))
        if self.session.get_inputs()[0].shape[-1] != FEAT_DIM:
            raise RuntimeError("Expected the hands + face/body Conformer (172 features per frame).")
        with open(os.path.join(model_dir, "labels.json"), encoding="utf-8") as f:
            labels = json.load(f)
        self.labels = [labels[str(i)] for i in range(len(labels))]
        self.train_aspect = read_train_aspect(os.path.join(model_dir, "input_aspect.txt"))
        self._warm_up()

    def _warm_up(self):
        """Loads MediaPipe's models and runs the network once at start-up, so the first user's
        recognition is not slowed down by it (about 10 s on the first clip otherwise)."""
        holistic = _holistic()
        try:
            holistic.process(np.zeros((480, 360, 3), np.uint8))
        finally:
            holistic.close()
        self.session.run(None, {"landmarks": np.zeros((1, 60, FEAT_DIM), np.float32)})

    def _landmarks(self, path: str, debug: dict | None = None) -> np.ndarray:
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
            raise RecognitionError("bad_video", "The video could not be read.")
        # Phones store portrait video as landscape frames plus a rotation tag. This OpenCV build does not
        # apply the tag by default, so without this the model sees every phone clip turned 90 degrees.
        cap.set(cv2.CAP_PROP_ORIENTATION_AUTO, 1)
        fps = cap.get(cv2.CAP_PROP_FPS) or 30
        if debug is not None:
            debug.update(fps=fps, orientation_meta=cap.get(cv2.CAP_PROP_ORIENTATION_META),
                         orientation_auto=cap.get(cv2.CAP_PROP_ORIENTATION_AUTO), thumbs=[], raw=[])
        step = max(1, round(fps / MAX_FPS))
        holistic = _holistic()   # a new tracker per clip: tracking state must not leak between clips
        vectors, aspect, index = [], None, 0
        try:
            while True:
                index += 1
                # Skipped frames are only advanced past, not decoded into an image.
                if (index - 1) % step:
                    if not cap.grab():
                        break
                    continue
                ok, frame = cap.read()
                if not ok:
                    break
                h, w = frame.shape[:2]
                if max(h, w) > MAX_SIDE:
                    k = MAX_SIDE / max(h, w)
                    frame = cv2.resize(frame, (round(w * k), round(h * k)), interpolation=cv2.INTER_AREA)
                    h, w = frame.shape[:2]
                if aspect is None and self.train_aspect:
                    aspect = (w / h) / self.train_aspect
                result = holistic.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                v = frame_to_body_vector(result)
                vectors.append(match_aspect(v, aspect) if aspect else v)
                if debug is not None:
                    debug["frame_size"] = [w, h]
                    debug["aspect_factor"] = aspect
                    debug["raw"].append(v)
                    debug["thumbs"].append(_draw(frame, result))
        finally:
            cap.release()
            holistic.close()
        if not vectors:
            raise RecognitionError("bad_video", "The video has no frames.")
        return np.asarray(vectors, dtype=np.float32)

    def recognize(self, path: str, top: int = 3, debug: dict | None = None) -> dict:
        started = time.perf_counter()
        seq = self._landmarks(path, debug)

        hand_frames = int((np.abs(seq[:, :126]).sum(axis=1) > 0).sum())
        if hand_frames < MIN_HAND_FRAMES:
            raise RecognitionError("no_hands", "No hands were found in the video.")
        body = seq[:, 126:].reshape(len(seq), N_BODY, 3)
        if not (np.abs(body[:, NOSE]).sum(axis=1) > 0).any():
            raise RecognitionError("no_body", "Head and shoulders were not found in the video.")

        x = normalize_body(trim_body(seq))[None].astype(np.float32)
        logits = self.session.run(None, {"landmarks": x})[0][0]
        p = np.exp(logits - logits.max())
        p /= p.sum()
        order = np.argsort(p)[::-1][:top]
        best, second = float(p[order[0]]), float(p[order[1]])
        needed = STRICT_CONFIDENCE if self.labels[order[0]] in STRICT_SIGNS else MIN_CONFIDENCE
        reason = "low_confidence" if best < needed else "ambiguous" if best - second < MIN_MARGIN else None
        return {
            "predictions": [{"label": self.labels[i], "confidence": round(float(p[i]), 4)} for i in order],
            # False: probably not one of the 20 signs (or signed unclearly); the app asks to sign again.
            "accepted": reason is None,
            "reason": reason,
            # Raw scores, kept so the thresholds above can be tuned on real recordings (see debug mode).
            "scores": {
                "margin": round(best - second, 4),
                "maxLogit": round(float(logits.max()), 4),
                "energy": round(float(logits.max() + np.log(np.exp(logits - logits.max()).sum())), 4),
            },
            "frames": int(len(seq)),
            "handFrames": hand_frames,
            "processingMs": round((time.perf_counter() - started) * 1000),
        }
