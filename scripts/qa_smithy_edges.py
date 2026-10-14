from PIL import Image
import numpy as np
from pathlib import Path
import json

ROOT = Path("assets/smithy-hires/masters")
scores = {}

for i in range(1, 13):
    p = ROOT / f"Smithy_Texture_{i:02d}.jpg"
    a = np.asarray(Image.open(p).convert("RGB"))
    edge = np.concatenate((
        a[:4].reshape(-1, 3),
        a[-4:].reshape(-1, 3),
        a[:, :4].reshape(-1, 3),
        a[:, -4:].reshape(-1, 3),
    ))
    bright = np.min(edge, axis=1) >= 248
    neutral = (np.max(edge, axis=1) - np.min(edge, axis=1)) <= 8
    score = float(np.mean(bright & neutral))
    scores[p.name] = round(score, 6)
    if score > 0.20:
        raise SystemExit(f"WHITE EDGE QA FAILED: {p.name} score={score:.4f}")

Path("assets/smithy-hires/edge-qa.json").write_text(json.dumps(scores, indent=2))
print(json.dumps(scores, indent=2))
