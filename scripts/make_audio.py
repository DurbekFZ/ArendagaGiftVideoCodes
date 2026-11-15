"""Synthesize original (licence-free) music beds and sound effects.

Usage: python3 scripts/make_audio.py
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


def bed(name, bpm, chords, seconds, energy):
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
                place(track, kick(), when, 0.9 if step % 4 == 0 else 0.75 * energy)
                place(track, bass(root, beat * 0.9), when, 0.34)
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


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    # A minor / F / C / G flavours, voiced as MIDI notes.
    bed("bed_cinematic.wav", 92, [[57, 60, 64, 67], [53, 57, 60, 64], [48, 55, 60, 64], [55, 59, 62, 67]], 16, 0.55)
    bed("bed_bright.wav", 108, [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 65], [55, 59, 62, 66]], 22, 0.75)
    bed("bed_drive.wav", 124, [[57, 60, 64, 69], [57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67]], 18, 1.0)
    whoosh()
    impact()
    pop()
    riser()
    print("audio ready:", sorted(p.name for p in OUT.glob("*.wav")))
