"use client";

import React, { useState } from "react";

interface ChordProgressionProps {
  chords: string[];
  currentIndex: number | null;
  onClear: () => void;
}

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

export default function ChordProgression({
  chords,
  currentIndex,
  onClear,
}: ChordProgressionProps) {
  const [songTitle, setSongTitle] = useState("Untitled Song");
  const [isEditing, setIsEditing] = useState(false);

  function handleTitleClick() {
    setIsEditing(true);
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSongTitle(e.target.value);
  }

  function handleTitleBlur() {
    setIsEditing(false);
    if (songTitle.trim() === "") {
      setSongTitle("Untitled Song");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setIsEditing(false);
      if (songTitle.trim() === "") {
        setSongTitle("Untitled Song");
      }
    }
    if (e.key === "Escape") {
      setIsEditing(false);
    }
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Your Chord Progression
      </h2>
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-5">
          {isEditing ? (
            <input
              type="text"
              value={songTitle}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              onKeyDown={handleKeyDown}
              autoFocus
              className="text-base font-semibold text-foreground bg-transparent border-b border-primary outline-none px-1"
            />
          ) : (
            <div
              onClick={handleTitleClick}
              className="flex items-center gap-2 text-base font-semibold text-foreground cursor-pointer hover:text-primary transition-colors group"
              title="Click to edit"
            >
              {songTitle}
              <PencilIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClear}
              className="px-4 py-2 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
            >
              Clear
            </button>
            <button className="px-4 py-2 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors">
              Export
            </button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          {chords.length > 0 ? (
            <>
              {chords.map((chord, index) => (
                <div
                  key={index}
                  className={`min-w-[70px] px-5 py-4 rounded-lg border-2 text-center transition-colors ${
                    index === currentIndex
                      ? "border-primary bg-primary/10"
                      : index === chords.length - 1
                      ? "border-green-600 bg-green-600/10"
                      : "border-border bg-background"
                  }`}
                >
                  <div className="text-xl font-bold text-foreground">
                    {chord}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {index + 1}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-muted-foreground py-4">
              No chords added yet. Record audio or select from suggestions.
            </div>
          )}

          {chords.length > 0 && (
            <div className="min-w-[70px] px-5 py-4 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-2xl text-muted-foreground cursor-pointer hover:border-muted-foreground transition-colors">
              +
            </div>
          )}
        </div>
      </div>
    </div>
  );
}