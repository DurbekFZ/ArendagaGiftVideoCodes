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


def ticks():
    """A counter running down: soft wooden ticks that start fast and slow to a stop (about 2.6 s)."""
    track = np.zeros(int(SR * 2.7))
    at, gap = 0.0, 0.028
    while at < 2.45:
        x = t(0.03)
        body = np.sin(2 * np.pi * 1750 * x) * 0.6 + np.sin(2 * np.pi * 2900 * x) * 0.25
        place(track, (body + rng.standard_normal(len(x)) * 0.25) * np.exp(-x * 260), at, 0.45 + 0.4 * (at / 2.45))
        at += gap
        gap *= 1.075
    save("ticks.wav", track)


def bowl():
    """A struck singing bowl: a warm low tone with slowly beating partials (for a rare reveal, about 3 s)."""
    x = t(3.2)
    base = hz(55)
    out = sum(a * np.sin(2 * np.pi * base * r * x + 0.4 * np.sin(2 * np.pi * beat * x)) * np.exp(-x * d)
              for r, a, d, beat in ((1.0, 1.0, 1.1, 1.3), (2.71, 0.55, 1.8, 2.1), (5.15, 0.25, 3.2, 3.4), (8.2, 0.1, 5.0, 0.7)))
    strike = rng.standard_normal(len(x)) * np.exp(-x * 90) * 0.15
    save("bowl.wav", (out + strike) * np.minimum(1, x / 0.002))


def rain():
    """Steady cold rain on a window: soft broadband hiss with scattered droplet ticks (about 3.6 s)."""
    x = t(3.6)
    hiss = lowpass(rng.standard_normal(len(x)), 3800) * 0.35
    track = hiss * np.minimum(1, x / 0.08)
    for at in rng.uniform(0, 3.5, 160):
        d = t(0.02)
        place(track, np.sin(2 * np.pi * rng.uniform(2500, 5200) * d) * np.exp(-d * 300), at, rng.uniform(0.08, 0.3))
    save("rain.wav", track)


def cork():
    """A cork popping out of a bottle: a hollow low thump with a quick upward squeak and a fizz tail (about 1.2 s)."""
    x = t(1.2)
    freq = 240 + 520 * np.exp(-x * 60)
    thump = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-x * 28)
    snap = rng.standard_normal(len(x)) * np.exp(-x * 220) * 0.6
    fizz = lowpass(rng.standard_normal(len(x)), 9000) * np.exp(-((x - 0.25) ** 2) / 0.08) * 0.22
    fizz -= lowpass(fizz, 2500)
    save("cork.wav", thump + snap + fizz)


def splash():
    """Something dropped into a pool: a filtered noise splash with a few bubbling after-drops (about 1.3 s)."""
    x = t(1.3)
    noise = rng.standard_normal(len(x))
    body = lowpass(noise, 1200 + 5000 * np.exp(-x * 6)) * (np.minimum(1, x / 0.012) * np.exp(-x * 4.2))
    track = body
    for i, at in enumerate((0.32, 0.45, 0.61, 0.8)):
        d = t(0.08)
        f = 600 + 900 * d / 0.08 + i * 140
        place(track, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * d / 0.08), at, 0.18)
    save("splash.wav", track)


def scribble():
    """A felt pen writing one short word: papery strokes of filtered noise, each a quick swell (about 0.7 s)."""
    x = t(0.7)
    noise = rng.standard_normal(len(x))
    paper = lowpass(noise, 5200) - lowpass(noise, 900)
    strokes = np.zeros(len(x))
    at = 0.0
    while at < 0.62:
        length = rng.uniform(0.05, 0.11)
        seg = (x >= at) & (x < at + length)
        strokes[seg] = np.sin(np.pi * (x[seg] - at) / length) * rng.uniform(0.6, 1.0)
        at += length + rng.uniform(0.0, 0.025)
    save("scribble.wav", paper * strokes)


def checkmark():
    """A pen ticking a box: a short down-stroke and a longer up-stroke on paper (about 0.3 s)."""
    x = t(0.32)
    noise = rng.standard_normal(len(x))
    paper = lowpass(noise, 6500) - lowpass(noise, 1400)
    env = np.exp(-((x - 0.05) ** 2) / 0.0006) * 0.7 + np.exp(-((x - 0.17) ** 2) / 0.0035)
    save("checkmark.wav", paper * env)


def jingle():
    """Sleigh bells shaken twice: clusters of tiny inharmonic bell pings with a short shimmer (about 1.4 s)."""
    track = np.zeros(int(SR * 1.4))
    for shake, gain in ((0.0, 1.0), (0.42, 0.8)):
        for _ in range(26):
            d = t(0.5)
            f = rng.uniform(3800, 8200)
            ping = (np.sin(2 * np.pi * f * d) + 0.4 * np.sin(2 * np.pi * f * 1.52 * d)) * np.exp(-d * rng.uniform(12, 30))
            place(track, ping, shake + rng.uniform(0, 0.12), gain * rng.uniform(0.2, 0.6))
    save("jingle.wav", track)


def keys():
    """Typing into a search field: thirteen soft plastic key taps at a human, uneven pace (about 1.1 s)."""
    track = np.zeros(int(SR * 1.15))
    at = 0.0
    for _ in range(13):
        d = t(0.05)
        noise = rng.standard_normal(len(d))
        click = (lowpass(noise, 4200) - lowpass(noise, 700)) * np.exp(-d * 120)
        thock = np.sin(2 * np.pi * rng.uniform(260, 340) * d) * np.exp(-d * 90) * 0.5
        place(track, click + thock, at, rng.uniform(0.5, 0.9))
        at += rng.uniform(0.06, 0.1)
    save("keys.wav", track)


def coin():
    """A gold coin set down on glass: a bright ring with two beating partials and a soft low tap (about 1.2 s)."""
    x = t(1.2)
    ring = sum(gain * np.sin(2 * np.pi * f * x) * np.exp(-x * decay)
               for f, gain, decay in ((2093, 0.5, 4.5), (2113, 0.4, 4.8), (3520, 0.25, 7), (5270, 0.12, 11)))
    tap = np.sin(2 * np.pi * 180 * x) * np.exp(-x * 40) * 0.5
    save("coin.wav", (ring + tap) * np.minimum(1, x / 0.001))


def pageturn():
    """A glossy magazine page turned by hand: a soft airy swish that swells and settles, with a muted paper flap (about 0.6 s)."""
    x = t(0.62)
    noise = rng.standard_normal(len(x))
    swell = np.sin(np.pi * np.clip(x / 0.5, 0, 1)) ** 1.5
    sweep = 900 + 2600 * np.sin(np.pi * np.clip(x / 0.5, 0, 1))
    air = lowpass(noise, sweep) - lowpass(noise, 300)
    flap = np.zeros(len(x))
    d = t(0.09)
    place(flap, lowpass(rng.standard_normal(len(d)), 1800) * np.exp(-d * 45), 0.42, 1.0)
    save("pageturn.wav", air * swell * 0.8 + flap * 0.5)


def hatch():
    """A heavy bunker hatch unlatching: a deep muffled clunk, then a soft sigh of air that fades (about 1.4 s)."""
    x = t(1.4)
    freq = 52 + 40 * np.exp(-x * 18)
    clunk = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-x * 7)
    knock = lowpass(rng.standard_normal(len(x)), 700) * np.exp(-x * 30) * 0.6
    metal = sum(g * np.sin(2 * np.pi * f * x) for f, g in ((231, 0.12), (377, 0.07), (512, 0.04))) * np.exp(-x * 9)
    noise = rng.standard_normal(len(x))
    sigh = (lowpass(noise, 2200) - lowpass(noise, 500)) * np.clip((x - 0.12) / 0.15, 0, 1) * np.exp(-np.clip(x - 0.27, 0, None) * 2.6)
    save("hatch.wav", (clunk + knock + metal + sigh * 0.35) * np.minimum(1, x / 0.002))


def stamp():
    """A rubber stamp pressed onto a metal tag: a short padded thud with a little body (about 0.25 s)."""
    x = t(0.25)
    freq = 90 + 60 * np.exp(-x * 40)
    body = np.sin(2 * np.pi * np.cumsum(freq) / SR) * np.exp(-x * 22)
    pad_ = lowpass(rng.standard_normal(len(x)), 900) * np.exp(-x * 45) * 0.5
    save("stamp.wav", (body + pad_) * np.minimum(1, x / 0.002))

def bite():
    """A bite into a frozen ice-cream bar: a short, muffled crisp crunch with a soft low body (about 0.22 s)."""
    x = t(0.22)
    noise = rng.standard_normal(len(x))
    grit = (lowpass(noise, 3800) - lowpass(noise, 900)) * (0.6 + 0.4 * (rng.random(len(x)) > 0.55))
    env = np.minimum(1, x / 0.004) * np.exp(-x * 24)
    body = np.sin(2 * np.pi * np.cumsum(140 + 60 * np.exp(-x * 50)) / SR) * np.exp(-x * 30) * 0.35
    save("bite.wav", grit * env * 0.7 + body)


def frost():
    """Frost spreading over glass: an airy, high, filtered-noise swell that settles (no bells, about 1.2 s)."""
    x = t(1.2)
    noise = rng.standard_normal(len(x))
    sweep = 2500 + 4500 * np.clip(x / 0.6, 0, 1)
    air = lowpass(noise, sweep) - lowpass(noise, 1800)
    env = np.sin(np.pi * np.clip(x / 1.2, 0, 1)) ** 2
    save("frost.wav", air * env * 0.6)


def foil():
    """A foil snack packet torn open: a soft crinkle that builds and bursts into a muffled puff of air (about 0.6 s)."""
    track = np.zeros(int(SR * 0.65))
    at = 0.0
    while at < 0.34:
        x = t(0.02)
        noise = rng.standard_normal(len(x))
        crinkle = lowpass(noise, 5200) - lowpass(noise, 2200)
        place(track, crinkle * np.exp(-x * 220), at, 0.25 + 0.75 * (at / 0.34) ** 2)
        at += 0.008 + rng.uniform(0, 0.018)
    x = t(0.32)
    noise = rng.standard_normal(len(x))
    puff = lowpass(noise, 700 + 900 * np.exp(-x * 9)) * np.minimum(1, x / 0.01) * np.exp(-x * 9)
    place(track, puff, 0.32, 0.9)
    save("foil.wav", lowpass(track, 6500))


def thunk():
    """Something soft dropping into a vending-machine tray: a padded low thud with a short plastic knock (about 0.3 s)."""
    x = t(0.3)
    body = np.sin(2 * np.pi * np.cumsum(70 + 90 * np.exp(-x * 40)) / SR) * np.exp(-x * 16)
    noise = rng.standard_normal(len(x))
    knock = (lowpass(noise, 1600) - lowpass(noise, 500)) * np.exp(-x * 60) * 0.4
    save("thunk.wav", (body + knock) * np.minimum(1, x / 0.003))


def ignite():
    """A burner catching fire: a soft rounded whoomp of air with a brief warm crackle that fades (about 1.3 s)."""
    x = t(1.3)
    noise = rng.standard_normal(len(x))
    swell = np.minimum(1, x / 0.06) * np.exp(-x * 3.2)
    whoomp = lowpass(noise, 260 + 900 * np.exp(-x * 6)) * swell
    body = np.sin(2 * np.pi * np.cumsum(55 + 45 * np.exp(-x * 9)) / SR) * np.minimum(1, x / 0.03) * np.exp(-x * 5) * 0.5
    crackle = np.zeros(len(x))
    for _ in range(18):
        at = int(SR * rng.uniform(0.08, 0.9))
        n = int(SR * 0.006)
        if at + n < len(x):
            crackle[at:at + n] += rng.standard_normal(n) * np.exp(-np.arange(n) / (SR * 0.0015)) * rng.uniform(0.1, 0.3)
    crackle = lowpass(crackle, 3200) * np.exp(-x * 2.5)
    save("ignite.wav", whoomp * 0.9 + body + crackle)


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
    ticks()
    bowl()
    rain()
    cork()
    splash()
    scribble()
    checkmark()
    jingle()
    keys()
    coin()
    pageturn()
    hatch()
    stamp()
    bite()
    frost()
    foil()
    thunk()
    ignite()


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
    if not (OUT / "bowl.wav").exists():
        ticks()
        bowl()
    if not (OUT / "splash.wav").exists():
        rain()
        cork()
        splash()
    if not (OUT / "jingle.wav").exists():
        scribble()
        checkmark()
        jingle()
    if not (OUT / "coin.wav").exists():
        keys()
        coin()
    if not (OUT / "pageturn.wav").exists():
        pageturn()
    if not (OUT / "hatch.wav").exists():
        hatch()
        stamp()
    if not (OUT / "frost.wav").exists():
        bite()
        frost()
    if not (OUT / "thunk.wav").exists():
        foil()
        thunk()
    if not (OUT / "ignite.wav").exists():
        ignite()


if __name__ == "__main__":
    build()
    print("audio ready:", sorted(p.name for p in OUT.glob("*.wav")))
