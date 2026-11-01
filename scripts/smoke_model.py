"""Synthetic blank image smoke test, NOT bench-press accuracy validation."""
import json
from pathlib import Path
import numpy as np
import torch
from ultralytics import YOLO

root=Path(__file__).resolve().parents[1]
device=0 if torch.cuda.is_available() else 'cpu'
model=YOLO(str(root/'work/yolo11n-pose.pt'))
result=model.predict(np.zeros((640,640,3),dtype=np.uint8),device=device,verbose=False)[0]
report={'test':'synthetic_blank_image_inference', 'device':str(device), 'inference_completed':True, 'detections':len(result.boxes), 'bench_press_validated':False}
(root/'reports/model-smoke.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report))
