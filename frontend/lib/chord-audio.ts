"use client";

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const CHORD_SHAPES: Array<{ suffixes: string[]; intervals: number[] }> = [
  { suffixes: ["maj7"], intervals: [0, 4, 7, 11] },
  { suffixes: ["m7", "min7"], intervals: [0, 3, 7, 10] },
  { suffixes: ["7"], intervals: [0, 4, 7, 10] },
  { suffixes: ["dim7"], intervals: [0, 3, 6, 9] },
  { suffixes: ["dim"], intervals: [0, 3, 6] },
  { suffixes: ["aug"], intervals: [0, 4, 8] },
  { suffixes: ["m", "min"], intervals: [0, 3, 7] },
  { suffixes: [""], intervals: [0, 4, 7] },
];

function midiToFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function normalizeChordSymbol(chord: string) {
  return chord.trim().replace(/\s+/g, "");
}

function parseChordSymbol(chord: string) {
  const normalized = normalizeChordSymbol(chord);
  const match = normalized.match(/^([A-G](?:#|b)?)(.*)$/);

  if (!match) {
    return null;
  }

  const [, root, rawSuffix] = match;
  const rootSemitone = NOTE_TO_SEMITONE[root];

  if (rootSemitone === undefined) {
    return null;
  }

  const suffix = rawSuffix.toLowerCase();
  const shape = CHORD_SHAPES.find(({ suffixes }) => suffixes.includes(suffix));

  if (!shape) {
    return null;
  }

  return {
    rootSemitone,
    intervals: shape.intervals,
  };
}

export function isPlayableChordSymbol(chord: string) {
  return parseChordSymbol(chord) !== null;
}

export function getChordFrequencies(chord: string) {
  const parsed = parseChordSymbol(chord);

  if (!parsed) {
    return [];
  }

  const bassMidi = 48 + parsed.rootSemitone;
  const chordBaseMidi = 60 + parsed.rootSemitone;

  return [
    midiToFrequency(bassMidi),
    ...parsed.intervals.map((interval) => midiToFrequency(chordBaseMidi + interval)),
  ];
}

