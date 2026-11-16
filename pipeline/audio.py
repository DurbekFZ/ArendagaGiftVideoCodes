"""Synthesize original (licence-free) music beds and sound effects.

Usage: python3 -m pipeline.audio
Writes public/audio/{bed_*.wav,whoosh.wav,impact.wav,pop.wav,riser.wav}.
"""
import pathlib
import wave

import numpy as np

SR = 44100
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "audio"
rng = np.random.default_rng(7)


def save(name, signal):
    signal = signal / max(1e-9, np.max(np.abs(signal))) * 0.89
    data = (signal * 32767).astype("<i2")
    if data.ndim == 1:
        data = np.stack([data, data], axis=1)
    with wave.open(str(OUT / name), "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(SR)
        handle.writeframes(data.tobytes())


def t(seconds):
    return np.arange(int(SR * seconds)) / SR


def lowpass(signal, cutoff):
    # One-pole filter; cutoff may be an array for sweeps.
    alpha = 1 - np.exp(-2 * np.pi * np.broadcast_to(cutoff, signal.shape) / SR)
    out = np.empty_like(signal)
    acc = 0.0
    for i in range(len(signal)):
        acc += alpha[i] * (signal[i] - acc)
        out[i] = acc
    return out


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def place(track, clip, at, gain=1.0):
    start = int(at * SR)
    end = min(len(track), start + len(clip))
    if end > start:
        track[start:end] += clip[: end - start] * gain


def kick():
    x = t(0.32)
    freq = 46 + 110 * np.exp(-x * 34)
    return np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-x * 11)


def hat(length=0.05):
    x = t(length)
    noise = rng.standard_normal(len(x))
    return (noise - lowpass(noise, 7000)) * np.exp(-x * 70)


def clap():
    x = t(0.2)
    noise = rng.standard_normal(len(x))
    body = (lowpass(noise, 3200) - lowpass(noise, 900)) * np.exp(-x * 24)
    return body


def pad(notes, seconds, bright=1400):
    x = t(seconds)
    out = np.zeros(len(x))
    for note in notes:
        for detune in (-0.07, 0.0, 0.07):
            phase = 2 * np.pi * hz(note + detune) * x
            out += np.sin(phase) + 0.35 * np.sin(2 * phase) + 0.18 * np.sin(3 * phase)
    env = np.minimum(1, x / 0.25) * np.minimum(1, (seconds - x) / 0.35)
    return lowpass(out, bright) * env


def pluck(note, seconds=0.35):
    x = t(seconds)
    phase = 2 * np.pi * hz(note) * x
    tone = np.sin(phase) + 0.5 * np.sin(2 * phase) * np.exp(-x * 9) + 0.25 * np.sin(3 * phase) * np.exp(-x * 16)
    return tone * np.exp(-x * 7)


def bass(note, seconds):
    x = t(seconds)
    phase = 2 * np.pi * hz(note) * x
    return (np.sin(phase) + 0.3 * np.sin(2 * phase)) * np.minimum(1, x / 0.01) * np.exp(-x * 2.2)


def bed(name, bpm, chords, seconds, energy, drums=True):
    beat = 60 / bpm
    track = np.zeros(int(SR * seconds))
    bar = beat * 4
    bars = int(np.ceil(seconds / bar))
    for index in range(bars):
        chord = chords[index % len(chords)]
        at = index * bar
        place(track, pad(chord, bar + 0.3), at, 0.085)
        root = chord[0] - 12
        for step in range(8):
            when = at + step * beat / 2
            if step % 2 == 0:
                if drums:
                    place(track, kick(), when, 0.9 if step % 4 == 0 else 0.75 * energy)
                place(track, bass(root, beat * 0.9), when, 0.34 if drums else 0.2)
            if drums:
                place(track, hat(), when, 0.12 if step % 2 else 0.06)
                if energy > 0.7:
                    place(track, hat(0.03), when + beat / 4, 0.05)
                if step in (2, 6):
                    place(track, clap(), when, 0.3 * energy)
            arp = chord[(step * 2 + index) % len(chord)] + 12
            place(track, pluck(arp), when, 0.16)
    fade = int(SR * 1.2)
    track[-fade:] *= np.linspace(1, 0, fade)
    track[: int(SR * 0.03)] *= np.linspace(0, 1, int(SR * 0.03))
    save(name, np.tanh(track * 1.6))


def whoosh():
    x = t(0.55)
    noise = rng.standard_normal(len(x))
    sweep = 500 + 6500 * np.sin(np.pi * x / 0.55) ** 2
    save("whoosh.wav", lowpass(noise, sweep) * np.sin(np.pi * x / 0.55) ** 2)


def impact():
    x = t(1.1)
    freq = 38 + 90 * np.exp(-x * 20)
    sub = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-x * 4.5)
    noise = lowpass(rng.standard_normal(len(x)), 2600) * np.exp(-x * 9) * 0.5
    shimmer = sum(np.sin(2 * np.pi * hz(n) * x) for n in (84, 88, 91, 96)) * np.exp(-x * 3.5) * 0.06
    save("impact.wav", sub + noise + shimmer)


def pop():
    x = t(0.16)
    freq = 520 + 700 * np.exp(-x * 40)
    save("pop.wav", np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-x * 30))


def riser():
    x = t(1.4)
    noise = rng.standard_normal(len(x))
    sweep = 300 + 9000 * (x / 1.4) ** 2.2
    tone = np.sin(2 * np.pi * np.cumsum(180 + 700 * (x / 1.4) ** 2) / SR) * 0.25
    save("riser.wav", (lowpass(noise, sweep) + tone) * (x / 1.4) ** 1.6)


def bubble():
    """A short run of rising water bubbles (for potion and liquid scenes)."""
    track = np.zeros(int(SR * 0.9))
    for i, at in enumerate((0.0, 0.11, 0.19, 0.33, 0.42, 0.58, 0.7)):
        x = t(0.09)
        start = 380 + 140 * i + rng.uniform(-40, 40)
        freq = start * (1 + 1.8 * x / 0.09)
        blip = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.sin(np.pi * x / 0.09) ** 2
        place(track, blip, at, 0.6 + 0.4 * rng.uniform())
    save("bubble.wav", track)


def flaps():
    """Split-flap board clatter: a dense run of plastic flap clicks that slows and stops (about 1.1 s)."""
    track = np.zeros(int(SR * 1.25))
    at, gap = 0.0, 0.018
    while at < 1.05:
        x = t(0.025)
        noise = rng.standard_normal(len(x))
        click = (noise - lowpass(noise, 1800)) * np.exp(-x * 260)
        knock = np.sin(2 * np.pi * (900 + rng.uniform(-150, 150)) * x) * np.exp(-x * 320) * 0.6
        place(track, click + knock, at, 0.55 + 0.45 * rng.uniform())
        at += gap * (1 + rng.uniform(-0.3, 0.3))
        gap *= 1.035
    x = t(0.06)  # the last flap lands a little harder
    place(track, (rng.standard_normal(len(x)) * 0.6 + np.sin(2 * np.pi * 420 * x)) * np.exp(-x * 120), at, 1.2)
    save("flaps.wav", track)


def chime():
    """Two small bells struck together, inharmonic partials (for bells and reveals)."""
    x = t(2.2)
    out = np.zeros(len(x))
    for base, delay, gain in ((hz(88), 0.0, 1.0), (hz(93), 0.045, 0.8)):
        shifted = np.clip(x - delay, 0, None)
        for ratio, amp, decay in ((1.0, 1.0, 2.2), (2.76, 0.45, 4.0), (5.4, 0.22, 7.0), (8.9, 0.1, 11.0)):
            out += gain * amp * np.sin(2 * np.pi * base * ratio * shifted) * np.exp(-shifted * decay) * (x >= delay)
    save("chime.wav", out * np.minimum(1, x / 0.002))


def glass():
    """A light tap on a glass card: a high, short, slightly detuned ping (softer than pop)."""
    x = t(0.5)
    out = sum(a * np.sin(2 * np.pi * f * x) * np.exp(-x * d)
              for f, a, d in ((hz(96), 1.0, 9.0), (hz(96) * 2.31, 0.35, 16.0), (hz(103), 0.25, 12.0)))
    save("glass.wav", out * np.minimum(1, x / 0.001))


def sparkle():
    """A rising glissando of tiny bell blips ending on a held shimmer (for a rare-find reveal)."""
    track = np.zeros(int(SR * 1.6))
    notes = [84, 88, 91, 96, 100, 103]
    for i, note in enumerate(notes):
        x = t(0.9 if i == len(notes) - 1 else 0.35)
        blip = (np.sin(2 * np.pi * hz(note) * x) + 0.3 * np.sin(2 * np.pi * hz(note) * 2.76 * x) * np.exp(-x * 20))
        place(track, blip * np.exp(-x * (4 if i == len(notes) - 1 else 12)), i * 0.055, 0.5 + 0.1 * i)
    save("sparkle.wav", track)


def printer():
    """A thermal receipt printer feeding one line: a buzzing stepper burst with a soft paper rustle (about 0.45 s)."""
    x = t(0.45)
    env = np.sin(np.pi * np.clip(x / 0.42, 0, 1)) ** 0.6 * (x < 0.42)
    steps = np.sign(np.sin(2 * np.pi * 410 * x)) * 0.25 + np.sin(2 * np.pi * 820 * x) * 0.2
    flutter = 0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 31 * x))
    noise = rng.standard_normal(len(x))
    rustle = (noise - lowpass(noise, 2500)) * 0.35
    save("printer.wav", lowpass((steps * flutter + rustle) * env, 5200))


def tear():
    """Paper torn off a receipt edge: a quick rip of crackling noise that rises and stops (about 0.4 s)."""
    track = np.zeros(int(SR * 0.45))
    at = 0.0
    while at < 0.32:
        x = t(0.012)
        noise = rng.standard_normal(len(x))
        place(track, (noise - lowpass(noise, 1400)) * np.exp(-x * 300), at, 0.4 + 0.6 * (at / 0.32))
        at += 0.004 + rng.uniform(0, 0.006)
    save("tear.wav", track)


def till():
    """A small counter bell struck once: bright, round, with a warm low partial (for a total being rung up)."""
    x = t(1.8)
    base = hz(83)
    out = sum(a * np.sin(2 * np.pi * base * r * x) * np.exp(-x * d)
              for r, a, d in ((0.5, 0.35, 2.0), (1.0, 1.0, 2.6), (2.42, 0.4, 5.5), (3.9, 0.18, 9.0)))
    save("till.wav", out * np.minimum(1, x / 0.0015))


def build():
    OUT.mkdir(parents=True, exist_ok=True)
    # A minor / F / C / G flavours, voiced as MIDI notes.
    bed("bed_cinematic.wav", 92, [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 60, 64], [55, 59, 62, 67]], 16, 0.55)
    bed("bed_bright.wav", 108, [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 65], [55, 59, 62, 66]], 22, 0.75)
    bed("bed_drive.wav", 124, [[57, 60, 64, 69], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]], 18, 1.0)
    whoosh()
    impact()
    pop()
    riser()
    bubble()
    flaps()
    chime()
    glass()
    sparkle()
    printer()
    tear()
    till()


def ensure():
    """Synthesize the sound set once; later runs reuse it."""
    if not (OUT / "riser.wav").exists():
        build()
    if not (OUT / "bubble.wav").exists():
        bubble()
    if not (OUT / "flaps.wav").exists():
        flaps()
    if not (OUT / "chime.wav").exists():
        chime()
    if not (OUT / "glass.wav").exists():
        glass()
    if not (OUT / "sparkle.wav").exists():
        sparkle()
    if not (OUT / "till.wav").exists():
        printer()
        tear()
        till()


if __name__ == "__main__":
    build()
    print("audio ready:", sorted(p.name for p in OUT.glob("*.wav")))
