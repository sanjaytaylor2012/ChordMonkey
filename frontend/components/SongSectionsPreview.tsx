"use client";

import type { SongSection } from "@/components/chord-progression/types";

interface SongSectionsPreviewProps {
  sections: SongSection[];
  isChordPlaying?: (sectionIndex: number, chordIndex: number) => boolean;
  className?: string;
}

export function SongSectionsPreview({
  sections,
  isChordPlaying,
  className = "",
}: SongSectionsPreviewProps) {
  if (!sections.length) {
    return <p className="text-sm text-muted-foreground italic">No chords yet</p>;
  }

  return (
    <div className={`space-y-3 ${className}`.trim()}>
      {sections.map((section, sectionIndex) => {
        const chords = section.chords || [];
        const title = section.title?.trim() || `Section ${sectionIndex + 1}`;

        return (
          <div
            key={section.id || `${title}-${sectionIndex}`}
            className="rounded-lg border border-border/70 bg-background/60 p-3"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {title}
            </p>

            {chords.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {chords.map((chord, chordIndex) => {
                  const playing = isChordPlaying?.(sectionIndex, chordIndex) ?? false;

                  return (
                    <span
                      key={`${section.id}-${chordIndex}-${chord}`}
                      className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-150 ${
                        playing
                          ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {chord}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No chords in this section
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
