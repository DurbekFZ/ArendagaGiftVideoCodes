"""Generate Uzbek voice-over lines with edge-tts, one file per line.

Usage: python3 -m pipeline.voice <name> <voice> "line 1" "line 2" ...
Writes public/audio/voice/<name>/<n>.mp3 and public/audio/voice/<name>/lines.json
(with measured durations so captions stay in sync).
"""
import asyncio
import json
import os
import pathlib
import subprocess
import sys

import edge_tts

ROOT = pathlib.Path(__file__).resolve().parent.parent / "public" / "audio" / "voice"
PROXY = os.environ.get("HTTPS_PROXY") or None


def duration(path: pathlib.Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(path)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


async def speak(name: str, voice: str, lines: list[str]) -> list[dict]:
    target = ROOT / name
    target.mkdir(parents=True, exist_ok=True)
    result = []
    for index, line in enumerate(lines):
        path = target / f"{index}.mp3"
        await edge_tts.Communicate(line, voice, rate="+8%", proxy=PROXY).save(str(path))
        result.append({"file": f"audio/voice/{name}/{index}.mp3", "text": line,
                       "seconds": round(duration(path), 3)})
    (target / "lines.json").write_text(json.dumps(result, ensure_ascii=False, indent=2))
    return result


def record(name: str, voice: str, lines: list[str]) -> list[dict]:
    return asyncio.run(speak(name, voice, lines))


if __name__ == "__main__":
    print(json.dumps(record(sys.argv[1], sys.argv[2], sys.argv[3:]), ensure_ascii=False))
