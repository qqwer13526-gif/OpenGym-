"""Day 1: 2D elbow geometry only; not a validated technique score."""
import math

def elbow_angle(shoulder, elbow, wrist):
    a = [shoulder[i] - elbow[i] for i in range(2)]
    b = [wrist[i] - elbow[i] for i in range(2)]
    norm = math.hypot(*a) * math.hypot(*b)
    if norm < 1e-8:
        return None
    cosine = max(-1., min(1., sum(x*y for x,y in zip(a,b))/norm))
    return round(math.degrees(math.acos(cosine)), 2)

def extract_angles(points, confidence=0.5):
    output = {}
    for side, ids in [('left', (5,7,9)), ('right',(6,8,10))]:
        joints = [points[i] for i in ids]
        valid = all(len(p) >= 3 and all(math.isfinite(float(v)) for v in p[:3]) and p[2] >= confidence for p in joints)
        output[side] = elbow_angle(*joints) if valid else None
    return output
