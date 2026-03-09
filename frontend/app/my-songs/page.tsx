"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import ParticlesBackground from "@/components/ParticlesBackground";

// Placeholder data 
const PLACEHOLDER_SONGS = [
  {
    id: 1,
    title: "My First Song",
    chords: ["C", "G", "Am", "F"],
    createdAt: "Today",
    updatedAt: "2 hours ago",
  },
  {
    id: 2,
    title: "Late Night Ideas",
    chords: ["Em", "Am", "D", "G", "C"],
    createdAt: "Yesterday",
    updatedAt: "Yesterday",
  },
  {
    id: 3,
    title: "Untitled Song",
    chords: ["D", "A", "Bm"],
    createdAt: "3 days ago",
    updatedAt: "3 days ago",
  },
];

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

function EditIcon({ className }: { className?: string }) {
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

function ShareIcon({ className }: { className?: string }) {
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}

export default function MySongs() {
  const [songs, setSongs] = useState(PLACEHOLDER_SONGS);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  function handleDelete(songId: number) {
    setSongs((prev) => prev.filter((song) => song.id !== songId));
    setDeleteConfirm(null);
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
                <div
                  key={song.id}
                  className="bg-card border border-border rounded-xl p-5 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/5"
                >
                  <div className="flex items-start justify-between">
                    {/* Song Info */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {song.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Created {song.createdAt} • Updated {song.updatedAt}
                      </p>

                      {/* Chord Progression */}
                      <div className="flex flex-wrap gap-2">
                        {song.chords.map((chord, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                          >
                            {chord}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Edit song"
                      >
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <button
                        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        aria-label="Share song"
                      >
                        <ShareIcon className="w-5 h-5" />
                      </button>
                      {deleteConfirm === song.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(song.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(song.id)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          aria-label="Delete song"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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