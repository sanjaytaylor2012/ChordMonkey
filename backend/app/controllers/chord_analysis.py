from __future__ import annotations

from typing import Any, Dict, List
from music21 import converter, chord, roman, pitch, key as m21key

MIN_DURATION = 0.25  # quarterLength; filters micro-events


def _display_note_name(name: str) -> str:
    return name.replace("-", "b")


def _normalize_pitch_name_for_key(name: str, detected_key: m21key.Key) -> str:
    if detected_key.sharps < 0:
        return {
            "C#": "D-",
            "D#": "E-",
            "F#": "G-",
            "G#": "A-",
            "A#": "B-",
        }.get(name, name)

    if detected_key.sharps > 0:
        return {
            "D-": "C#",
            "E-": "D#",
            "G-": "F#",
            "A-": "G#",
            "B-": "A#",
        }.get(name, name)

    return name


def _quality_suffix(c: chord.Chord, roman_figure: str | None = None) -> str:
    root = c.root()
    if root is not None:
        intervals = {(p.pitchClass - root.pitchClass) % 12 for p in c.pitches}

        if {0, 3, 7}.issubset(intervals):
            return "m"
        if {0, 4, 7}.issubset(intervals):
            return ""
        if {0, 3, 6}.issubset(intervals):
            return "dim"
        if {0, 4, 8}.issubset(intervals):
            return "aug"

    chord_name = (c.commonName or "").lower()
    if "minor" in chord_name:
        return "m"
    if "diminished" in chord_name:
        return "dim"
    if "augmented" in chord_name:
        return "aug"

    if roman_figure:
        core = roman_figure.replace("°", "o").split("/")[0]
        if "o" in core or "vii" in core.lower():
            return "dim"
        if any(ch.islower() for ch in core if ch.isalpha()):
            return "m"

    qual = c.quality
    if qual == "minor":
        return "m"
    if qual == "major":
        return ""
    if qual == "diminished":
        return "dim"
    if qual == "augmented":
        return "aug"
    return ""


def analyze_midi_chords(midi_path: str) -> Dict[str, Any]:
    score = converter.parse(midi_path)

    detected_key = score.analyze("key")
    key_str = f"{_display_note_name(detected_key.tonic.name)} {detected_key.mode}"

    chordified = score.chordify()

    raw: List[Dict[str, Any]] = []

    for elem in chordified.recurse():
        if not isinstance(elem, chord.Chord):
            continue

        if float(elem.quarterLength) < MIN_DURATION:
            continue

        pitch_classes = sorted(
            {
                _normalize_pitch_name_for_key(p.name, detected_key)
                for p in elem.pitches
            }
        )
        if len(pitch_classes) < 2:
            continue

        normalized = chord.Chord(pitch_classes)

        rn = None
        try:
            rn = roman.romanNumeralFromChord(normalized, detected_key).figure
        except Exception:
            rn = None

        symbol = chord_symbol_from_normalized_chord(normalized, rn)

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

def chord_symbol_from_normalized_chord(
    c: chord.Chord,
    roman_figure: str | None = None,
) -> str:
    root = _display_note_name(c.root().name)
    suffix = _quality_suffix(c, roman_figure)
    return f"{root}{suffix}"
