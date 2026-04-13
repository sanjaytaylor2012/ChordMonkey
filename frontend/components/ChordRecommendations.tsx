"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useChordPlayback } from "@/components/chord-progression/useChordPlayback";
import { isPlayableChordSymbol } from "@/lib/chord-audio";
import type { RecommendationLevel } from "@/lib/create-page-types";
import { url } from "@/lib/utils";

const RECOMMENDATIONS_URL = `${url}/recommendations`;

interface ApiRec {
  chord: string;
  reason: string;
  roman: string;
  function: string;
  highlight?: string;
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
  level: RecommendationLevel;
  onRefreshRecommendations?: () => void;
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

function chordToPitchClasses(chordText: string): number[] {
  const match = chordText.trim().match(/^([A-G][#b]?)(.*)$/);
  if (!match) return [];

  const [, root, suffix] = match;
  const rootPc = NOTE_TO_PC[root];
  if (rootPc === undefined) return [];

  const normalizedSuffix = suffix.toLowerCase();
  let intervals = [0, 4, 7];
  const hasDominantSeventh =
    normalizedSuffix === "7" || normalizedSuffix.startsWith("7/");

  if (normalizedSuffix.startsWith("dim")) {
    intervals = [0, 3, 6];
  } else if (normalizedSuffix.startsWith("aug")) {
    intervals = [0, 4, 8];
  } else if (normalizedSuffix.startsWith("m")) {
    intervals = [0, 3, 7];
  }

  if (hasDominantSeventh) {
    intervals = [...intervals, 10];
  }

  return intervals.map((interval) => (rootPc + interval) % 12);
}

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

  return intervals.map((interval) => noteNames[(tonicPc + interval) % 12]);
}

export default function ChordRecommendations({
  currentChord,
  selectedChord,
  lastAddedChord,
  progression,
  level,
  onRefreshRecommendations,
  onSelectChord,
  onAddChord,
}: ChordRecommendationsProps) {
  const [data, setData] = useState<ApiResp | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>(AUTO_KEY);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const previousAutoKeyRef = useRef<string | null>(null);
  const { playChordPreview } = useChordPlayback();
  const maxRecommendations = level === "advanced" ? 5 : 4;
  const progressionSignature = progression.join("|");
  const requestProgression = useMemo(
    () => (progressionSignature ? progressionSignature.split("|") : []),
    [progressionSignature],
  );
  const canFetchRecommendations =
    requestProgression.length > 0 || Boolean(currentChord);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      try {
        const forcedKey = selectedKey === AUTO_KEY ? null : selectedKey;
        const payload = {
          progression: requestProgression,
          current_chord: requestProgression.length === 0 ? currentChord : null,
          max_recs: maxRecommendations,
          level,
          forced_key: forcedKey,
          previous_key:
            selectedKey === AUTO_KEY ? previousAutoKeyRef.current : null,
        };
        const resp = await fetch(RECOMMENDATIONS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify(payload),
        });
        if (!resp.ok) return;

        const apiData: ApiResp = await resp.json();
        setData(apiData);
        if (selectedKey === AUTO_KEY && apiData.key_guess) {
          previousAutoKeyRef.current = apiData.key_guess;
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }

    if (canFetchRecommendations) {
      run();
    } else {
      previousAutoKeyRef.current = null;
    }

    return () => controller.abort();
  }, [
    requestProgression,
    currentChord,
    selectedKey,
    level,
    maxRecommendations,
    refreshNonce,
    canFetchRecommendations,
  ]);

  const detectedKey = data?.key_guess ?? "Unknown";
  const activeKey = selectedKey === AUTO_KEY ? detectedKey : selectedKey;
  const activeScale = keyToScale(activeKey);
  const activeScalePitchClasses = new Set(
    (activeScale ?? [])
      .map((note) => NOTE_TO_PC[note])
      .filter((pc): pc is number => pc !== undefined),
  );
  const recommendations = data?.recommendations ?? [];

  return (
    <div className="flex flex-col">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Suggested Next Chords
      </h2>
      <div
        data-tutorial="recommendations-panel"
        className="rounded-xl border border-border bg-card p-6"
      >
        <div className="mb-4 rounded-lg border border-border bg-background p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              Active Key:{" "}
              <span className="font-semibold text-foreground">{activeKey}</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onRefreshRecommendations?.();
                  setRefreshNonce((value) => value + 1);
                }}
                disabled={!canFetchRecommendations}
                className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                  canFetchRecommendations
                    ? "border-border bg-muted text-foreground hover:bg-muted/80"
                    : "cursor-not-allowed border-border bg-muted text-muted-foreground"
                }`}
              >
                Refresh recommendations
              </button>
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="rounded-md border border-border bg-muted px-2 py-1 text-sm"
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
        <p className="mb-4 text-sm text-muted-foreground">
          {level === "advanced"
            ? "Advanced mode includes stronger tension and more colorful harmonic moves."
            : "Beginner mode keeps suggestions inside basic diatonic harmony."}
        </p>
        <div className="flex flex-col gap-3">
          {recommendations.map((rec) => {
            const isSelected = selectedChord === rec.chord;
            const isLastAdded = lastAddedChord === rec.chord;
            const chordPitchClasses = chordToPitchClasses(rec.chord);
            const isNonDiatonic =
              level === "advanced" &&
              activeScalePitchClasses.size > 0 &&
              chordPitchClasses.some((pc) => !activeScalePitchClasses.has(pc));
            const isResolutionHighlight = rec.highlight === "resolution";

            return (
              <div
                key={rec.chord}
                onClick={() => onSelectChord(rec.chord)}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors ${
                  isResolutionHighlight
                    ? "border-blue-500 bg-blue-500/10"
                    : isNonDiatonic
                    ? "border-yellow-400 bg-yellow-500/5"
                    : "border-border bg-background"
                } ${isSelected ? "bg-primary/10" : "hover:bg-muted"}`}
                title={
                  isResolutionHighlight
                    ? "Resolution of the previous dominant 7th"
                    : isNonDiatonic
                    ? "Non-diatonic recommendation"
                    : undefined
                }
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
