"""Compose an original backing track: a style, a key, a tempo and a seed give a unique piece.

Every video gets its own music. Seven styles differ in instruments, rhythm and
mood; the seed picks the chord progression and writes the melody, so two tracks
in the same style still do not sound alike. Everything is synthesized here, so
there is nothing to license.

Usage: python3 -m pipeline.music <name> <style> <bpm> <root_midi> <major|minor> <seconds> <seed>
Writes public/audio/<name>.wav.
"""
import pathlib
import sys
import wave

import numpy as np

SR = 44100
OUT = pathlib.Path(__file__).resolve().parent.parent / "public" / "audio"
SCALES = {"major": [0, 2, 4, 5, 7, 9, 11], "minor": [0, 2, 3, 5, 7, 8, 10]}
PROGRESSIONS = {  # scale degrees, one chord per bar
    "major": [[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [0, 3, 5, 4], [3, 0, 4, 5], [0, 2, 3, 4]],
    "minor": [[0, 5, 2, 6], [0, 3, 5, 4], [0, 6, 5, 6], [5, 6, 0, 0], [0, 2, 6, 5], [3, 5, 0, 6]],
}


def hz(midi):
    return 440.0 * 2 ** ((np.asarray(midi, dtype=float) - 69) / 12)


def t(seconds):
    return np.arange(int(SR * seconds)) / SR


def lowpass(x, cutoff, order=2):
    spectrum = np.fft.rfft(x)
    freqs = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(spectrum / np.sqrt(1 + (freqs / cutoff) ** (2 * order)), len(x))


def highpass(x, cutoff, order=2):
    return x - lowpass(x, cutoff, order)


def reverb(x, rng, seconds=1.6, mix=0.22, tone=5000):
    tail = int(SR * seconds)
    impulse = lowpass(rng.standard_normal(tail) * np.exp(-np.arange(tail) / (SR * seconds / 5)), tone)
    size = len(x) + tail
    wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(impulse, size), size)[: len(x)]
    return x * (1 - mix) + wet / (np.max(np.abs(wet)) + 1e-9) * np.max(np.abs(x)) * mix


def fade(x, attack=0.004, release=0.02):
    a, r = max(1, int(SR * attack)), max(1, int(SR * release))
    x = x.copy()
    x[:a] *= np.linspace(0, 1, a)
    x[-r:] *= np.linspace(1, 0, r)
    return x


# ---- instruments: each returns one note ----

def epiano(note, seconds):
    x = t(seconds)
    f = hz(note)
    tone = np.sin(2 * np.pi * f * x + 1.6 * np.exp(-x * 4) * np.sin(2 * np.pi * f * x))
    tine = 0.12 * np.sin(2 * np.pi * f * 14 * x) * np.exp(-x * 26)
    return fade((tone + tine) * np.exp(-x * 2.4))


def pluck(note, seconds):  # nylon string
    x = t(seconds)
    f = hz(note)
    out = sum(np.sin(2 * np.pi * k * f * x) * np.exp(-x * (1.8 + k * 1.5)) / k for k in range(1, 11) if k * f < 9000)
    return fade(out)


def kalimba(note, seconds):
    x = t(seconds)
    f = hz(note)
    out = (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * 2.76 * f * x) * np.exp(-x * 14)
           + 0.18 * np.sin(2 * np.pi * 5.4 * f * x) * np.exp(-x * 24))
    return fade(out * np.exp(-x * 4.5), attack=0.001)


def bell(note, seconds):
    x = t(seconds)
    f = hz(note)
    partials = [(1, 1.0, 1.6), (2.0, 0.5, 2.4), (2.41, 0.35, 3.2), (3.0, 0.22, 4.0), (4.52, 0.12, 6.0)]
    return fade(sum(a * np.sin(2 * np.pi * r * f * x) * np.exp(-x * d) for r, a, d in partials), attack=0.001)


def saw(note, seconds, harmonics=14):
    x = t(seconds)
    f = hz(note)
    return sum(np.sin(2 * np.pi * k * f * x) / k for k in range(1, harmonics + 1) if k * f < 12000)


def lead(note, seconds):
    x = t(seconds)
    vibrato = 1 + 0.004 * np.sin(2 * np.pi * 5.5 * x) * np.minimum(1, x * 4)
    f = hz(note)
    out = sum(np.sin(2 * np.pi * k * f * np.cumsum(vibrato) / SR) / k for k in range(1, 9) if k * f < 9000)
    return fade(lowpass(out, 3200) * np.minimum(1, x / 0.02), release=0.06)


def pad(notes, seconds, bright=1500, attack=0.4):
    x = t(seconds)
    out = sum(saw(note + detune, seconds, 10) for note in notes for detune in (-0.08, 0.07))
    envelope = np.minimum(1, x / attack) * np.minimum(1, (seconds - x) / 0.5)
    return lowpass(out, bright) * envelope


def strings(notes, seconds):
    return pad(notes, seconds, bright=2600, attack=0.18)


def sub(note, seconds):
    x = t(seconds)
    f = hz(note)
    return fade((np.sin(2 * np.pi * f * x) + 0.25 * np.sin(4 * np.pi * f * x)) * np.exp(-x * 1.6), release=0.04)


def saw_bass(note, seconds):
    x = t(seconds)
    return fade(lowpass(saw(note, seconds, 8), 700) * np.exp(-x * 3), release=0.03)


def kick(punch=1.0):
    x = t(0.3)
    return np.sin(2 * np.pi * np.cumsum(46 + 120 * punch * np.exp(-x * 36)) / SR) * np.exp(-x * 11)


def snare(rng):
    x = t(0.22)
    return (highpass(rng.standard_normal(len(x)), 1400) * np.exp(-x * 22) * 0.7
            + np.sin(2 * np.pi * 190 * x) * np.exp(-x * 28) * 0.5)


def hat(rng, length=0.05):
    x = t(length)
    return highpass(rng.standard_normal(len(x)), 7000) * np.exp(-x * (3.2 / length))


def rim():
    x = t(0.06)
    return (np.sin(2 * np.pi * 820 * x) + 0.5 * np.sin(2 * np.pi * 1730 * x)) * np.exp(-x * 80)


def shaker(rng):
    x = t(0.09)
    return highpass(rng.standard_normal(len(x)), 5000) * np.sin(np.pi * x / 0.09) ** 2


# ---- composition ----

class Track:
    def __init__(self, seconds):
        self.mix = np.zeros(int(SR * seconds) + SR)

    def add(self, clip, at, gain=1.0):
        start = int(at * SR)
        if start < 0 or start >= len(self.mix):
            return
        end = min(len(self.mix), start + len(clip))
        self.mix[start:end] += clip[: end - start] * gain


def chord(root, scale, degree, sevenths=False):
    tones = [root + 12 * ((degree + step) // 7) + scale[(degree + step) % 7] for step in ((0, 2, 4, 6) if sevenths else (0, 2, 4))]
    return tones


def melody(rng, root, scale, degrees, density):
    """One melodic line: a two-bar motif stated, varied, answered and restated."""
    def bar(degree, previous):
        steps = sorted(rng.choice(16, size=density, replace=False))
        notes, position = [], previous
        for step in steps:
            if step % 4 == 0:  # strong beats land on chord tones
                position = degree + int(rng.choice([0, 2, 4, 7]))
            else:
                position += int(rng.choice([-2, -1, 1, 2], p=[0.15, 0.35, 0.35, 0.15]))
            position = int(np.clip(position, -2, 11))
            notes.append((step, root + 12 + 12 * (position // 7) + scale[position % 7]))
        return notes, position

    motif, last = [], 4
    for degree in degrees[:2]:
        notes, last = bar(degree, last)
        motif.append(notes)
    answer = []
    for degree in degrees[2:4]:
        notes, last = bar(degree, last)
        answer.append(notes)
    varied = [[(step, note + (int(rng.choice([0, 0, 2, -1])) if i == len(bar_notes) - 1 else 0))
               for i, (step, note) in enumerate(bar_notes)] for bar_notes in motif]
    return motif + answer + varied + answer


STYLES = {
    # comp: how chords are played; swing: delay of off-beat sixteenths, in sixteenths.
    "lofi": {"bpm": 78, "swing": 0.28, "sevenths": True, "reverb": 0.2, "density": 3},
    "ambient": {"bpm": 66, "swing": 0, "sevenths": True, "reverb": 0.42, "density": 2},
    "synthwave": {"bpm": 104, "swing": 0, "sevenths": False, "reverb": 0.24, "density": 4},
    "house": {"bpm": 122, "swing": 0.1, "sevenths": True, "reverb": 0.16, "density": 3},
    "acoustic": {"bpm": 96, "swing": 0.12, "sevenths": False, "reverb": 0.18, "density": 4},
    "kalimba": {"bpm": 110, "swing": 0.18, "sevenths": False, "reverb": 0.26, "density": 5},
    "cinematic": {"bpm": 84, "swing": 0, "sevenths": False, "reverb": 0.36, "density": 2},
}


def compose(name, style, bpm=None, root=57, scale="minor", seconds=20, seed=1, out=OUT):
    if style not in STYLES:
        raise ValueError(f"unknown music style {style!r}; choose from {sorted(STYLES)}")
    spec = STYLES[style]
    bpm = bpm or spec["bpm"]
    rng = np.random.default_rng(seed)
    notes = SCALES[scale]
    degrees = PROGRESSIONS[scale][int(rng.integers(len(PROGRESSIONS[scale])))]
    sixteenth = 60 / bpm / 4
    bar = sixteenth * 16
    bars = int(np.ceil(seconds / bar)) + 1
    line = melody(rng, root, notes, degrees, spec["density"])
    drums, music = Track(seconds), Track(seconds)

    def when(index, step):
        return index * bar + (step + (spec["swing"] if step % 2 else 0)) * sixteenth

    for index in range(bars):
        degree = degrees[index % 4]
        tones = chord(root, notes, degree, spec["sevenths"])
        low = tones[0] - 12
        tune = line[index % len(line)]
        fill = index % 4 == 3

        if style == "lofi":
            for step in (0, 6, 10):
                for tone in tones:
                    music.add(epiano(tone, bar * 0.6), when(index, step) + rng.uniform(0, 0.012), 0.11)
            for step, gain in ((0, 0.5), (7, 0.3), (10, 0.4)):
                music.add(sub(low, sixteenth * 5), when(index, step), gain)
            for step in (0, 10):
                drums.add(kick(0.7), when(index, step), 0.75)
            for step in (4, 12):
                drums.add(snare(rng), when(index, step), 0.32)
            for step in range(0, 16, 2):
                drums.add(hat(rng), when(index, step), 0.1 if step % 4 else 0.06)
            for step, tone in tune:
                music.add(epiano(tone + 12, sixteenth * 5), when(index, step), 0.13)
        elif style == "ambient":
            music.add(pad(tones, bar + 0.6, bright=1100, attack=0.9), index * bar, 0.07)
            music.add(sub(low, bar), index * bar, 0.22)
            for step, tone in tune:
                music.add(bell(tone + 12, bar * 0.9), when(index, step), 0.1)
            if index % 2 == 0:
                drums.add(shaker(rng), when(index, 8), 0.05)
        elif style == "synthwave":
            music.add(pad(tones, bar + 0.2, bright=2200, attack=0.05), index * bar, 0.05)
            for step in range(0, 16, 2):
                music.add(saw_bass(low + (12 if step % 4 == 2 else 0), sixteenth * 1.8), when(index, step), 0.34)
            for step in range(16):  # arpeggio
                music.add(pluck(tones[step % len(tones)] + 12, sixteenth * 2), when(index, step), 0.07)
            for step in (0, 4, 8, 12):
                drums.add(kick(), when(index, step), 0.8)
            for step in (4, 12):
                drums.add(snare(rng), when(index, step), 0.42)
            for step in range(2, 16, 4):
                drums.add(hat(rng, 0.08), when(index, step), 0.12)
            for step, tone in tune:
                music.add(lead(tone + 12, sixteenth * 4), when(index, step), 0.09)
        elif style == "house":
            for step in (0, 4, 8, 12):
                drums.add(kick(), when(index, step), 0.9)
            for step in (2, 6, 10, 14):
                drums.add(hat(rng, 0.09), when(index, step), 0.16)
                music.add(saw_bass(low, sixteenth * 1.6), when(index, step), 0.36)
            for step in (4, 12):
                drums.add(snare(rng), when(index, step), 0.22)
            for step in (3, 6, 11, 14) if not fill else (2, 5, 8, 11, 14):
                for tone in tones:
                    music.add(epiano(tone + 12, sixteenth * 2.2), when(index, step), 0.085)
            for step, tone in tune:
                music.add(bell(tone + 12, sixteenth * 6), when(index, step), 0.05)
        elif style == "acoustic":
            pattern = [0, 2, 1, 2, 0, 2, 1, 2]
            for i, step in enumerate(range(0, 16, 2)):
                music.add(pluck(tones[pattern[i] % len(tones)], sixteenth * 7), when(index, step), 0.2)
            music.add(pluck(low, bar * 0.9), index * bar, 0.3)
            for step in (4, 12):
                drums.add(rim(), when(index, step), 0.14)
            for step in range(0, 16, 2):
                drums.add(shaker(rng), when(index, step), 0.05 if step % 4 else 0.03)
            for step, tone in tune:
                music.add(pluck(tone + 12, sixteenth * 6), when(index, step), 0.16)
        elif style == "kalimba":
            for step, tone in tune:
                music.add(kalimba(tone + 12, sixteenth * 7), when(index, step), 0.2)
            for step in (0, 6, 8, 14):
                music.add(kalimba(tones[(step // 2) % len(tones)], sixteenth * 8), when(index, step), 0.16)
            for step, gain in ((0, 0.5), (8, 0.4), (11, 0.3)):
                music.add(sub(low, sixteenth * 4), when(index, step), gain)
            for step in (0, 7, 10):
                drums.add(kick(0.5), when(index, step), 0.5)
            for step in range(16):
                drums.add(shaker(rng), when(index, step), 0.06 if step % 4 == 2 else 0.03)
            for step in (4, 12):
                drums.add(rim(), when(index, step), 0.16)
        elif style == "cinematic":
            music.add(strings(tones, bar + 0.4), index * bar, 0.06)
            music.add(strings([tone + 12 for tone in tones[:2]], bar + 0.4), index * bar, 0.03)
            music.add(sub(low, bar), index * bar, 0.34)
            for step in (0, 8) if not fill else (0, 6, 8, 12, 14):
                drums.add(lowpass(kick(1.4), 400), when(index, step), 0.75)
            for step in range(0, 16, 2):  # pulsing ostinato
                music.add(pluck(tones[0] + (12 if step % 4 else 0), sixteenth * 2), when(index, step), 0.08)
            for step, tone in tune:
                music.add(bell(tone + 12, bar * 0.7), when(index, step), 0.07)

    length = int(SR * seconds)
    mix = reverb(music.mix[:length], rng, mix=spec["reverb"]) + drums.mix[:length]
    if style == "lofi":  # tape warmth: a little noise and a soft top end
        mix = lowpass(mix, 6500) + lowpass(rng.standard_normal(length), 3000) * 0.004
    mix[: int(SR * 0.02)] *= np.linspace(0, 1, int(SR * 0.02))
    tail = int(SR * 1.4)
    mix[-tail:] *= np.linspace(1, 0, tail)
    mix = np.tanh(mix / (np.max(np.abs(mix)) + 1e-9) * 1.5) * 0.86
    stereo = np.stack([mix, np.roll(mix, int(SR * 0.0004))], axis=1)  # a touch of width
    out.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out / f"{name}.wav"), "wb") as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(SR)
        handle.writeframes((stereo * 32767).astype("<i2").tobytes())
    return out / f"{name}.wav"


if __name__ == "__main__":
    name, style, bpm, root, scale, seconds, seed = sys.argv[1:8]
    print(compose(name, style, int(bpm), int(root), scale, float(seconds), int(seed)))
