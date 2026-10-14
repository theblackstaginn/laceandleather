from PIL import Image
from pathlib import Path

p = Path("assets/smithy/smithy-8.png")
im = Image.open(p).convert("RGB")
pad = 32
im.crop((pad, pad, im.width - pad, im.height - pad)).save("smithy-8-clean.png", "PNG")
