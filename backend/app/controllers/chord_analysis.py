from __future__ import annotations

from typing import List, Dict, Any
from music21 import converter, chord, roman


MIN_DURATION = 0.25  # ignore tiny events (quarterLength threshold)


def analyze_midi_chords(midi_path: str) -> Dict[str, Any]:
    score = converter.parse(midi_path)

    detected_key = score.analyze("key")
    key_str = f"{detected_key.tonic.name} {detected_key.mode}"

    chordified = score.chordify()

    raw_events: List[Dict[str, Any]] = []

    for elem in chordified.recurse():
        if not isinstance(elem, chord.Chord):
            continue

        # Remove tiny events
        if elem.quarterLength < MIN_DURATION:
            continue

        # Convert to pitch classes (ignore octave)
        pitch_classes = sorted(set(p.name for p in elem.pitches))

        # Ignore single pitch or pure octave
        if len(pitch_classes) < 2:
            continue

        # Create normalized chord object
        try:
            normalized = chord.Chord(pitch_classes)
            chord_name = normalized.commonName
        except Exception:
            continue

        # Roman numeral
        rn = None
        try:
            rn = roman.romanNumeralFromChord(normalized, detected_key).figure
        except Exception:
            pass

        raw_events.append({
            "offset": float(elem.offset),
            "duration": float(elem.quarterLength),
            "pitch_classes": pitch_classes,
            "chord_name": chord_name,
            "roman": rn,
        })

    # Sort by offset (important!)
    raw_events.sort(key=lambda e: e["offset"])

    # Merge consecutive identical chords
    merged_events: List[Dict[str, Any]] = []

    for event in raw_events:
        if not merged_events:
            merged_events.append(event)
            continue

        last = merged_events[-1]

        if event["chord_name"] == last["chord_name"]:
            # Extend duration
            last["duration"] += event["duration"]
        else:
            merged_events.append(event)

    return {
        "key": key_str,
        "events": merged_events,
    }
