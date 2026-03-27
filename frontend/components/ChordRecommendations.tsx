"use client";

import React, { useEffect, useRef, useState } from "react";
import { useChordPlayback } from "@/components/chord-progression/useChordPlayback";
import { isPlayableChordSymbol } from "@/lib/chord-audio";
import { url } from "@/lib/utils";


const RECOMMENDATIONS_URL = `${url}/recommendations`

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

const KEY_OPTIONS = [
  "C major",
  "C# major",
  "D major",
  "Eb major",
  "E major",
  "F major",
  "F# major",
  "G major",
  "Ab major",
  "A major",
  "Bb major",
  "B major",
  "C minor",
  "C# minor",
  "D minor",
  "Eb minor",
  "E minor",
  "F minor",
  "F# minor",
  "G minor",
  "Ab minor",
  "A minor",
  "Bb minor",
  "B minor",
];

const AUTO_KEY = "__auto__";
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
const SHARP_NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];
const FLAT_NOTES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

function keyToScale(keyText: string): string[] | null {
  const [tonic, mode] = keyText.split(" ");
  const tonicPc = NOTE_TO_PC[tonic];
  if (tonicPc === undefined) return null;

  const major = mode?.toLowerCase() === "major";
  const minor = mode?.toLowerCase() === "minor";
  if (!major && !minor) return null;

  const intervals = major ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
  const useFlats =
    tonic.includes("b") || ["F", "Bb", "Eb", "Ab", "Db", "Gb"].includes(tonic);
  const noteNames = useFlats ? FLAT_NOTES : SHARP_NOTES;

  return intervals.map((i) => noteNames[(tonicPc + i) % 12]);
}

function romanToChordSymbol(
  romanFigure: string,
  keyText: string,
): string | null {
  const scale = keyToScale(keyText);
  if (!scale) return null;

  const degreeMap: Record<string, number> = {
    i: 0,
    ii: 1,
    iii: 2,
    iv: 3,
    v: 4,
    vi: 5,
    vii: 6,
  };
  const core = romanFigure
    .replace("°", "")
    .replace("o", "")
    .replace(/[0-9]/g, "");
  const degree = degreeMap[core.toLowerCase()];
  if (degree === undefined) return null;

  const root = scale[degree];
  const isDiminished = romanFigure.includes("°") || romanFigure.includes("o");
  const isMinor = core === core.toLowerCase();

  if (isDiminished) return `${root}dim`;
  if (isMinor) return `${root}m`;
  return root;
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
  const [selectedKey, setSelectedKey] = useState<string>(AUTO_KEY);
  const previousAutoKeyRef = useRef<string | null>(null);
  const { playChordPreview } = useChordPlayback();

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      try {
        const forcedKey = selectedKey === AUTO_KEY ? null : selectedKey;
        const payload = {
          progression,
          current_chord: progression.length === 0 ? currentChord : null,
          max_recs: 4,
          forced_key: forcedKey,
          previous_key:
            selectedKey === AUTO_KEY ? previousAutoKeyRef.current : null,
        };
        console.log("[ChordRecommendations] request payload", payload);
        const resp = await fetch(
            RECOMMENDATIONS_URL,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify(payload),
          },
        );
        if (!resp.ok) return;
        const apiData: ApiResp = await resp.json();
        console.log("[ChordRecommendations] response payload", apiData);
        setData(apiData);
        if (selectedKey === AUTO_KEY && apiData.key_guess) {
          previousAutoKeyRef.current = apiData.key_guess;
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        // ignore for now
      }
    }

    // Only fetch when we have something meaningful
    if ((progression?.length ?? 0) > 0 || currentChord) run();
    else previousAutoKeyRef.current = null;
    return () => controller.abort();
  }, [progression, currentChord, selectedKey]);

  const detectedKey = data?.key_guess ?? "Unknown";
  const activeKey = selectedKey === AUTO_KEY ? detectedKey : selectedKey;
  const recommendations = (data?.recommendations ?? []).map((rec) => {
    if (selectedKey === AUTO_KEY) return rec;
    const transformed = romanToChordSymbol(rec.roman, selectedKey);
    if (!transformed) return rec;
    return {
      ...rec,
      chord: transformed,
      reason: `Diatonic choice in ${selectedKey}`,
    };
  });

  return (
    <div className="flex flex-col">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Suggested Next Chords
      </h2>
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="mb-4 p-3 rounded-lg border border-border bg-background">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm text-muted-foreground">
              Active Key:{" "}
              <span className="text-foreground font-semibold">{activeKey}</span>
            </span>
            <div className="flex items-center gap-2">
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="text-sm bg-muted border border-border rounded-md px-2 py-1"
              >
                <option value={AUTO_KEY}>Auto Detect</option>
                {KEY_OPTIONS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void playChordPreview(rec.chord);
                    }}
                    disabled={!isPlayableChordSymbol(rec.chord)}
                    className="h-8 rounded-md border border-border px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Play
                  </button>
                  <button
                    type="button"
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
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
