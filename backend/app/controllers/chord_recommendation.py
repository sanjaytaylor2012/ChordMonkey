from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple

from music21 import harmony, key as m21key, roman, pitch, chord


# -----------------------------
# Helpers: parsing + formatting
# -----------------------------

def _safe_chordsymbol(sym: str) -> Optional[harmony.ChordSymbol]:
    """
    Parse symbols like: C, Am, F#, Bb, G7, Dm7, Bdim, etc.
    Returns None if parsing fails.
    """
    sym = (sym or "").strip()
    if not sym:
        return None
    try:
        return harmony.ChordSymbol(sym)
    except Exception:
        # Try a couple small normalizations
        sym2 = sym.replace("maj", "").replace("min", "m")
        try:
            return harmony.ChordSymbol(sym2)
        except Exception:
            return None


def _symbol_from_chord_obj(c: chord.Chord) -> str:
    """Simple triad-ish symbol. (Matches your chord_analysis style.)"""
    root = c.root().name
    qual = c.quality
    if qual == "minor":
        return f"{root}m"
    if qual == "major":
        return root
    if qual == "diminished":
        return f"{root}dim"
    if qual == "augmented":
        return f"{root}aug"
    return root


def _function_from_roman(figure: str) -> str:
    """
    Rough functional harmony buckets (MVP).
    """
    f = figure.replace("o", "°")
    # Normalize slash/secondary a bit: "V/V" -> treat as dominant
    if "V/" in f or f.startswith("V") or f.startswith("vii"):
        return "Dominant"
    if f.startswith("ii") or f.startswith("IV") or f.startswith("iv"):
        return "Predominant"
    if f.startswith("I") or f.startswith("i") or f.startswith("vi") or f.startswith("iii"):
        return "Tonic"
    return "Other"


# -----------------------------
# Key inference
# -----------------------------

_CANDIDATE_KEYS: List[m21key.Key] = [
    m21key.Key(p, "major") for p in ["C","C#","D","E-","E","F","F#","G","A-","A","B-","B"]
] + [
    m21key.Key(p, "minor") for p in ["C","C#","D","E-","E","F","F#","G","A-","A","B-","B"]
]


def infer_key_from_progression(symbols: List[str]) -> Tuple[str, float]:
    """
    Scores all 24 keys using:
      - whether romanNumeralFromChord can interpret chord in that key
      - diatonic preference (music21's roman object can tell us a lot)
      - small cadence bonus if last chord is I/i
    Returns (key_string, confidence 0..1).
    """
    chords = [cs for s in symbols if (cs := _safe_chordsymbol(s))]

    if not chords:
        return ("C major", 0.0)

    scores: List[Tuple[m21key.Key, float]] = []
    for k in _CANDIDATE_KEYS:
        score = 0.0
        for cs in chords:
            try:
                rn = roman.romanNumeralFromChord(cs, k)
                score += 2.0
                # Prefer fewer accidentals: rn.figure has accidentals; crude but effective
                acc = rn.figure.count("#") + rn.figure.count("-")
                score += max(0.0, 2.0 - 0.75 * acc)
            except Exception:
                score -= 1.25

        # small cadence bonus
        try:
            last_rn = roman.romanNumeralFromChord(chords[-1], k).figure
            if last_rn.startswith("I") or last_rn.startswith("i"):
                score += 1.5
        except Exception:
            pass

        scores.append((k, score))

    scores.sort(key=lambda x: x[1], reverse=True)
    best_key, best = scores[0]
    second = scores[1][1] if len(scores) > 1 else (best - 1.0)

    # Convert to a simple confidence (sigmoid-like on margin)
    margin = best - second
    conf = max(0.0, min(1.0, 0.5 + 0.15 * margin))

    return (f"{best_key.tonic.name} {best_key.mode}", conf)


# -----------------------------
# Recommendation engine (MVP)
# -----------------------------

def recommend_next_chords(
    progression: List[str],
    current_chord: Optional[str] = None,
    max_recs: int = 6,
) -> Dict[str, Any]:
    """
    Returns:
      {
        key_guess: "C major",
        confidence: 0.73,
        recommendations: [{chord, reason, roman, function}, ...]
      }
    """
    # Use current chord if provided, else last chord in progression
    working = [p for p in progression if p]
    if current_chord:
        working = working + [current_chord]

    key_guess, confidence = infer_key_from_progression(working)
    tonic, mode = key_guess.split()
    k = m21key.Key(tonic, mode)

    last_sym = current_chord or (working[-1] if working else None)
    last_cs = _safe_chordsymbol(last_sym) if last_sym else None

    # Default: diatonic pop-friendly set (I, V, vi, IV, ii, iii)
    roman_pool = ["I", "V", "vi", "IV", "ii", "iii"]

    # If we can classify the last chord, bias transitions by function
    if last_cs:
        try:
            last_rn = roman.romanNumeralFromChord(last_cs, k).figure
            func = _function_from_roman(last_rn)
            if func == "Tonic":
                roman_pool = ["IV", "ii", "V", "vi"]
            elif func == "Predominant":
                roman_pool = ["V", "vii°", "I"]
            elif func == "Dominant":
                roman_pool = ["I", "vi"]
        except Exception:
            pass

    recs: List[Dict[str, str]] = []

    def add_rec(figure: str, reason: str) -> None:
        try:
            rn_obj = roman.RomanNumeral(figure, k)
            sym = _symbol_from_chord_obj(chord.Chord(rn_obj.pitches))
            recs.append(
                {
                    "chord": sym,
                    "roman": figure,
                    "function": _function_from_roman(figure),
                    "reason": reason,
                }
            )
        except Exception:
            return

    # Core diatonic suggestions
    for fig in roman_pool:
        add_rec(fig, f"Diatonic choice in {key_guess}")

    # Add 1–2 “spicier but common” options (dominant 7 and V/vi-style hint)
    # Keep it demo-safe: only add if we can interpret them
    add_rec("V7", "Adds tension that resolves strongly")
    add_rec("V", "Classic dominant resolution")

    # De-dup while preserving order
    seen = set()
    uniq = []
    for r in recs:
        if r["chord"] in seen:
            continue
        seen.add(r["chord"])
        uniq.append(r)
        if len(uniq) >= max_recs:
            break

    return {
        "key_guess": key_guess,
        "confidence": confidence,
        "recommendations": uniq,
    }