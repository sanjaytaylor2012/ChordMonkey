"use client";

import React, { useEffect, useState } from "react";

interface ApiRec {
  chord: string;
  reason: string;
  roman: string;
  function: string;
}

interface ApiResp {
  key_guess: string;
  confidence: number;
  recommendations: ApiRec[];
}

interface ChordRecommendationsProps {
  currentChord: string | null;
  selectedChord: string | null;
  lastAddedChord: string | null;
  progression: string[];
  onSelectChord: (chord: string) => void;
  onAddChord: (chord: string) => void;
}

export default function ChordRecommendations({
  currentChord,
  selectedChord,
  lastAddedChord,
  progression,
  onSelectChord,
  onAddChord,
}: ChordRecommendationsProps) {
  const [data, setData] = useState<ApiResp | null>(null);

  useEffect(() => {
    async function run() {
      try {
        const resp = await fetch("http://localhost:8000/recommendations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            progression,
            current_chord: currentChord,
            max_recs: 6,
          }),
        });
        if (!resp.ok) return;
        setData(await resp.json());
      } catch {
        // ignore for now
      }
    }

    // Only fetch when we have something meaningful
    if ((progression?.length ?? 0) > 0 || currentChord) run();
  }, [progression, currentChord]);

  const recommendations = data?.recommendations ?? [];

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