"""Render a hand-made video locally and build a contact sheet for self-review.

Usage: python -m pipeline.preview V20261116a
Reads queue/<id>.json, prepares its gifts and voice, then writes
out/<id>.mp4, out/<id>.jpg (cover) and out/<id>-sheet.jpg (one frame every 0.6 s).
"""
import json
import subprocess
import sys

from . import config, render


def main(video_id: str) -> None:
    item = json.loads((config.QUEUE / f"{video_id}.json").read_text())
    plan = {"style": "custom", "slugs": item["slugs"], "props": {}, "composition": video_id,
            "cover_composition": f"{video_id}Cover", "cover": {}, "voice": item.get("voice"), "music": item.get("music"), "gl": item.get("gl")}
    result = render.render(plan, video_id)
    sheet = config.OUT / f"{video_id}-sheet.jpg"
    columns = max(1, min(12, round(result["seconds"] / 0.6)))
    rows = -(-round(result["seconds"] / 0.6) // columns)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", result["video"], "-vf",
                    f"fps=1/0.6,scale=216:-1,tile={columns}x{rows}", "-frames:v", "1", str(sheet)], check=True)
    print(json.dumps({**result, "sheet": str(sheet)}))


if __name__ == "__main__":
    main(sys.argv[1])
