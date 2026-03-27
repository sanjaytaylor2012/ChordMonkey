"use client";

import React, { useState } from "react";
import { SectionBlock } from "@/components/chord-progression/SectionBlock";
import { useChordPlayback } from "@/components/chord-progression/useChordPlayback";
import { Button } from "@/components/ui/button";
import type { ChordProgressionProps } from "@/components/chord-progression/types";

export type { SongSection } from "@/components/chord-progression/types";

export default function ChordProgression({
  sections,
  currentSectionIndex,
  currentChordIndex,
  onClear,
  onAddChord,
  onRemoveChord,
  onAddSection,
  onRenameSection,
}: ChordProgressionProps) {
  const [songTitle, setSongTitle] = useState("Untitled Song");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [openAddMenuSection, setOpenAddMenuSection] = useState<number | null>(null);
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
        <div className="flex items-center justify-between mb-5">
          {isEditingTitle ? (
            <input
              type="text"
              value={songTitle}
              onChange={(e) => setSongTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              autoFocus
              className="text-base font-semibold text-foreground bg-transparent border-b border-primary outline-none px-1"
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
