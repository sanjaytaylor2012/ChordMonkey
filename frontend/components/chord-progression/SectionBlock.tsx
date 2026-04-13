"use client";

import { useEffect, useRef } from "react";
import { isPlayableChordSymbol } from "@/lib/chord-audio";
import { CHORD_QUALITIES, CHORD_ROOTS } from "./constants";
import { SectionEditor } from "./SectionEditor";
import type { SongSection } from "./types";

interface SectionBlockProps {
  section: SongSection;
  sectionIndex: number;
  currentSectionIndex: number | null;
  currentChordIndex: number | null;
  playingSectionIndex: number | null;
  playingChordIndex: number | null;
  openAddMenuSection: number | null;
  setOpenAddMenuSection: (sectionIndex: number | null) => void;
  onAddChord: (sectionIndex: number, chord: string) => void;
  onMoveChord: (
    sourceSectionIndex: number,
    sourceChordIndex: number,
    targetSectionIndex: number,
    targetChordIndex: number,
  ) => void;
  onRemoveChord: (sectionIndex: number, chordIndex: number) => void;
  onSelectChord: (sectionIndex: number, chordIndex: number, chord: string) => void;
  onRenameSection: (sectionIndex: number, title: string) => void;
  onPlayChord: (chord: string) => void;
}

export function SectionBlock({
  section,
  sectionIndex,
  currentSectionIndex,
  currentChordIndex,
  playingSectionIndex,
  playingChordIndex,
  openAddMenuSection,
  setOpenAddMenuSection,
  onAddChord,
  onMoveChord,
  onRemoveChord,
  onSelectChord,
  onRenameSection,
  onPlayChord,
}: SectionBlockProps) {
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const dragChordIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (openAddMenuSection !== sectionIndex) {
      return;
    }

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
  }, [openAddMenuSection, sectionIndex, setOpenAddMenuSection]);

  function handleAddChordClick(chord: string) {
    onAddChord(sectionIndex, chord);
    setOpenAddMenuSection(null);
  }

  function handleDrop(targetChordIndex: number) {
    const sourceChordIndex = dragChordIndexRef.current;
    dragChordIndexRef.current = null;

    if (sourceChordIndex === null || sourceChordIndex === targetChordIndex) {
      return;
    }

    onMoveChord(sectionIndex, sourceChordIndex, sectionIndex, targetChordIndex);
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionEditor
        value={section.title}
        onCommit={(nextTitle) => onRenameSection(sectionIndex, nextTitle)}
      />

      <div className="flex gap-3 flex-wrap items-stretch">
        {section.chords.map((chord, chordIndex) => (
          <div
            key={`${section.id}-${chordIndex}-${chord}`}
            onClick={() => onSelectChord(sectionIndex, chordIndex, chord)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelectChord(sectionIndex, chordIndex, chord);
              }
            }}
            draggable
            onDragStart={() => {
              dragChordIndexRef.current = chordIndex;
            }}
            onDragOver={(event) => {
              event.preventDefault();
            }}
            onDrop={() => handleDrop(chordIndex)}
            onDragEnd={() => {
              dragChordIndexRef.current = null;
            }}
            className={`relative min-w-[70px] px-5 py-4 rounded-lg border-2 text-center transition-colors ${
              sectionIndex === playingSectionIndex && chordIndex === playingChordIndex
                ? "border-blue-500 bg-blue-500/10"
                : sectionIndex === currentSectionIndex && chordIndex === currentChordIndex
                ? "border-primary bg-primary/10"
                : chordIndex === section.chords.length - 1
                ? "border-green-600 bg-green-600/10"
                : "border-border bg-background hover:border-primary/60 hover:bg-muted"
            }`}
            role="button"
            tabIndex={0}
            aria-label={`Select ${chord}`}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRemoveChord(sectionIndex, chordIndex);
              }}
              className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-sm bg-red-600 text-xs font-bold leading-none text-white transition-colors hover:bg-red-700"
              aria-label={`Remove ${chord} from progression`}
              title="Remove chord"
            >
              -
            </button>
            <div className="text-xl font-bold text-foreground">{chord}</div>
            <div className="text-xs text-muted-foreground mt-1">{chordIndex + 1}</div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onPlayChord(chord);
              }}
              disabled={!isPlayableChordSymbol(chord)}
              className="mt-3 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={`Play ${chord}`}
            >
              Play
            </button>
          </div>
        ))}

        <div className="relative flex" ref={openAddMenuSection === sectionIndex ? addMenuRef : null}>
          <button
            type="button"
            onClick={() =>
              setOpenAddMenuSection(openAddMenuSection === sectionIndex ? null : sectionIndex)
            }
            data-tutorial={sectionIndex === 0 ? "specific-chords" : undefined}
            className="min-w-[70px] min-h-[116px] px-5 py-4 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-2xl text-muted-foreground cursor-pointer hover:border-muted-foreground hover:text-foreground transition-colors self-stretch"
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
                            onClick={() => handleAddChordClick(chord)}
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
  );
}
