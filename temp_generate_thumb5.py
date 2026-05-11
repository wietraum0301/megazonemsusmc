import os
import cv2
import requests

video_url = "https://megazonecloudwebinar.blob.core.windows.net/spfwebinar/SPF%20%EC%9B%A8%EB%B9%84%EB%82%98%205%ED%9A%8C%EC%B0%A8%20%5B%EB%A9%94%EA%B0%80%EC%A1%B4%ED%81%B4%EB%9D%BC%EC%9A%B0%EB%93%9C%5D%20%EC%97%90%EC%9D%B4%EC%A0%84%ED%8B%B1%20AI%EC%8B%9C%EB%8C%80%2C%20M365%20%EC%BD%94%ED%8C%8C%EC%9D%BC%EB%9F%BF%20%EB%B9%84%EC%A6%88%EB%8B%88%EC%8A%A4%20%EC%97%90%EC%9D%B4%EC%A0%84%ED%8A%B8%20%EC%88%98%EC%97%85%20%EC%8B%9C%EB%A6%AC%EC%A6%88%204%EC%9B%94%205%ED%9A%8C%EC%B0%A8%20%EC%88%98%EC%97%85-20260506_060324UTC-Meeting%20Recording%204.mp4?sp=r&st=2026-05-11T01:54:53Z&se=2027-05-11T10:09:53Z&spr=https&sv=2025-11-05&sr=b&sig=0fQ9T4CF8fxvcCUFGj%2FdNT1lTmHv%2FINb8lPZWUO5Z20%3D"

temp_video = "temp_video_5.mp4"
out_file = "spf_webinar_5_thumb.jpg"

def main():
    headers = {"User-Agent": "Mozilla/5.0"}

    with requests.get(video_url, headers=headers, stream=True, timeout=120) as r:
        r.raise_for_status()
        with open(temp_video, "wb") as f:
            for chunk in r.iter_content(chunk_size=1024 * 1024):
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
    ok = cv2.imwrite(out_file, frame)
    if not ok:
        raise RuntimeError("Failed to write thumbnail image")

    size_mb = os.path.getsize(out_file) / (1024 * 1024)
    print(f"Wrote {out_file} at 0.1s ({size_mb:.2f} MB)")

if __name__ == "__main__":
    try:
        main()
    finally:
        if os.path.exists(temp_video):
            os.remove(temp_video)
