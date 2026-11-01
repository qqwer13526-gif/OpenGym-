import math
from fastapi.testclient import TestClient
from backend.main import app
from backend.pose import elbow_angle, extract_angles

def test_health():
    response=TestClient(app).get('/health')
    assert response.status_code==200
    assert response.json()['analysis_mode']=='local_cli'

def test_angles():
    assert elbow_angle((0,1),(0,0),(1,0))==90
    assert elbow_angle((-1,0),(0,0),(1,0))==180
    assert elbow_angle((0,0),(0,0),(1,0)) is None

def test_confidence_and_nonfinite():
    points=[[0.,0.,0.] for _ in range(17)]
    assert extract_angles(points)=={'left':None,'right':None}
    points[5]=[0,1,1]; points[7]=[0,0,1]; points[9]=[1,0,1]
    assert extract_angles(points)['left']==90
    points[5][0]=math.nan
    assert extract_angles(points)['left'] is None

def test_missing_video(tmp_path):
    import subprocess, sys
    from pathlib import Path
    root=Path(__file__).resolve().parents[2]
    output=tmp_path/'report.json'
    p=subprocess.run([sys.executable,str(root/'scripts/analyze_bench.py'),str(tmp_path/'absent.mp4'),'--output',str(output)],capture_output=True,text=True)
    assert p.returncode!=0
    assert not output.exists()
