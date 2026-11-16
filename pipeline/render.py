"""Turn a plan into a video file and a cover image."""
import json
import subprocess

from . import audio, config, gifts, music, voice


def run(*command: str) -> None:
    subprocess.run(command, check=True, cwd=config.ROOT)


def seconds(path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0",
                          str(path)], capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


def render(plan: dict, name: str) -> dict:
    for slug in plan["slugs"]:
        gifts.prepare(slug)
    audio.ensure()
    if plan.get("music"):  # music written for this one video: public/audio/<name>.wav
        track = plan["music"]
        if "style" in track:
            music.compose(track["name"], track["style"], track.get("bpm"), track.get("root", 57),
                          track.get("scale", "minor"), track["seconds"], track.get("seed", 1))
        else:  # older entries: a chord list for the simple generator
            audio.OUT.mkdir(parents=True, exist_ok=True)
            audio.bed(f"{track['name']}.wav", track["bpm"], track["chords"], track["seconds"], track["energy"],
                      track.get("drums", True))
    props = dict(plan["props"])
    if plan.get("voice"):
        spoken = plan["voice"]
        lines = voice.record(spoken["name"], spoken["voice"], spoken["lines"],
                             spoken.get("rate", "+8%"), spoken.get("pitch", "+0Hz"))
        if plan["style"] != "custom":  # hand-made videos read their lines from the recorded file
            props["lines"] = lines

    config.OUT.mkdir(exist_ok=True)
    video, cover = config.OUT / f"{name}.mp4", config.OUT / f"{name}.jpg"
    video_props, cover_props = config.OUT / "props.json", config.OUT / "cover-props.json"
    video_props.write_text(json.dumps(props, ensure_ascii=False))
    cover_props.write_text(json.dumps(plan["cover"], ensure_ascii=False))
    # Gift assets and voice lines are served from the bundle's public folder, so bundle after preparing them.
    run("npx", "remotion", "bundle", "src/index.ts", "--out-dir=build", "--log=error")
    run("npx", "remotion", "render", "build", plan["composition"], str(video),
        f"--props={video_props}", "--crf=20", "--log=error")
    run("npx", "remotion", "still", "build", plan.get("cover_composition", "Cover"), str(cover), f"--props={cover_props}",
        "--jpeg-quality=90", "--log=error")
    return {"video": str(video), "cover_file": str(cover), "seconds": round(seconds(video), 2)}
