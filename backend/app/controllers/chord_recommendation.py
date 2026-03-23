from __future__ import annotations

import re
from typing import Any, Dict, List, Optional, Tuple

from music21 import harmony, key as m21key, roman, chord


# -----------------------------
# Helpers: parsing + formatting
# -----------------------------

def _display_note_name(name: str) -> str:
    return name.replace("-", "b")


_ROOT_NOTE_RE = re.compile(r"^([A-Ga-g])([#b-]?)(.*)$")


def _normalize_symbol_for_music21(sym: str) -> str:
    """
    Convert flat spellings like Bb, Ebm7, or F/Bb to music21's hyphen style.
    """
    if not sym:
        return sym

    text = sym.strip().replace("♭", "b").replace("♯", "#")
    parts = text.split("/", 1)
    normalized_parts: List[str] = []

    for part in parts:
        match = _ROOT_NOTE_RE.match(part)
        if not match:
            normalized_parts.append(part)
            continue

        note, accidental, rest = match.groups()
        if accidental == "b":
            accidental = "-"
        normalized_parts.append(f"{note.upper()}{accidental}{rest}")

    return "/".join(normalized_parts)


def _format_key_name(k: m21key.Key) -> str:
    return f"{_display_note_name(k.tonic.name)} {k.mode}"


def _safe_chordsymbol(sym: str) -> Optional[harmony.ChordSymbol]:
    """
    Parse symbols like: C, Am, F#, Bb, G7, Dm7, Bdim, etc.
    Returns None if parsing fails.
    """
    sym = (sym or "").strip()
    if not sym:
        return None
    sym = _normalize_symbol_for_music21(sym)
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
    root = _display_note_name(c.root().name)
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


def _default_roman_pool(k: m21key.Key) -> List[str]:
    if k.mode == "minor":
        # Use actual minor-key harmony, not the parallel major defaults.
        return ["i", "V", "VI", "iv", "VII", "III"]
    return ["I", "V", "vi", "IV", "ii", "iii"]


def _transition_roman_pool(k: m21key.Key, func: str) -> List[str]:
    if k.mode == "minor":
        if func == "Tonic":
            return ["iv", "VI", "VII", "V"]
        if func == "Predominant":
            return ["V", "vii°", "i"]
        if func == "Dominant":
            return ["i", "VI", "III"]
        return _default_roman_pool(k)

    if func == "Tonic":
        return ["IV", "ii", "V", "vi"]
    if func == "Predominant":
        return ["V", "vii°", "I"]
    if func == "Dominant":
        return ["I", "vi"]
    return _default_roman_pool(k)


def _parse_forced_key(key_text: Optional[str]) -> Optional[m21key.Key]:
    """
    Parse manual key choices like:
      - "C major"
      - "A minor"
      - "C" (major implied)
      - "Am" (minor implied)
    """
    if not key_text:
        return None

    text = key_text.strip()
    if not text:
        return None

    parts = text.split()
    if len(parts) == 2 and parts[1].lower() in {"major", "minor"}:
        tonic = parts[0].replace("b", "-")
        mode = parts[1].lower()
        try:
            return m21key.Key(tonic, mode)
        except Exception:
            return None

    tonic = text
    mode = "major"
    if text.lower().endswith("m") and len(text) > 1:
        tonic = text[:-1]
        mode = "minor"

    tonic = tonic.replace("b", "-")
    try:
        return m21key.Key(tonic, mode)
    except Exception:
        return None


# -----------------------------
# Key inference
# -----------------------------

_CANDIDATE_KEYS: List[m21key.Key] = [
    m21key.Key(p, "major") for p in ["C","C#","D","E-","E","F","F#","G","A-","A","B-","B"]
] + [
    m21key.Key(p, "minor") for p in ["C","C#","D","E-","E","F","F#","G","A-","A","B-","B"]
]


def _quality_bucket(cs: harmony.ChordSymbol) -> str:
    kind = (cs.chordKind or "").lower()
    if "diminished" in kind:
        return "dim"
    if "minor" in kind:
        return "min"
    if "augmented" in kind:
        return "aug"
    # Treat dominant/suspended/other non-minor types as major-ish for MVP.
    return "maj"


def _key_scale_pcs(k: m21key.Key) -> set[int]:
    tonic = k.tonic.pitchClass
    if k.mode == "major":
        offsets = [0, 2, 4, 5, 7, 9, 11]
    else:
        # Natural minor baseline.
        offsets = [0, 2, 3, 5, 7, 8, 10]
    return {(tonic + o) % 12 for o in offsets}


def _allowed_diatonic_triads(k: m21key.Key) -> set[tuple[int, str]]:
    tonic = k.tonic.pitchClass
    triads: set[tuple[int, str]] = set()

    if k.mode == "major":
        # I ii iii IV V vi vii°
        triads.update(
            {
                ((tonic + 0) % 12, "maj"),
                ((tonic + 2) % 12, "min"),
                ((tonic + 4) % 12, "min"),
                ((tonic + 5) % 12, "maj"),
                ((tonic + 7) % 12, "maj"),
                ((tonic + 9) % 12, "min"),
                ((tonic + 11) % 12, "dim"),
            }
        )
    else:
        # Natural minor: i ii° III iv v VI VII
        triads.update(
            {
                ((tonic + 0) % 12, "min"),
                ((tonic + 2) % 12, "dim"),
                ((tonic + 3) % 12, "maj"),
                ((tonic + 5) % 12, "min"),
                ((tonic + 7) % 12, "min"),
                ((tonic + 8) % 12, "maj"),
                ((tonic + 10) % 12, "maj"),
            }
        )
        # Harmonic-minor common borrow for functional harmony: V and vii°
        triads.update(
            {
                ((tonic + 7) % 12, "maj"),
                ((tonic + 11) % 12, "dim"),
            }
        )

    return triads


def _infer_key_scores(symbols: List[str]) -> List[Tuple[m21key.Key, float]]:
    """
    Scores all 24 keys against the full progression.
    Primary criterion is diatonic triad fit of each chord across the whole
    progression, not just the latest chord.
    """
    chords = [cs for s in symbols if (cs := _safe_chordsymbol(s))]

    if not chords:
        return [(m21key.Key("C", "major"), 0.0)]

    parsed: List[tuple[Optional[int], str, set[int]]] = []
    for cs in chords:
        try:
            r = cs.root()
            root_pc = r.pitchClass if r is not None else None
        except Exception:
            root_pc = None
        parsed.append((root_pc, _quality_bucket(cs), {p.pitchClass for p in cs.pitches}))

    scores: List[Tuple[m21key.Key, float]] = []
    for k in _CANDIDATE_KEYS:
        score = 0.0
        scale_pcs = _key_scale_pcs(k)
        allowed_triads = _allowed_diatonic_triads(k)
        tonic_pc = k.tonic.pitchClass
        dominant_pc = (tonic_pc + 7) % 12

        # All chords contribute. Exact diatonic triad fit is strongest signal.
        for root_pc, quality, pcs in parsed:
            if root_pc is not None and (root_pc, quality) in allowed_triads:
                score += 8.0
            elif root_pc is not None and root_pc in scale_pcs:
                # Root in scale, but quality mismatch.
                score += 1.5
            else:
                score -= 6.0

            # Extra penalty for out-of-scale chord tones.
            if pcs:
                in_scale = len(pcs.intersection(scale_pcs))
                out_of_scale = len(pcs) - in_scale
                score += in_scale * 0.5
                score -= out_of_scale * 2.5

        # Small positional anchors.
        roots = [r for r, _, _ in parsed]
        if roots:
            first_root = roots[0]
            last_root = roots[-1]
            if first_root == tonic_pc:
                score += 2.0
            if last_root == tonic_pc:
                score += 3.0
            if last_root == dominant_pc:
                score += 1.0
            if len(roots) >= 2 and roots[-2] == dominant_pc and last_root == tonic_pc:
                score += 2.0

        scores.append((k, score))

    scores.sort(key=lambda x: x[1], reverse=True)
    return scores


def infer_key_from_progression(symbols: List[str]) -> Tuple[str, float]:
    scores = _infer_key_scores(symbols)
    best_key, best = scores[0]
    second = scores[1][1] if len(scores) > 1 else (best - 1.0)

    # Confidence from margin between top two candidate keys.
    margin = best - second
    conf = max(0.0, min(1.0, 0.5 + 0.03 * margin))
    return (_format_key_name(best_key), conf)


# -----------------------------
# Recommendation engine (MVP)
# -----------------------------

def recommend_next_chords(
    progression: List[str],
    current_chord: Optional[str] = None,
    max_recs: int = 6,
    forced_key: Optional[str] = None,
    previous_key: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Returns:
      {
        key_guess: "C major",
        confidence: 0.73,
        recommendations: [{chord, reason, roman, function}, ...]
      }
    """
    # Primary context comes from the full progression built in the UI.
    # Fall back to the currently detected chord only when progression is empty.
    working = [p for p in progression if p]
    if not working and current_chord:
        working = [current_chord]

    debug_key_scores: List[Dict[str, Any]] = []

    forced = _parse_forced_key(forced_key)
    if forced:
        k = forced
        key_guess = _format_key_name(k)
        confidence = 1.0
        debug_key_scores = [{"key": key_guess, "score": None, "selected": True}]
    else:
        scores = _infer_key_scores(working)
        debug_key_scores = [
            {"key": _format_key_name(cand), "score": round(score, 3)}
            for cand, score in scores[:8]
        ]
        best_key, best_score = scores[0]
        key_guess = _format_key_name(best_key)
        second_score = scores[1][1] if len(scores) > 1 else (best_score - 1.0)
        confidence = max(0.0, min(1.0, 0.5 + 0.03 * (best_score - second_score)))

        # Stability guard: in auto mode, avoid switching keys unless the new
        # best key clearly beats the previously chosen key.
        previous = _parse_forced_key(previous_key)
        if previous:
            prev_name = _format_key_name(previous)
            score_by_name = {_format_key_name(cand): s for cand, s in scores}
            prev_score = score_by_name.get(prev_name)
            if prev_score is not None:
                switch_margin = 8.0
                if (best_score - prev_score) < switch_margin:
                    key_guess = prev_name
                    confidence = max(confidence, 0.55)
        for item in debug_key_scores:
            if item["key"] == key_guess:
                item["selected"] = True

        tonic, mode = key_guess.split()
        k = m21key.Key(tonic, mode)

    last_sym = working[-1] if working else None
    last_cs = _safe_chordsymbol(last_sym) if last_sym else None

    roman_pool = _default_roman_pool(k)

    # If we can classify the last chord, bias transitions by function
    if last_cs:
        try:
            last_rn = roman.romanNumeralFromChord(last_cs, k).figure
            func = _function_from_roman(last_rn)
            if k.mode == "minor":
                roman_pool = _transition_roman_pool(k, func)
            elif func == "Tonic":
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
        "engine_version": "keyfit-v3-debug",
        "key_guess": key_guess,
        "confidence": confidence,
        "recommendations": uniq,
        "debug_progression_used": working,
        "debug_key_scores": debug_key_scores,
    }
