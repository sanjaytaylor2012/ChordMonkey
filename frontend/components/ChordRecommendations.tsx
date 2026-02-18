"use client";

import React from "react";

interface ChordRecommendation {
  chord: string;
  reason: string;
}

const RECOMMENDATIONS: Record<string, ChordRecommendation[]> = {
  "C": [
    { chord: "G", reason: "Common progression (C → G)" },
    { chord: "Am", reason: "Relative minor" },
    { chord: "F", reason: "IV chord in C major" },
    { chord: "Dm", reason: "ii chord in C major" },
  ],
  "G": [
    { chord: "C", reason: "Common progression (G → C)" },
    { chord: "D", reason: "V chord in G major" },
    { chord: "Em", reason: "Relative minor" },
    { chord: "Am", reason: "ii chord in G major" },
  ],
  "Am": [
    { chord: "G", reason: "Common progression (Am → G)" },
    { chord: "F", reason: "Relative major chord" },
    { chord: "Dm", reason: "iv chord in A minor" },
    { chord: "E", reason: "Dominant (V) chord" },
  ],
  "F": [
    { chord: "C", reason: "Common progression (F → C)" },
    { chord: "G", reason: "V chord resolution" },
    { chord: "Am", reason: "iii chord in F major" },
    { chord: "Dm", reason: "Relative minor" },
  ],
  "Dm": [
    { chord: "Am", reason: "Common progression (Dm → Am)" },
    { chord: "G", reason: "IV chord resolution" },
    { chord: "C", reason: "VII chord in D minor" },
    { chord: "F", reason: "Relative major" },
  ],
  "Em": [
    { chord: "Am", reason: "Common progression (Em → Am)" },
    { chord: "D", reason: "VII chord in E minor" },
    { chord: "G", reason: "Relative major" },
    { chord: "C", reason: "VI chord in E minor" },
  ],
};

const DEFAULT_RECOMMENDATIONS: ChordRecommendation[] = [
  { chord: "C", reason: "Popular starting chord" },
  { chord: "G", reason: "Popular starting chord" },
  { chord: "Am", reason: "Popular minor chord" },
  { chord: "F", reason: "Common in pop progressions" },
];

interface ChordRecommendationsProps {
  currentChord: string | null;
  selectedChord: string | null;
  lastAddedChord: string | null;
  onSelectChord: (chord: string) => void;
  onAddChord: (chord: string) => void;
}

export default function ChordRecommendations({
  currentChord,
  selectedChord,
  lastAddedChord,
  onSelectChord,
  onAddChord,
}: ChordRecommendationsProps) {
  const recommendations = currentChord
    ? RECOMMENDATIONS[currentChord] || DEFAULT_RECOMMENDATIONS
    : DEFAULT_RECOMMENDATIONS;

  return (
    <div className="flex flex-col">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Suggested Next Chords
      </h2>
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-sm text-muted-foreground mb-4">
          Based on music theory and your progression
        </p>
        <div className="flex flex-col gap-3">
          {recommendations.map((rec) => {
            const isSelected = selectedChord === rec.chord;
            const isLastAdded = lastAddedChord === rec.chord;

            return (
              <div
                key={rec.chord}
                onClick={() => onSelectChord(rec.chord)}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-primary/10 border-primary"
                    : "bg-background border-border hover:bg-muted"
                }`}
              >
                <div>
                  <div className="text-lg font-semibold text-foreground">
                    {rec.chord}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {rec.reason}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddChord(rec.chord);
                  }}
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-lg font-bold transition-colors ${
                    isLastAdded
                      ? "bg-green-600 text-white"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isLastAdded ? "✓" : "+"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}