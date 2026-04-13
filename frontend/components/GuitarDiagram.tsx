"use client";

import React from "react";

// Chord fingering data: [E, A, D, G, B, e] where -1 = muted, 0 = open, 1-5 = fret number
const CHORD_FINGERINGS: Record<string, number[]> = {
  "C": [-1, 3, 2, 0, 1, 0],
  "C7": [-1, 3, 2, 3, 1, 0],
  "C#": [-1, -1, 3, 1, 2, 1],
  "C#7": [-1, 4, 6, 4, 6, 4],
  "D-": [-1, -1, 3, 1, 2, 1],
  "D-7": [-1, 4, 6, 4, 6, 4],
  "D": [-1, -1, 0, 2, 3, 2],
  "D7": [-1, -1, 0, 2, 1, 2],
  "D#": [-1, -1, 1, 3, 4, 3],
  "D#7": [-1, 6, 8, 6, 8, 6],
  "E-": [-1, -1, 1, 3, 4, 3],
  "E-7": [-1, 6, 8, 6, 8, 6],
  "E": [0, 2, 2, 1, 0, 0],
  "E7": [0, 2, 0, 1, 0, 0],
  "F": [1, 3, 3, 2, 1, 1],
  "F7": [1, 3, 1, 2, 1, 1],
  "F#": [2, 4, 4, 3, 2, 2],
  "F#7": [2, 4, 2, 3, 2, 2],
  "G-": [2, 4, 4, 3, 2, 2],
  "G-7": [2, 4, 2, 3, 2, 2],
  "G": [3, 2, 0, 0, 0, 3],
  "G7": [3, 2, 0, 0, 0, 1],
  "G#": [4, 3, -1, -1, 4, 4],
  "G#7": [4, 6, 4, 5, 4, 4],
  "A-": [4, 3, -1, -1, 4, 4],
  "A-7": [4, 6, 4, 5, 4, 4],
  "A": [-1, 0, 2, 2, 2, 0],
  "A7": [-1, 0, 2, 0, 2, 0],
  "A#": [-1, 1, 3, 3, 3, 1],
  "A#7": [-1, 1, 3, 1, 3, 1],
  "B-": [-1, 1, 3, 3, 3, 1],
  "B-7": [-1, 1, 3, 1, 3, 1],
  "B": [-1, 2, 4, 4, 4, 2],
  "B7": [-1, 2, 1, 2, 0, 2],
  "B#": [-1, 3, 2, 0, 1, 0],
  "B#7": [-1, 3, 2, 3, 1, 0],
  "C-": [-1, 2, 4, 4, 4, 2],
  "C-7": [-1, 2, 1, 2, 0, 2],
  "Cm": [-1, 3, 5, 5, 4, 3],
  "C#m": [-1, -1, 2, 1, 2, 0],
  "D-m": [-1, -1, 2, 1, 2, 0],
  "Dm": [-1, -1, 0, 2, 3, 1],
  "D#m": [-1, -1, 1, 3, 4, 2],
  "E-m": [-1, -1, 1, 3, 4, 2],
  "Em": [0, 2, 2, 0, 0, 0],
  "Fm": [1, 3, 3, 1, 1, 1],
  "F#m": [2, 4, 4, 2, 2, 2],
  "G-m": [2, 4, 4, 2, 2, 2],
  "Gm": [3, 5, 5, 3, 3, 3],
  "G#m": [4, 6, 6, 4, 4, 4],
  "A-m": [4, 6, 6, 4, 4, 4],
  "Am": [-1, 0, 2, 2, 1, 0],
  "A#m": [-1 ,1, 3, 3, 2, 1],
  "B-m": [-1 ,1, 3, 3, 2, 1],
  "Bm": [-1, 2, 4, 4, 3, 2],
  "B#m": [-1, 3, 5, 5, 4, 3],
  "C-m": [-1, 2, 4, 4, 3, 2],
};

interface GuitarDiagramProps {
  chord: string;
}

export default function GuitarDiagram({ chord }: GuitarDiagramProps) {
  const normalizedChord = chord.replace("b", "-");
  const fingering =
    CHORD_FINGERINGS[chord] ||
    CHORD_FINGERINGS[normalizedChord] ||
    [0, 0, 0, 0, 0, 0];
  const frettedNotes = fingering.filter((fret) => fret > 0);
  const highestFret = frettedNotes.length > 0 ? Math.max(...frettedNotes) : 4;
  const lowestFret = frettedNotes.length > 0 ? Math.min(...frettedNotes) : 1;
  const startFret = highestFret <= 4 ? 1 : lowestFret;
  const frets = Array.from({ length: 4 }, (_, index) => startFret + index);
  const showNut = startFret === 1;

  return (
    <div className="flex flex-col items-center">
      {/* Open/Muted string indicators */}
      <div className="flex w-[132px] justify-between px-1 mb-1">
        {fingering.map((fret, i) => (
          <span key={i} className="w-5 text-center text-sm text-muted-foreground">
            {fret === -1 ? "×" : fret === 0 ? "○" : ""}
          </span>
        ))}
      </div>

      <div className="mb-1 flex w-[132px] items-center justify-between text-xs text-muted-foreground">
        <span>{showNut ? "Open" : `Fret ${startFret}`}</span>
        {!showNut && <span>Position</span>}
      </div>

      {/* Nut / starting fret */}
      <div
        className={`w-[132px] rounded-sm ${
          showNut ? "h-2 bg-foreground" : "h-[2px] bg-muted-foreground"
        }`}
      />

      {/* Frets */}
      <div className="flex flex-col">
        {frets.map((fretNum) => (
          <div
            key={fretNum}
            className="flex w-[132px] h-9 border-b-2 border-muted-foreground"
          >
            {fingering.map((finger, stringIdx) => (
              <div
                key={stringIdx}
                className="flex-1 border-r border-foreground/70 last:border-r-0 relative flex items-center justify-center"
              >
                {finger === fretNum && (
                  <div className="w-5 h-5 bg-foreground rounded-full" />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
