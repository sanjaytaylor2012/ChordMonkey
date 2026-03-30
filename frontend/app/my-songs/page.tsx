"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import ParticlesBackground from "@/components/ParticlesBackground";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";

interface Song {
  id: string;
  title: string;
  sections: { id: string; title: string; chords: string[] }[];
  created_at: string;
  updated_at: string;
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

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default function MySongs() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

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
    const { error } = await supabase
      .from("songs")
      .delete()
      .eq("id", songId);

    if (error) {
      console.error("Error deleting song:", error);
    } else {
      setSongs((prev) => prev.filter((song) => song.id !== songId));
    }
    setDeleteConfirm(null);
  }

  // Get all chords from all sections
  function getAllChords(song: Song): string[] {
    if (!song.sections || !Array.isArray(song.sections)) return [];
    return song.sections.flatMap((section) => section.chords || []);
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
              {songs.map((song) => {
                const chords = getAllChords(song);
                return (
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
                          Created {formatDate(song.created_at)} • Updated{" "}
                          {formatDate(song.updated_at)}
                        </p>

                        {/* Chord Progression */}
                        {chords.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {chords.slice(0, 12).map((chord, index) => (
                              <span
                                key={index}
                                className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium"
                              >
                                {chord}
                              </span>
                            ))}
                            {chords.length > 12 && (
                              <span className="px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm font-medium">
                                +{chords.length - 12} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No chords yet
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <Link
                          href={`/?song=${song.id}`}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          aria-label="Edit song"
                        >
                          <EditIcon className="w-5 h-5" />
                        </Link>
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
                );
              })}
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