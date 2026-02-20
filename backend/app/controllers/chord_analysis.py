from __future__ import annotations

from typing import Any, Dict, List
from music21 import converter, chord, roman, pitch

MIN_DURATION = 0.25  # quarterLength; filters micro-events


def analyze_midi_chords(midi_path: str) -> Dict[str, Any]:
    score = converter.parse(midi_path)

    detected_key = score.analyze("key")
    key_str = f"{detected_key.tonic.name} {detected_key.mode}"

    chordified = score.chordify()

    raw: List[Dict[str, Any]] = []

    for elem in chordified.recurse():
        if not isinstance(elem, chord.Chord):
            continue

        if float(elem.quarterLength) < MIN_DURATION:
            continue

        pitch_classes = sorted(set(p.name for p in elem.pitches))
        if len(pitch_classes) < 2:
            continue

        normalized = chord.Chord(pitch_classes)

        symbol = chord_symbol_from_normalized_chord(normalized)

        rn = None
        try:
            rn = roman.romanNumeralFromChord(normalized, detected_key).figure
        except Exception:
            rn = None

        raw.append(
            {
                "offset": float(elem.offset),
                "duration": float(elem.quarterLength),
                "pitch_classes": pitch_classes,
                "chord_name": normalized.commonName,
                "roman": rn,
                "symbol": symbol,
            }
        )

    raw.sort(key=lambda e: e["offset"])

    # merge consecutive identical chord_name
    merged: List[Dict[str, Any]] = []
    for e in raw:
        if not merged:
            merged.append(e)
            continue
        last = merged[-1]
        if e["chord_name"] == last["chord_name"]:
            last["duration"] += e["duration"]
        else:
            merged.append(e)

    return {"key": key_str, "events": merged}

def chord_symbol_from_normalized_chord(c: chord.Chord) -> str:
    root = c.root().name  # e.g., "G", "C#", "Bb"
    qual = c.quality      # "major", "minor", "diminished", "augmented", etc.

    if qual == "minor":
        return f"{root}m"
    if qual == "major":
        return root
    if qual == "diminished":
        return f"{root}dim"
    if qual == "augmented":
        return f"{root}aug"
    # fallback:
    return root
