"use client";

import React from "react";
import GuitarDiagram from "./GuitarDiagram";
import KeyboardDiagram from "./KeyboardDiagram";
import type { DisplayInstrument } from "@/lib/create-page-types";

const CHORD_NAMES: Record<string, string> = {
  C: "C Major",
  C7: "C Dominant 7",
  "C#7": "C# Dominant 7",
  Db7: "Db Dominant 7",
  D: "D Major",
  D7: "D Dominant 7",
  "D#7": "D# Dominant 7",
  Eb7: "Eb Dominant 7",
  E: "E Major",
  E7: "E Dominant 7",
  F: "F Major",
  F7: "F Dominant 7",
  "F#7": "F# Dominant 7",
  Gb7: "Gb Dominant 7",
  G: "G Major",
  G7: "G Dominant 7",
  "G#7": "G# Dominant 7",
  Ab7: "Ab Dominant 7",
  A: "A Major",
  A7: "A Dominant 7",
  "A#7": "A# Dominant 7",
  Bb7: "Bb Dominant 7",
  B: "B Major",
  B7: "B Dominant 7",
  Am: "A Minor",
  Dm: "D Minor",
  Em: "E Minor",
  Fm: "F Minor",
  Gm: "G Minor",
  Bm: "B Minor",
};

interface ChordDisplayProps {
  chord: string | null;
  label?: string;
  onAddChord?: (chord: string) => void;
  instrument?: DisplayInstrument;
}

export default function ChordDisplay({
  chord,
  label = "Detected Chord",
  onAddChord,
  instrument = "guitar",
}: ChordDisplayProps) {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        {label}
      </h2>
      <div
        data-tutorial="detected-chord"
        className="bg-card border border-border rounded-xl p-6 text-center flex-1 flex flex-col justify-center"
      >
        {chord ? (
          <>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => onAddChord?.(chord)}
                className="w-8 h-8 rounded-md bg-primary text-primary-foreground text-lg font-bold hover:bg-primary/90 transition-colors"
                aria-label={`Add ${chord} to progression`}
                title="Add to progression"
              >
                +
              </button>
            </div>
            <div className="text-5xl font-bold text-foreground mb-2">
              {chord}
            </div>
            <div className="text-sm text-muted-foreground mb-6">
              {CHORD_NAMES[chord] || chord}
            </div>
            <div className="flex justify-center">
              {instrument === "keyboard" ? (
                <KeyboardDiagram chord={chord} />
              ) : (
                <GuitarDiagram chord={chord} />
              )}
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
