"use client";

import React, { useEffect, useState } from "react";
import { SectionBlock } from "@/components/chord-progression/SectionBlock";
import { useChordPlayback } from "@/components/chord-progression/useChordPlayback";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

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
  loadedSongId?: string | null;
  loadedSongTitle?: string | null;
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
  loadedSongId,
  loadedSongTitle,
}: ChordProgressionProps) {
  const { user } = useAuth();
  const [songTitle, setSongTitle] = useState("Untitled Song");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [openAddMenuSection, setOpenAddMenuSection] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    hasPlayableChords,
    isPlaying,
    playbackCursor,
    playChordPreview,
    playProgression,
    stopPlayback,
  } = useChordPlayback(sections);

  // Set title when song is loaded
  useEffect(() => {
    if (loadedSongTitle) {
      setSongTitle(loadedSongTitle);
    }
  }, [loadedSongTitle]);

  // Reset title when starting fresh (no loaded song)
  useEffect(() => {
    if (!loadedSongId && !loadedSongTitle) {
      setSongTitle("Untitled Song");
    }
  }, [loadedSongId, loadedSongTitle]);

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
    setSongTitle("Untitled Song");
  }

  function handleSaveClick() {
    if (!user) {
      setSaveError("Please log in to save your song");
      setShowSaveModal(true);
      return;
    }
    setSaveTitle(songTitle);
    setSaveError(null);
    setSaveSuccess(false);
    setShowSaveModal(true);
  }

  async function handleSaveConfirm() {
    if (!user) return;

    setSaving(true);
    setSaveError(null);

    let result;

    if (loadedSongId) {
      // Update existing song
      result = await supabase
        .from("songs")
        .update({
          title: saveTitle.trim() || "Untitled Song",
          sections: sections,
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq("id", loadedSongId)
        .select();
    } else {
      // Insert new song
      result = await supabase
        .from("songs")
        .insert({
          user_id: user.id,
          title: saveTitle.trim() || "Untitled Song",
          sections: sections,
          is_public: isPublic,
        })
        .select();
    }

    const { data, error } = result;

    console.log("Save response:", { data, error });

    if (error) {
      console.error("Error saving song:", error.message, error.details, error.hint);
      setSaveError(error.message || "Failed to save song. Please try again.");
      setSaving(false);
    } else {
      setSongTitle(saveTitle.trim() || "Untitled Song");
      setSaveSuccess(true);
      setSaving(false);
    }
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
            <div className="flex items-center gap-2">
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
              {loadedSongId && (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Editing saved song
                </span>
              )}
            </div>
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
            <button
              onClick={handleSaveClick}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {loadedSongId ? "Update" : "Save"}
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

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-lg">
            {saveSuccess ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-foreground font-medium mb-4">
                  {loadedSongId ? "Song updated!" : "Song saved!"}
                </p>
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setSaveSuccess(false);
                  }}
                  className="px-6 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                >
                  OK
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {loadedSongId ? "Update Song" : "Save Song"}
                </h3>

                {saveError && (
                  <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                    {saveError}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Song Title
                    </label>
                    <input
                      type="text"
                      value={saveTitle}
                      onChange={(e) => setSaveTitle(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter song title"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-foreground">
                        Make Public
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Show in Discover for others to see
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPublic(!isPublic)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        isPublic ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white shadow-sm transform transition-transform ${
                          isPublic ? "translate-x-6" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowSaveModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveConfirm}
                    disabled={saving || !user}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving..." : loadedSongId ? "Update" : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}