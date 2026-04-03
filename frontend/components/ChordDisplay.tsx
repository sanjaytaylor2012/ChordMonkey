"use client";

import React from "react";
import GuitarDiagram from "./GuitarDiagram";
import KeyboardDiagram from "./KeyboardDiagram";
import type { DisplayInstrument } from "@/lib/create-page-types";

const CHORD_NAMES: Record<string, string> = {
  C: "C Major",
  D: "D Major",
  E: "E Major",
  F: "F Major",
  G: "G Major",
  A: "A Major",
  B: "B Major",
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
