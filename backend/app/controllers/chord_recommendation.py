from __future__ import annotations

import random
import re
from typing import Any, Dict, List, Optional, Tuple

from music21 import chord, harmony, key as m21key, roman


def _display_note_name(name: str) -> str:
    return name.replace("-", "b")


_ROOT_NOTE_RE = re.compile(r"^([A-Ga-g])([#b-]?)(.*)$")
_BEGINNER_TARGET_RECOMMENDATIONS = 4
_ADVANCED_TARGET_RECOMMENDATIONS = 5
_BEGINNER = "beginner"
_ADVANCED = "advanced"


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
        sym2 = sym.replace("maj", "").replace("min", "m")
        try:
            return harmony.ChordSymbol(sym2)
        except Exception:
            return None


def _symbol_from_chord_obj(c: chord.Chord) -> str:
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
    f = figure.replace("o", "°")
    if "V/" in f or f.startswith("V") or f.startswith("vii"):
        return "Dominant"
    if f.startswith("ii") or f.startswith("IV") or f.startswith("iv"):
        return "Predominant"
    if f.startswith("I") or f.startswith("i") or f.startswith("vi") or f.startswith("iii"):
        return "Tonic"
    return "Other"


def _weighted_shuffle(items: List[tuple[str, str, float]]) -> List[tuple[str, str, float]]:
    return sorted(
        items,
        key=lambda item: random.random() ** (1.0 / max(item[2], 0.001)),
        reverse=True,
    )


def _default_recommendation_pool(k: m21key.Key) -> List[tuple[str, str, float]]:
    if k.mode == "minor":
        return [
            ("i", "Re-centers the progression on the tonic", 1.1),
            ("III", "Brightens the color without leaving the key", 0.7),
            ("iv", "Moves gently into predominant motion", 1.0),
            ("V", "Creates a strong pull back to the tonic", 1.1),
            ("VI", "Adds a fuller minor-key lift", 0.9),
            ("VII", "Keeps the line moving forward", 0.75),
            ("vii°", "Introduces sharper dominant tension", 0.45),
            ("V/III", "Adds borrowed dominant color", 0.35),
            ("V/V", "Leans into a brighter dominant setup", 0.3),
        ]

    return [
        ("I", "Reaffirms the home key", 1.0),
        ("ii", "Smoothly opens up the harmony", 0.95),
        ("iii", "Keeps motion inside the key with a lighter color", 0.55),
        ("IV", "Opens the progression with a stable lift", 1.0),
        ("V", "Builds tension that wants to resolve", 1.1),
        ("vi", "Extends the tonic feel with a softer turn", 0.9),
        ("vii°", "Adds leading-tone tension", 0.45),
        ("V/ii", "Adds a touch of secondary dominant color", 0.3),
        ("V/vi", "Hints at a brief tonicization of vi", 0.35),
        ("V/V", "Pushes forward toward the dominant", 0.4),
    ]


def _transition_recommendation_pool(
    k: m21key.Key, func: str
) -> List[tuple[str, str, float]]:
    if k.mode == "minor":
        if func == "Tonic":
            return [
                ("iv", "Moves away from the tonic into predominant space", 1.15),
                ("VI", "Adds a broad minor-key lift", 0.95),
                ("VII", "Keeps forward motion without over-resolving", 0.85),
                ("V", "Builds a direct return path to i", 1.0),
                ("ii°", "Adds tighter predominant tension", 0.55),
                ("V/III", "Adds a brighter secondary push", 0.35),
            ]
        if func == "Predominant":
            return [
                ("V", "Classic predominant-to-dominant motion", 1.2),
                ("vii°", "Tightens the pull into resolution", 0.8),
                ("i", "Resolves the setup directly", 0.95),
                ("III", "Turns the phrase toward a brighter landing", 0.65),
                ("V/V", "Intensifies the dominant preparation", 0.35),
            ]
        if func == "Dominant":
            return [
                ("i", "Resolves the dominant cleanly", 1.2),
                ("VI", "Uses a deceptive-style release", 0.95),
                ("III", "Lets the phrase land more openly", 0.75),
                ("iv", "Softens the cadence and keeps motion alive", 0.55),
                ("VII", "Delays the full resolution", 0.45),
            ]
        return _default_recommendation_pool(k)

    if func == "Tonic":
        return [
            ("IV", "Moves out of tonic space with a stable lift", 1.15),
            ("ii", "Sets up a smooth predominant move", 1.05),
            ("V", "Builds tension quickly", 1.0),
            ("vi", "Extends the phrase without a hard cadence", 0.9),
            ("iii", "Keeps the progression light and internal", 0.55),
            ("V/ii", "Adds a small burst of secondary dominant color", 0.35),
        ]
    if func == "Predominant":
        return [
            ("V", "Classic predominant-to-dominant motion", 1.25),
            ("vii°", "Sharpens the pull toward resolution", 0.8),
            ("I", "Resolves the phrase directly", 0.95),
            ("vi", "Uses a softer deceptive release", 0.85),
            ("V/V", "Intensifies the dominant arrival", 0.45),
        ]
    if func == "Dominant":
        return [
            ("I", "Resolves the dominant strongly", 1.25),
            ("vi", "Creates a deceptive resolution", 0.95),
            ("iii", "Lets the phrase continue instead of fully landing", 0.6),
            ("IV", "Softens the cadence into a plagal color", 0.55),
            ("ii", "Cycles back into predominant motion", 0.45),
        ]
    return _default_recommendation_pool(k)


def _build_recommendation_pool(
    k: m21key.Key, last_function: Optional[str]
) -> List[tuple[str, str, float]]:
    pool = _transition_recommendation_pool(k, last_function) if last_function else []
    fallback = _default_recommendation_pool(k)
    seen_figures = {figure for figure, _, _ in pool}
    pool.extend(item for item in fallback if item[0] not in seen_figures)
    return pool


def _beginner_recommendation_pool(
    k: m21key.Key, last_function: Optional[str]
) -> List[tuple[str, str, float]]:
    if k.mode == "minor":
        if last_function == "Tonic":
            return [
                ("iv", "Moves gently away from tonic while staying in key", 1.15),
                ("VI", "Adds a familiar lift inside the minor scale", 1.0),
                ("VII", "Keeps the phrase moving simply", 0.95),
                ("v", "Builds a soft diatonic dominant pull", 1.05),
                ("III", "Adds a stable related-color chord", 0.8),
                ("ii°", "Adds light diatonic tension", 0.45),
            ]
        if last_function == "Predominant":
            return [
                ("v", "Continues the phrase toward a simple cadence", 1.2),
                ("i", "Resolves directly back home", 1.0),
                ("VI", "Creates a gentle release", 0.9),
                ("III", "Lets the phrase land in a related major chord", 0.75),
                ("VII", "Keeps the phrase open and moving", 0.7),
                ("ii°", "Adds a bit more diatonic tension", 0.4),
            ]
        if last_function == "Dominant":
            return [
                ("i", "Resolves clearly to tonic", 1.25),
                ("VI", "Offers a softer deceptive move", 0.95),
                ("III", "Lands in a stable related chord", 0.8),
                ("iv", "Keeps the phrase going after the cadence", 0.65),
                ("VII", "Delays the full resolution slightly", 0.55),
            ]
        return [
            ("i", "Re-centers the progression on tonic", 1.1),
            ("III", "Brightens the progression without leaving key", 0.85),
            ("iv", "Adds basic predominant motion", 1.0),
            ("v", "Creates gentle tension before resolving", 1.05),
            ("VI", "Adds a familiar minor-key lift", 0.95),
            ("VII", "Keeps things moving with simple diatonic color", 0.8),
            ("ii°", "Adds mild diatonic tension", 0.4),
        ]

    if last_function == "Tonic":
        return [
            ("IV", "Moves out of tonic space in a familiar way", 1.15),
            ("ii", "Sets up a clean diatonic transition", 1.05),
            ("V", "Builds straightforward tension", 1.0),
            ("vi", "Keeps the progression soft and stable", 0.95),
            ("iii", "Adds a lighter in-key color", 0.7),
            ("vii°", "Introduces gentle leading-tone tension", 0.4),
        ]
    if last_function == "Predominant":
        return [
            ("V", "Classic move into dominant", 1.25),
            ("I", "Resolves the phrase directly", 1.0),
            ("vi", "Creates a softer release", 0.9),
            ("ii", "Extends the predominant feeling", 0.8),
            ("iii", "Keeps the progression moving inside the key", 0.65),
            ("vii°", "Adds a touch of diatonic tension", 0.35),
        ]
    if last_function == "Dominant":
        return [
            ("I", "Resolves strongly back to tonic", 1.25),
            ("vi", "Uses a simple deceptive move", 0.95),
            ("IV", "Keeps the phrase open without extra color", 0.8),
            ("iii", "Lets the line continue instead of fully settling", 0.65),
            ("ii", "Cycles back into a simple setup chord", 0.55),
        ]
    return [
        ("I", "Reaffirms the home key", 1.0),
        ("ii", "Smoothly opens up the harmony", 0.95),
        ("iii", "Keeps things inside the key", 0.7),
        ("IV", "Opens the progression with a stable lift", 1.0),
        ("V", "Builds tension that wants to resolve", 1.1),
        ("vi", "Extends the tonic feel with a softer turn", 0.9),
        ("vii°", "Adds light leading-tone tension", 0.35),
    ]


def _parse_forced_key(key_text: Optional[str]) -> Optional[m21key.Key]:
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


_CANDIDATE_KEYS: List[m21key.Key] = [
    m21key.Key(p, "major") for p in ["C", "C#", "D", "E-", "E", "F", "F#", "G", "A-", "A", "B-", "B"]
] + [
    m21key.Key(p, "minor") for p in ["C", "C#", "D", "E-", "E", "F", "F#", "G", "A-", "A", "B-", "B"]
]


def _quality_bucket(cs: harmony.ChordSymbol) -> str:
    kind = (cs.chordKind or "").lower()
    if "diminished" in kind:
        return "dim"
    if "minor" in kind:
        return "min"
    if "augmented" in kind:
        return "aug"
    return "maj"


def _key_scale_pcs(k: m21key.Key) -> set[int]:
    tonic = k.tonic.pitchClass
    offsets = [0, 2, 4, 5, 7, 9, 11] if k.mode == "major" else [0, 2, 3, 5, 7, 8, 10]
    return {(tonic + o) % 12 for o in offsets}


def _allowed_diatonic_triads(k: m21key.Key) -> set[tuple[int, str]]:
    tonic = k.tonic.pitchClass
    triads: set[tuple[int, str]] = set()

    if k.mode == "major":
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
        triads.update(
            {
                ((tonic + 0) % 12, "min"),
                ((tonic + 2) % 12, "dim"),
                ((tonic + 3) % 12, "maj"),
                ((tonic + 5) % 12, "min"),
                ((tonic + 7) % 12, "min"),
                ((tonic + 8) % 12, "maj"),
                ((tonic + 10) % 12, "maj"),
                ((tonic + 7) % 12, "maj"),
                ((tonic + 11) % 12, "dim"),
            }
        )

    return triads


def _infer_key_scores(symbols: List[str]) -> List[Tuple[m21key.Key, float]]:
    chords = [cs for s in symbols if (cs := _safe_chordsymbol(s))]
    if not chords:
        return [(m21key.Key("C", "major"), 0.0)]

    parsed: List[tuple[Optional[int], str, set[int]]] = []
    for cs in chords:
        try:
            root = cs.root()
            root_pc = root.pitchClass if root is not None else None
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

        for root_pc, quality, pcs in parsed:
            if root_pc is not None and (root_pc, quality) in allowed_triads:
                score += 8.0
            elif root_pc is not None and root_pc in scale_pcs:
                score += 1.5
            else:
                score -= 6.0

            if pcs:
                in_scale = len(pcs.intersection(scale_pcs))
                out_of_scale = len(pcs) - in_scale
                score += in_scale * 0.5
                score -= out_of_scale * 2.5

        roots = [root_pc for root_pc, _, _ in parsed]
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

    scores.sort(key=lambda item: item[1], reverse=True)
    return scores


def infer_key_from_progression(symbols: List[str]) -> Tuple[str, float]:
    scores = _infer_key_scores(symbols)
    best_key, best = scores[0]
    second = scores[1][1] if len(scores) > 1 else (best - 1.0)
    margin = best - second
    conf = max(0.0, min(1.0, 0.5 + 0.03 * margin))
    return (_format_key_name(best_key), conf)


def recommend_next_chords(
    progression: List[str],
    current_chord: Optional[str] = None,
    max_recs: int = _ADVANCED_TARGET_RECOMMENDATIONS,
    level: str = _BEGINNER,
    forced_key: Optional[str] = None,
    previous_key: Optional[str] = None,
) -> Dict[str, Any]:
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
            {"key": _format_key_name(candidate), "score": round(score, 3)}
            for candidate, score in scores[:8]
        ]
        best_key, best_score = scores[0]
        key_guess = _format_key_name(best_key)
        second_score = scores[1][1] if len(scores) > 1 else (best_score - 1.0)
        confidence = max(0.0, min(1.0, 0.5 + 0.03 * (best_score - second_score)))

        previous = _parse_forced_key(previous_key)
        if previous:
            prev_name = _format_key_name(previous)
            score_by_name = {_format_key_name(candidate): score for candidate, score in scores}
            prev_score = score_by_name.get(prev_name)
            if prev_score is not None and (best_score - prev_score) < 8.0:
                key_guess = prev_name
                confidence = max(confidence, 0.55)

        for item in debug_key_scores:
            if item["key"] == key_guess:
                item["selected"] = True

        tonic, mode = key_guess.split()
        k = m21key.Key(tonic, mode)

    last_sym = working[-1] if working else None
    last_cs = _safe_chordsymbol(last_sym) if last_sym else None
    last_function: Optional[str] = None
    if last_cs:
        try:
            last_rn = roman.romanNumeralFromChord(last_cs, k).figure
            last_function = _function_from_roman(last_rn)
        except Exception:
            pass

    recs: List[Dict[str, str]] = []
    seen_chords: set[str] = set()
    recommendation_level = level if level in {_BEGINNER, _ADVANCED} else _BEGINNER
    recommendation_cap = (
        _ADVANCED_TARGET_RECOMMENDATIONS
        if recommendation_level == _ADVANCED
        else _BEGINNER_TARGET_RECOMMENDATIONS
    )
    recommendation_limit = max(1, min(max_recs, recommendation_cap))

    def add_rec(figure: str, reason: str) -> Optional[Dict[str, str]]:
        try:
            rn_obj = roman.RomanNumeral(figure, k)
            symbol = _symbol_from_chord_obj(chord.Chord(rn_obj.pitches))
            return {
                "chord": symbol,
                "roman": figure,
                "function": _function_from_roman(figure),
                "reason": reason,
            }
        except Exception:
            return None

    if recommendation_level == _ADVANCED:
        recommendation_pool = _build_recommendation_pool(k, last_function)
    else:
        recommendation_pool = _beginner_recommendation_pool(k, last_function)

    for figure, reason, _weight in _weighted_shuffle(recommendation_pool):
        rec = add_rec(figure, reason)
        if not rec or rec["chord"] in seen_chords:
            continue
        seen_chords.add(rec["chord"])
        recs.append(rec)
        if len(recs) >= recommendation_limit:
            break

    if len(recs) < recommendation_limit:
        fallback_pool = (
            _default_recommendation_pool(k)
            if recommendation_level == _ADVANCED
            else _beginner_recommendation_pool(k, None)
        )
        for figure, reason, _weight in fallback_pool:
            rec = add_rec(figure, reason)
            if not rec or rec["chord"] in seen_chords:
                continue
            seen_chords.add(rec["chord"])
            recs.append(rec)
            if len(recs) >= recommendation_limit:
                break

    return {
        "engine_version": f"keyfit-v4-{recommendation_level}",
        "key_guess": key_guess,
        "confidence": confidence,
        "recommendations": recs,
        "debug_progression_used": working,
        "debug_key_scores": debug_key_scores,
    }
