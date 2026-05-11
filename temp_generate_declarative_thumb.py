import os
import cv2
import requests

video_url = "https://megazonecloudwebinar.blob.core.windows.net/agentwebinar-may/1%ED%9A%8C%EC%B0%A8%20%EC%84%A0%EC%96%B8%EC%A0%81%20%EC%97%90%EC%9D%B4%EC%A0%84%ED%8A%B8%20%EA%B0%9C%EC%9A%94%EC%99%80%20%EC%99%84%EC%84%B1%20%EB%A1%9C%EB%93%9C%EB%A7%B5-20260507_235002UTC-Meeting%20Recording%201.mp4?sp=r&st=2026-05-11T04:29:44Z&se=2027-05-11T12:44:44Z&spr=https&sv=2025-11-05&sr=b&sig=pChCM8N1wlYTdIL1kjpZ6FQWHekl0qE3v4XGbqTt%2B4s%3D"

temp_video = "temp_declarative_video.mp4"
out_file = "declarative_agent_1_thumb.jpg"

headers = {"User-Agent": "Mozilla/5.0"}

with requests.get(video_url, headers=headers, stream=True, timeout=120) as response:
    response.raise_for_status()
    with open(temp_video, "wb") as f:
        for chunk in response.iter_content(chunk_size=1024 * 1024):
            if chunk:
                f.write(chunk)

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

print(f"Wrote {out_file} at 0.1s")

if os.path.exists(temp_video):
    os.remove(temp_video)
