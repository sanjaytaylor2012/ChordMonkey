"use client";

import React from "react";

const NOTE_TO_PC: Record<string, number> = {
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

const WHITE_KEYS = [
  { label: "C", pc: 0 },
  { label: "D", pc: 2 },
  { label: "E", pc: 4 },
  { label: "F", pc: 5 },
  { label: "G", pc: 7 },
  { label: "A", pc: 9 },
  { label: "B", pc: 11 },
] as const;

const BLACK_KEYS = [
  { label: "C#", pc: 1, left: "15.5%" },
  { label: "D#", pc: 3, left: "29.5%" },
  { label: "F#", pc: 6, left: "57.0%" },
  { label: "G#", pc: 8, left: "70.5%" },
  { label: "A#", pc: 10, left: "83.8%" },
] as const;

function chordToPitchClasses(chord: string): number[] {
  const match = chord.trim().match(/^([A-G][#b]?)(.*)$/);
  if (!match) return [];

  const [, root, suffix] = match;
  const rootPc = NOTE_TO_PC[root];
  if (rootPc === undefined) return [];

  const normalizedSuffix = suffix.toLowerCase();
  let intervals = [0, 4, 7];

  if (normalizedSuffix.startsWith("dim")) {
    intervals = [0, 3, 6];
  } else if (normalizedSuffix.startsWith("aug")) {
    intervals = [0, 4, 8];
  } else if (normalizedSuffix.startsWith("m")) {
    intervals = [0, 3, 7];
  }

  return intervals.map((interval) => (rootPc + interval) % 12);
}

interface KeyboardDiagramProps {
  chord: string;
}

export default function KeyboardDiagram({ chord }: KeyboardDiagramProps) {
  const activePitchClasses = new Set(chordToPitchClasses(chord));

  return (
    <div className="w-full max-w-[420px]">
      <div className="relative mx-auto h-44 w-full overflow-hidden rounded-xl border border-border bg-zinc-300/40 p-3">
        <div className="grid h-full grid-cols-7 gap-1">
          {WHITE_KEYS.map((key) => {
            const isActive = activePitchClasses.has(key.pc);

            return (
              <div
                key={key.label}
                className={`flex h-full flex-col items-center justify-end rounded-b-xl border px-1 pb-3 text-xs font-semibold shadow-sm transition-colors ${
                  isActive
                    ? "border-emerald-600 bg-emerald-500/25 text-emerald-900"
                    : "border-zinc-300 bg-zinc-50 text-zinc-500"
                }`}
              >
                <span>{key.label}</span>
              </div>
            );
          })}
        </div>

        {BLACK_KEYS.map((key) => {
          const isActive = activePitchClasses.has(key.pc);

          return (
            <div
              key={key.label}
              className={`absolute top-3 z-10 flex h-[58%] w-[11%] -translate-x-1/2 flex-col items-center justify-end rounded-b-lg border px-1 pb-2 text-[10px] font-semibold shadow-md transition-colors ${
                isActive
                  ? "border-emerald-500 bg-emerald-600 text-white"
                  : "border-zinc-900 bg-zinc-900 text-zinc-100"
              }`}
              style={{ left: key.left }}
            >
              <span>{key.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
