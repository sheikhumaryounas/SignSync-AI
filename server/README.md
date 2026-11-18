# SignSync sign-recognition server

Runs the trained Conformer model (`pipeline/asl20_conformer_face/`) behind a small API that the app
uses for **Sign → Text** and for the signer side of **Conversation**.

The app records one sign (3 seconds, after a 3-2-1 countdown) and uploads the clip. The server runs
MediaPipe Holistic on every frame and applies the same preprocessing as `pipeline/live_predict.py`.
It then returns the model's top 3 answers. Clips are deleted as soon as they have been processed.

The model recognises **20 ASL signs**: bye, callonphone, drink, fine, happy, hello, home, hungry, no,
please, sad, see, sick, sleep, thankyou, time, wait, water, where, yes. Accuracy and limits are in
[`pipeline/asl20_conformer_face/RESULTS.md`](pipeline/asl20_conformer_face/RESULTS.md).

## First-time setup (Windows)

Needs Python 3.10, 3.11 or 3.12, because `mediapipe==0.10.14` has no build for newer versions.

```powershell
cd server
py -3.12 -m venv .venv
.venv\Scripts\python -m pip install -r requirements.txt
```

## Start the server

```powershell
cd server
.venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

`--host 0.0.0.0` lets the phone reach it over Wi-Fi. When Windows Firewall asks, allow Python on
**private networks**.

Check it from the laptop at <http://localhost:8000/health>.

## Connecting the app

Run the server and `npx expo start` on the **same laptop**. No IP address or firewall set-up is needed.

The app sends recognition requests to the Expo dev server it was loaded from, under `/sign-api`.
`metro.config.js` in the app folder forwards them to this server on `127.0.0.1:8000`. If the phone
can load the app, it can reach the model. This also works with `expo start --tunnel`.

- After changing `metro.config.js`, restart Expo (`Ctrl+C`, then `npx expo start`).
- If the server runs on **another computer**, enter its address in the app under
  **Settings → Sign recognition server** (for example `192.168.1.20:8000`) and tap **Test and save**.
  You can also set `EXPO_PUBLIC_SIGN_API_URL` in a `.env` file. That computer must allow port 8000
  through its firewall.
- Recording needs the Android or iOS app. Expo's camera cannot record video in a web browser.

## API

| Method | Path | Body | Answer |
|---|---|---|---|
| GET | `/health` | none | `{"status": "ok", "labels": [...]}` |
| GET | `/model` | none | Test results of the model (`model_info.json`), shown on the admin Metrics screen |
| POST | `/recognize` | multipart form, field `video` (mp4/mov, up to 30 MB) | `{"predictions": [{"label": "hello", "confidence": 0.93}, ...], "frames", "handFrames", "processingMs"}` |

Errors are sent as `{"error": {"code", "message"}}` with these codes:

- `no_hands`: no hands were found in the clip.
- `no_body`: the head and shoulders were not found.
- `bad_video`: the clip could not be read.
- `too_large`: the clip is over 30 MB.

## Unknown signs

The model always answers with one of its 20 signs, even for a movement it was never trained on.
The server therefore only accepts an answer when both of these hold:

- The confidence is at least `SIGNSYNC_MIN_CONFIDENCE`, default 0.50 (the model's own cut-off). The two "catch-all" signs
  `callonphone` and `hungry` need `SIGNSYNC_STRICT_CONFIDENCE`, default 0.90. Unknown movements mostly
  come out as one of these two.
- The answer leads the runner-up by at least `SIGNSYNC_MIN_MARGIN`, default 0.30.

Otherwise the response has `"accepted": false`. The app then shows **Sign not recognised** with
**Sign again**. On 300 random hand movements, this cut wrongly accepted answers from 80% (50%
confidence alone) to 18%. Most of the gain comes from the margin and the stricter catch-all signs.

To reject more, raise the thresholds, for example `$env:SIGNSYNC_MIN_CONFIDENCE = "0.8"`. Real signs will
then be rejected more often too. The reliable fix is to retrain with an extra "other" class built from
the remaining Kaggle signs.

## Debug mode

To see exactly what the model receives, start the server with `SIGNSYNC_DEBUG=1`:

```powershell
$env:SIGNSYNC_DEBUG = "1"; .venv\Scripts\python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Each recording is then kept in `server/debug/` with these files:

- the clip itself;
- `_raw.npy`: the landmarks, one row per frame;
- `_sheet.jpg`: 8 frames with the detected hands (green = left, red = right) and body drawn on;
- `.json`: frame size, rotation, how many frames had each hand, and the answer.

The clips show the signer's face. Delete the folder when you are done. The folder is in `.gitignore`.

## Tips for good results

- Keep your head, both shoulders and your hands in the frame. Hand positions are measured from the
  face and shoulders.
- Use good light and sign once per recording.
- The app hides answers below 50% confidence and offers the top 3 instead.
