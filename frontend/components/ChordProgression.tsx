"use client";

import React, { useEffect, useState } from "react";
import { SectionBlock } from "@/components/chord-progression/SectionBlock";
import { useChordPlayback } from "@/components/chord-progression/useChordPlayback";
import { Button } from "@/components/ui/button";

export interface SongSection {
  id: string;
  title: string;
  chords: string[];
}

interface ChordProgressionProps {
  sections: SongSection[];
  currentSectionIndex: number | null;
  currentChordIndex: number | null;
  onClear: () => void;
  onSelectChord: (
    sectionIndex: number,
    chordIndex: number,
    chord: string,
  ) => void;
  onAddChord: (sectionIndex: number, chord: string) => void;
  onRemoveChord: (sectionIndex: number, chordIndex: number) => void;
  onAddSection: () => void;
  onRenameSection: (sectionIndex: number, title: string) => void;
}

const CHORD_ROOTS = [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];
const CHORD_QUALITIES = [
  { label: "Major", suffix: "" },
  { label: "Minor", suffix: "m" },
  { label: "Dim", suffix: "dim" },
];

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
    </svg>
  );
}

function SectionEditor({
  value,
  onCommit,
}: {
  value: string;
  onCommit: (value: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit(nextValue: string) {
    const normalized = nextValue.trim() || value;
    onCommit(normalized);
    setDraft(normalized);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit(draft);
          }
          if (e.key === "Escape") {
            setDraft(value);
            setIsEditing(false);
          }
        }}
        autoFocus
        className="text-base font-normal text-muted-foreground bg-transparent border-b border-primary outline-none px-1"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-2 text-base font-normal text-muted-foreground cursor-pointer hover:text-primary transition-colors group"
      title="Click to edit"
    >
      {value}
      <PencilIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </button>
  );
}

export default function ChordProgression({
  sections,
  currentSectionIndex,
  currentChordIndex,
  onClear,
  onSelectChord,
  onAddChord,
  onRemoveChord,
  onAddSection,
  onRenameSection,
}: ChordProgressionProps) {
  const [songTitle, setSongTitle] = useState("Untitled Song");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [openAddMenuSection, setOpenAddMenuSection] = useState<number | null>(
    null,
  );
  const {
    hasPlayableChords,
    isPlaying,
    playbackCursor,
    playChordPreview,
    playProgression,
    stopPlayback,
  } = useChordPlayback(sections);

  function handleTitleBlur() {
    setIsEditingTitle(false);
    if (songTitle.trim() === "") {
      setSongTitle("Untitled Song");
    }
  }

  function handleTitleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setIsEditingTitle(false);
      if (songTitle.trim() === "") {
        setSongTitle("Untitled Song");
      }
    }
    if (e.key === "Escape") {
      setIsEditingTitle(false);
    }
  }

  function handleClearClick() {
    stopPlayback();
    onClear();
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Your Chord Progression
      </h2>
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
          {isEditingTitle ? (
            <input
              type="text"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              className="text-base font-semibold text-foreground bg-transparent border-b border-primary outline-none px-1 w-full sm:w-auto"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-2 text-base font-semibold text-foreground cursor-pointer hover:text-primary transition-colors group"
              title="Click to edit"
            >
              {songTitle}
              <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
                Edit
              </span>
            </button>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={isPlaying ? stopPlayback : playProgression}
              disabled={!hasPlayableChords}
            >
              {isPlaying ? "Stop" : "Play"}
            </Button>
            <button
              onClick={handleClearClick}
              className="px-4 py-2 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
            >
              Clear
            </button>
            <button className="px-4 py-2 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors">
              Export
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {sections.map((section, sectionIndex) => (
            <SectionBlock
              key={section.id}
              section={section}
              sectionIndex={sectionIndex}
              currentSectionIndex={currentSectionIndex}
              currentChordIndex={currentChordIndex}
              playingSectionIndex={playbackCursor.sectionIndex}
              playingChordIndex={playbackCursor.chordIndex}
              openAddMenuSection={openAddMenuSection}
              setOpenAddMenuSection={setOpenAddMenuSection}
              onAddChord={onAddChord}
              onRemoveChord={onRemoveChord}
              onRenameSection={onRenameSection}
              onPlayChord={playChordPreview}
            />
          ))}

          <button
            type="button"
            onClick={onAddSection}
            className="w-fit text-base font-normal text-muted-foreground hover:text-primary transition-colors"
          >
            + Add new section
          </button>
        </div>
      </div>
    </div>
  );
}