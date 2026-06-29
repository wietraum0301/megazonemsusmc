import os
import cv2
import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

video_url = "https://megazonecloudwebinar.blob.core.windows.net/agentwebinar-may/10%ED%9A%8C%EC%B0%A8%20%EC%9D%B4%EB%B2%A4%ED%8A%B8%20%ED%8A%B8%EB%A6%AC%EA%B1%B0%20%EA%B8%B0%EB%B0%98%20%EC%9E%90%EC%9C%A8%20%EC%97%90%EC%9D%B4%EC%A0%84%ED%8A%B8%20%EC%99%84%EC%84%B1-20260625_235628UTC-Meeting%20Recording.mp4?sp=r&st=2026-06-29T01:19:28Z&se=2026-08-29T09:34:28Z&spr=https&sv=2026-02-06&sr=b&sig=pcJeKGR%2BJFBn44sPY%2BF4vG9nZVlbfHMWqOZ6t37eV1k%3D"

temp_video = "temp_declarative_10_video.mp4"
out_file = "declarative_agent_10_thumb.jpg"

headers = {"User-Agent": "Mozilla/5.0"}

with requests.get(video_url, headers=headers, stream=True, timeout=240, verify=False) as response:
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

frame_index = int(0.2 * fps)
cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
ok, frame = cap.read()
cap.release()

if not ok or frame is None:
    raise RuntimeError("Failed to read frame")

frame = cv2.resize(frame, (400, 225))
if not cv2.imwrite(out_file, frame):
    raise RuntimeError("Failed to write thumbnail image")

print(f"Wrote {out_file}")

if os.path.exists(temp_video):
    os.remove(temp_video)
