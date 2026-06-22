import os
import cv2
import requests

video_url = "https://megazonecloudwebinar.blob.core.windows.net/agentwebinar-may/9%ED%9A%8C%EC%B0%A8%20Adaptive%20Card%20%2B%20Power%20Automate%20%EC%9E%90%EB%8F%99%ED%99%94-20260618_235442UTC-Meeting%20Recording%201.mp4?sp=r&st=2026-06-22T05:12:47Z&se=2026-08-22T13:27:47Z&spr=https&sv=2026-02-06&sr=b&sig=NJSDnarPiObtdIwatYpa9phia3deDYQ4F5guIRQBZw4%3D"

temp_video = "temp_declarative_9_video.mp4"
out_file = "declarative_agent_9_thumb.jpg"

headers = {"User-Agent": "Mozilla/5.0"}

print("Downloading video...")
with requests.get(video_url, headers=headers, stream=True, timeout=120, verify=False) as response:
    response.raise_for_status()
    with open(temp_video, "wb") as f:
        for chunk in response.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)

print("Extracting thumbnail...")
cap = cv2.VideoCapture(temp_video)
if not cap.isOpened():
    raise RuntimeError("Failed to open downloaded video")

fps = cap.get(cv2.CAP_PROP_FPS)
if not fps or fps <= 0:
    fps = 30.0

frame_index = int(0.1 * fps)
cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
ok, frame = cap.read()
cap.release()

if not ok or frame is None:
    raise RuntimeError("Failed to read frame at 0.1s")

frame = cv2.resize(frame, (400, 225))
if not cv2.imwrite(out_file, frame):
    raise RuntimeError("Failed to write thumbnail image")

print(f"Wrote {out_file}")

if os.path.exists(temp_video):
    os.remove(temp_video)
    print("Cleaned up temp file.")
