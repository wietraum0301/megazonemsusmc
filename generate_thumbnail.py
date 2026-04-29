#!/usr/bin/env python
# -*- coding: utf-8 -*-

import cv2
import requests
import os
from pathlib import Path

# 동영상 URL
video_url = "https://megazonecloudwebinar.blob.core.windows.net/spfwebinar/SPF%20%EC%9B%A8%EB%B9%84%EB%82%98%201%ED%9A%8C%EC%B0%A8%20%5B%EB%A9%94%EA%B0%80%EC%A1%B4%ED%81%B4%EB%9D%BC%EC%9A%B0%EB%93%9C%5D%20%EC%97%90%EC%9D%B4%EC%A0%84%ED%8B%B1%20AI%EC%8B%9C%EB%8C%80%2C%20M365%20%EC%BD%94%ED%8C%8C%EC%9D%BC%EB%9F%BF%20%EB%B9%84%EC%A6%88%EB%8B%88%EC%8A%A4%20%EC%97%90%EC%9D%B4%EC%A0%84%ED%8A%B8%20%EC%88%98%EC%97%85%20%EC%8B%9C%EB%A6%AC%EC%A6%88%204%EC%9B%94%201%ED%9A%8C%EC%B0%A8-20260408_065556UTC-Meeting%20Recording.mp4?sp=r&st=2026-04-29T05:54:07Z&se=2027-04-29T14:09:07Z&spr=https&sv=2024-11-04&sr=b&sig=VtJ%2BYtTrFlfc3v4b1lbpqsY9NFMrCsMr%2FxSfpAeFt04%3D"

print("📥 영상 다운로드 중...")
try:
    # 영상 다운로드
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(video_url, headers=headers, timeout=30)
    
    if response.status_code != 200:
        print(f"❌ 다운로드 실패: {response.status_code}")
        exit(1)
    
    # 임시 파일로 저장
    temp_video = "temp_video.mp4"
    with open(temp_video, 'wb') as f:
        f.write(response.content)
    
    print(f"✅ 다운로드 완료 ({len(response.content) / (1024*1024):.1f} MB)")
    
    # 동영상 파일 열기
    print("🎬 영상 처리 중...")
    cap = cv2.VideoCapture(temp_video)
    
    if not cap.isOpened():
        print("❌ 영상 파일을 열 수 없습니다")
        exit(1)
    
    # 총 프레임 수 확인
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    print(f"📊 영상 정보: {total_frames} frames, {fps:.2f} FPS")
    
    # 5초 지점의 프레임으로 이동 (frame index = 5초 * fps)
    frame_index = int(5 * fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, frame_index)
    
    ret, frame = cap.read()
    
    if not ret:
        print("❌ 프레임을 읽을 수 없습니다")
        cap.release()
        exit(1)
    
    # 이미지 크기 조정 (400x225)
    frame_resized = cv2.resize(frame, (400, 225))
    
    # 썸네일 저장
    output_file = "spf_webinar_1_thumb.jpg"
    cv2.imwrite(output_file, frame_resized)
    
    print(f"✅ 썸네일 생성 완료: {output_file}")
    
    # 정리
    cap.release()
    os.remove(temp_video)
    print("✨ 임시 파일 정리 완료")
    
except Exception as e:
    print(f"❌ 오류 발생: {e}")
    exit(1)
