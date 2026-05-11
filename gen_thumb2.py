import subprocess
import sys

url = "https://megazonecloudwebinar.blob.core.windows.net/agentwebinar-may/2%ED%9A%8C%EC%B0%A8%20Copilot%20Studio%20%ED%99%98%EA%B2%BD%20%EC%9D%B4%ED%95%B4%20%EB%B0%8F%20%EA%B8%B0%EB%B3%B8%20%EC%97%90%EC%9D%B4%EC%A0%84%ED%8A%B8-20260510_234813UTC-Meeting%20Recording%202.mp4?sp=r&st=2026-05-11T05:21:33Z&se=2027-05-11T13:36:33Z&spr=https&sv=2025-11-05&sr=b&sig=88UixqYA73K%2F5hkDpSlCGJVtKsqc1zP0Yth%2FpQ5Yc14%3D"
output = "declarative_agent_2_thumb.jpg"

cmd = [
    "ffmpeg",
    "-y",
    "-ss", "0.1",
    "-i", url,
    "-vframes", "1",
    "-q:v", "2",
    "-update",
    output
]

result = subprocess.run(cmd)
sys.exit(result.returncode)
