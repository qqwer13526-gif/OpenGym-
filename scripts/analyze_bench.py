"""Run from project root: .venv/Scripts/python scripts/analyze_bench.py data/bench.mp4"""
import argparse
import json
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from backend.pose import extract_angles

def main():
    parser = argparse.ArgumentParser(description='Bench press pose feasibility test; no quality score')
    parser.add_argument('video', type=Path)
    parser.add_argument('--model', default='yolo11n-pose.pt')
    parser.add_argument('--device', default='cpu', help='cpu or 0 for first CUDA GPU')
    parser.add_argument('--max-frames', type=int, default=300)
    parser.add_argument('--output', type=Path, default=Path('reports/bench-analysis.json'))
    args = parser.parse_args()
    if not args.video.is_file():
        parser.error(f'Real video not found: {args.video}. No results generated.')
    if args.max_frames <= 0:
        parser.error('--max-frames must be positive')
    import cv2
    from ultralytics import YOLO
    cap = cv2.VideoCapture(str(args.video))
    if not cap.isOpened():
        parser.error('Video could not be decoded')
    fps = cap.get(cv2.CAP_PROP_FPS)
    rows = []
    try:
        model = YOLO(args.model)
        for frame_id in range(args.max_frames):
            ok, frame = cap.read()
            if not ok:
                break
            result = model.predict(frame, device=args.device, verbose=False, imgsz=640)[0]
            points = result.keypoints.data.cpu().tolist() if result.keypoints is not None else []
            # Exclude multi-person frames: no reliable athlete identity tracking on Day 1.
            angles = extract_angles(points[0]) if len(points) == 1 else {'left':None,'right':None}
            rows.append({'frame':frame_id, 'time_seconds':frame_id/fps if fps>0 else None, 'people':len(points), 'elbow_degrees':angles})
    finally:
        cap.release()
    if not rows:
        raise RuntimeError('No decodable frames; no report generated')
    valid = sum(any(v is not None for v in row['elbow_degrees'].values()) for row in rows)
    report = {'status':'observations_only' if valid else 'insufficient_keypoints', 'model':args.model, 'device':args.device, 'analyzed_frames':len(rows), 'valid_frames':valid, 'quality_score':None, 'limitations':['2D perspective-dependent angles', 'Not validated on bench press', 'Multi-person frames excluded', 'No rep counting or medical assessment'], 'frames':rows}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Wrote {args.output}: {valid}/{len(rows)} frames with visible elbow joints')

if __name__ == '__main__':
    main()
