"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import ParticlesBackground from "@/components/ParticlesBackground";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { useChordPlayback } from "@/components/chord-progression/useChordPlayback";
import { SongSectionsPreview } from "@/components/SongSectionsPreview";
import type { SongSection } from "@/components/chord-progression/types";

interface Song {
  id: string;
  title: string;
  sections: SongSection[];
  created_at: string;
  updated_at: string;
  is_public: boolean;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="6" y="6" width="12" height="12" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Within last 24 hours - show time
  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }

  // Yesterday
  if (diffDays === 1) {
    return "Yesterday";
  }

  // Within last week
  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  // Older - show date
  return date.toLocaleDateString();
}

function SongCard({
  song,
  isRenaming,
  renameValue,
  renaming,
  deleteConfirm,
  onStartRename,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
  onDeleteClick,
  onDeleteConfirm,
  onDeleteCancel,
  onTogglePublic,
}: {
  song: Song;
  isRenaming: boolean;
  renameValue: string;
  renaming: boolean;
  deleteConfirm: boolean;
  onStartRename: () => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
  onDeleteClick: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  onTogglePublic: () => void;
}) {
  const sections = song.sections || [];
  const {
    hasPlayableChords,
    isPlaying,
    playbackCursor,
    playProgression,
    stopPlayback,
  } = useChordPlayback(sections);

  function isChordPlaying(sectionIndex: number, chordIndex: number): boolean {
    return (
      isPlaying &&
      playbackCursor.sectionIndex === sectionIndex &&
      playbackCursor.chordIndex === chordIndex
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/5">
      {/* Header Row: Title + Actions */}
      <div className="flex items-start justify-between gap-3 mb-3">
        {/* Title */}
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => onRenameChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") onRenameSubmit();
                  if (e.key === "Escape") onRenameCancel();
                }}
                autoFocus
                className="text-lg font-semibold text-foreground bg-transparent border-b border-primary outline-none px-1 min-w-0 flex-1"
              />
              <div className="flex gap-1">
                <button
                  onClick={onRenameSubmit}
                  disabled={renaming}
                  className="px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {renaming ? "..." : "Save"}
                </button>
                <button
                  onClick={onRenameCancel}
                  className="px-2 py-1 rounded-md bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground truncate">
                {song.title}
              </h3>
              <button
                onClick={onStartRename}
                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                aria-label="Rename song"
              >
                <PencilIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={isPlaying ? stopPlayback : playProgression}
            disabled={!hasPlayableChords}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={isPlaying ? "Stop" : "Play"}
          >
            {isPlaying ? (
              <StopIcon className="w-5 h-5" />
            ) : (
              <PlayIcon className="w-5 h-5" />
            )}
          </button>
          {deleteConfirm ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onDeleteConfirm}
                className="px-2 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={onDeleteCancel}
                className="px-2 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={onDeleteClick}
              className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
              aria-label="Delete song"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Meta Row: Date + Visibility */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground mb-4">
        <span>Updated {formatDate(song.updated_at)}</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">Created {formatDate(song.created_at)}</span>
        <button
          onClick={onTogglePublic}
          className={`flex items-center gap-2 px-2.5 py-1 rounded-full border transition-all hover:scale-105 ${
            song.is_public
              ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30 hover:bg-green-500/20"
              : "bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground"
          }`}
          title={song.is_public ? "Click to make private" : "Click to make public"}
        >
          {song.is_public ? (
            <GlobeIcon className="w-3.5 h-3.5" />
          ) : (
            <LockIcon className="w-3.5 h-3.5" />
          )}
          <span className="text-xs font-medium">{song.is_public ? "Public" : "Private"}</span>
          <div
            className={`w-8 h-4 rounded-full relative transition-colors ${
              song.is_public ? "bg-green-500" : "bg-muted-foreground/30"
            }`}
          >
            <div
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
                song.is_public ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
        </button>
      </div>

      {/* Chord Progression */}
      <SongSectionsPreview
        sections={sections}
        isChordPlaying={isChordPlaying}
        className="mb-4"
      />

      {/* Edit Button - Full Width */}
      <Link
        href={`/?song=${song.id}`}
        className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Edit Song
      </Link>
    </div>
  );
}

export default function MySongs() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [renamingSongId, setRenamingSongId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);

  // Fetch songs
  useEffect(() => {
    if (!user) return;

    async function fetchSongs() {
      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching songs:", error);
      } else {
        setSongs(data || []);
      }
      setLoading(false);
    }

    fetchSongs();
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  async function handleDelete(songId: string) {
    const { error } = await supabase.from("songs").delete().eq("id", songId);

    if (error) {
      console.error("Error deleting song:", error);
    } else {
      setSongs((prev) => prev.filter((song) => song.id !== songId));
    }
    setDeleteConfirm(null);
  }

  function startRename(song: Song) {
    setRenamingSongId(song.id);
    setRenameValue(song.title);
  }

  async function handleRename(songId: string) {
    if (!renameValue.trim()) {
      setRenamingSongId(null);
      return;
    }

    setRenaming(true);

    const { error } = await supabase
      .from("songs")
      .update({
        title: renameValue.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", songId);

    if (error) {
      console.error("Error renaming song:", error);
    } else {
      setSongs((prev) =>
        prev.map((song) =>
          song.id === songId
            ? {
                ...song,
                title: renameValue.trim(),
                updated_at: new Date().toISOString(),
              }
            : song
        )
      );
    }

    setRenaming(false);
    setRenamingSongId(null);
  }

  async function handleTogglePublic(songId: string) {
    const song = songs.find((s) => s.id === songId);
    if (!song) return;

    const newIsPublic = !song.is_public;

    // Optimistically update UI
    setSongs((prev) =>
      prev.map((s) =>
        s.id === songId ? { ...s, is_public: newIsPublic } : s
      )
    );

    const { error } = await supabase
      .from("songs")
      .update({ is_public: newIsPublic })
      .eq("id", songId);

    if (error) {
      console.error("Error toggling public:", error);
      // Revert on error
      setSongs((prev) =>
        prev.map((s) =>
          s.id === songId ? { ...s, is_public: !newIsPublic } : s
        )
      );
    }
  }

  if (authLoading || loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background relative px-6 py-12">
        <ParticlesBackground />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                My Songs
              </h1>
              <p className="text-muted-foreground">
                {songs.length} {songs.length === 1 ? "song" : "songs"} saved
              </p>
            </div>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              New Song
            </Link>
          </div>

          {/* Songs List */}
          {songs.length > 0 ? (
            <div className="space-y-4">
              {songs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  isRenaming={renamingSongId === song.id}
                  renameValue={renameValue}
                  renaming={renaming}
                  deleteConfirm={deleteConfirm === song.id}
                  onStartRename={() => startRename(song)}
                  onRenameChange={setRenameValue}
                  onRenameSubmit={() => handleRename(song.id)}
                  onRenameCancel={() => setRenamingSongId(null)}
                  onDeleteClick={() => setDeleteConfirm(song.id)}
                  onDeleteConfirm={() => handleDelete(song.id)}
                  onDeleteCancel={() => setDeleteConfirm(null)}
                  onTogglePublic={() => handleTogglePublic(song.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <div className="text-5xl mb-4">🎵</div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No songs yet
              </h2>
              <p className="text-muted-foreground mb-6">
                Start creating your first chord progression!
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
              >
                <PlusIcon className="w-5 h-5" />
                Create Your First Song
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
