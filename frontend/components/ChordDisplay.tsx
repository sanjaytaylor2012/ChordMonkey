"use client";

import React from "react";
import GuitarDiagram from "./GuitarDiagram";

const CHORD_NAMES: Record<string, string> = {
  "C": "C Major",
  "D": "D Major",
  "E": "E Major",
  "F": "F Major",
  "G": "G Major",
  "A": "A Major",
  "B": "B Major",
  "Am": "A Minor",
  "Dm": "D Minor",
  "Em": "E Minor",
  "Fm": "F Minor",
  "Gm": "G Minor",
  "Bm": "B Minor",
};

interface ChordDisplayProps {
  chord: string | null;
  label?: string;
}

export default function ChordDisplay({ chord, label = "Detected Chord" }: ChordDisplayProps) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        {label}
      </h2>
      <div className="bg-card border border-border rounded-xl p-6 text-center flex-1 flex flex-col justify-center">
        {chord ? (
          <>
            <div className="text-5xl font-bold text-foreground mb-2">
              {chord}
            </div>
            <div className="text-sm text-muted-foreground mb-6">
              {CHORD_NAMES[chord] || chord}
            </div>
            <div className="flex justify-center">
              <GuitarDiagram chord={chord} />
            </div>
          </>
        ) : (
          <div className="text-muted-foreground py-12">
            Record or upload audio to detect chords
          </div>
        )}
      </div>
    </div>
  );
}