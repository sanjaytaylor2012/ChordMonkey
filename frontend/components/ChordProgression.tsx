"use client";

import React, { useEffect, useRef, useState } from "react";

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
  onAddChord: (sectionIndex: number, chord: string) => void;
  onRemoveChord: (sectionIndex: number, chordIndex: number) => void;
  onAddSection: () => void;
  onRenameSection: (sectionIndex: number, title: string) => void;
}

const CHORD_ROOTS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
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
  onAddChord,
  onRemoveChord,
  onAddSection,
  onRenameSection,
}: ChordProgressionProps) {
  const [songTitle, setSongTitle] = useState("Untitled Song");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [openAddMenuSection, setOpenAddMenuSection] = useState<number | null>(null);
  const addMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (openAddMenuSection === null) return;

    function handlePointerDown(event: MouseEvent) {
      if (!addMenuRef.current?.contains(event.target as Node)) {
        setOpenAddMenuSection(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenAddMenuSection(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openAddMenuSection]);

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

  function handleAddChordClick(sectionIndex: number, chord: string) {
    onAddChord(sectionIndex, chord);
    setOpenAddMenuSection(null);
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
            <div
              onClick={() => setIsEditingTitle(true)}
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

        <div className="flex flex-col gap-6">
          {sections.map((section, sectionIndex) => (
            <div key={section.id} className="flex flex-col gap-3">
              <SectionEditor
                value={section.title}
                onCommit={(nextTitle) => onRenameSection(sectionIndex, nextTitle)}
              />

              <div className="flex gap-3 flex-wrap">
                {section.chords.map((chord, chordIndex) => (
                  <div
                    key={`${section.id}-${chordIndex}-${chord}`}
                    className={`relative min-w-[70px] min-h-[86px] px-5 py-4 rounded-lg border-2 text-center transition-colors ${
                      sectionIndex === currentSectionIndex && chordIndex === currentChordIndex
                        ? "border-primary bg-primary/10"
                        : chordIndex === section.chords.length - 1
                        ? "border-green-600 bg-green-600/10"
                        : "border-border bg-background"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onRemoveChord(sectionIndex, chordIndex)}
                      className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-sm bg-red-600 text-xs font-bold leading-none text-white transition-colors hover:bg-red-700"
                      aria-label={`Remove ${chord} from progression`}
                      title="Remove chord"
                    >
                      -
                    </button>
                    <div className="text-xl font-bold text-foreground">{chord}</div>
                    <div className="text-xs text-muted-foreground mt-1">{chordIndex + 1}</div>
                  </div>
                ))}

                <div className="relative" ref={openAddMenuSection === sectionIndex ? addMenuRef : null}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenAddMenuSection((prev) => (prev === sectionIndex ? null : sectionIndex))
                    }
                    className="min-w-[70px] min-h-[86px] px-5 py-4 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-2xl text-muted-foreground cursor-pointer hover:border-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Add chord to progression"
                    aria-expanded={openAddMenuSection === sectionIndex}
                  >
                    +
                  </button>

                  {openAddMenuSection === sectionIndex && (
                    <div className="absolute bottom-full left-0 z-20 mb-2 w-[320px] rounded-xl border border-border bg-card p-4 shadow-xl md:bottom-0 md:left-full md:mb-0 md:ml-2">
                      <div className="mb-3">
                        <div className="text-sm font-semibold text-foreground">Add chord</div>
                        <div className="text-xs text-muted-foreground">
                          Choose a root note and chord quality.
                        </div>
                      </div>
                      <div className="space-y-3">
                        {CHORD_QUALITIES.map((quality) => (
                          <div key={quality.label}>
                            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {quality.label}
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {CHORD_ROOTS.map((root) => {
                                const chord = `${root}${quality.suffix}`;

                                return (
                                  <button
                                    key={chord}
                                    type="button"
                                    onClick={() => handleAddChordClick(sectionIndex, chord)}
                                    className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                                  >
                                    {chord}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
