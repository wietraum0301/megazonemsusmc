import os

import cv2
import requests

video_url = "https://megazonecloudwebinar.blob.core.windows.net/agentwebinar-may/6%ED%9A%8C%EC%B0%A8%20%ED%86%A0%ED%94%BD(Topic)%EA%B3%BC%20%ED%8A%B8%EB%A6%AC%EA%B1%B0(Trigger)%20%EC%84%A4%EA%B3%84-20260527_234931UTC-Meeting%20Recording.mp4?sp=r&st=2026-05-28T03:52:39Z&se=2026-07-28T12:07:39Z&spr=https&sv=2026-02-06&sr=b&sig=YpjuyzyoSuRirajzGjnWOiQjllsUVvHCgDYmx2CpkMg%3D"

temp_video = "temp_video_6.mp4"
out_file = "declarative_agent_6_thumb.jpg"


def main():
    headers = {"User-Agent": "Mozilla/5.0"}

    with requests.get(video_url, headers=headers, stream=True, timeout=120) as response:
        response.raise_for_status()
        with open(temp_video, "wb") as file_handle:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    file_handle.write(chunk)

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