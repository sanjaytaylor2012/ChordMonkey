"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import ParticlesBackground from "@/components/ParticlesBackground";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

interface Song {
  id: string;
  title: string;
  sections: { id: string; title: string; chords: string[] }[];
  created_at: string;
  user_id: string;
  profiles: {
    name: string;
  }[] | null;
}

function HeartIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
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

export default function Discover() {
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set());

  // Fetch all songs
  useEffect(() => {
    async function fetchSongs() {
      const { data, error } = await supabase
        .from("songs")
        .select(`
          id,
          title,
          sections,
          created_at,
          user_id,
          profiles (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching songs:", error);
      } else {
        setSongs(data || []);
      }
      setLoading(false);
    }

    fetchSongs();
  }, []);

  // Get all chords from all sections
  function getAllChords(song: Song): string[] {
    if (!song.sections || !Array.isArray(song.sections)) return [];
    return song.sections.flatMap((section) => section.chords || []);
  }

  // Filter songs based on search
  const filteredSongs = songs.filter((song) => {
    const searchLower = search.toLowerCase();
    const chords = getAllChords(song);
    const authorName = song.profiles?.[0]?.name || "Anonymous";
    
    return (
      song.title.toLowerCase().includes(searchLower) ||
      authorName.toLowerCase().includes(searchLower) ||
      chords.some((chord) => chord.toLowerCase().includes(searchLower))
    );
  });

  // Sort songs
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    // For now, "popular" just shows liked songs first (local state only)
    const aLiked = likedSongs.has(a.id) ? 1 : 0;
    const bLiked = likedSongs.has(b.id) ? 1 : 0;
    return bLiked - aLiked;
  });

  function toggleLike(songId: string) {
    setLikedSongs((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background relative px-6 py-12">
        <ParticlesBackground />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Discover
            </h1>
            <p className="text-muted-foreground">
              Explore chord progressions from the community
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title, author, or chord..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex rounded-lg border border-border bg-card p-1">
              <button
                onClick={() => setSortBy("recent")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  sortBy === "recent"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy("popular")}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  sortBy === "popular"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Popular
              </button>
            </div>
          </div>

          {/* Songs Grid */}
          {sortedSongs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedSongs.map((song) => {
                const chords = getAllChords(song);
                const isLiked = likedSongs.has(song.id);
                const authorName = song.profiles?.[0]?.name || "Anonymous";

                return (
                  <div
                    key={song.id}
                    className="bg-card border border-border rounded-xl p-5 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          {song.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          by {authorName} • {formatDate(song.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleLike(song.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isLiked
                            ? "text-red-500 bg-red-500/10"
                            : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        }`}
                        aria-label={isLiked ? "Unlike" : "Like"}
                      >
                        <HeartIcon className="w-5 h-5" filled={isLiked} />
                      </button>
                    </div>

                    {/* Chords */}
                    {chords.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {chords.slice(0, 8).map((chord, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium"
                          >
                            {chord}
                          </span>
                        ))}
                        {chords.length > 8 && (
                          <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground text-sm font-medium">
                            +{chords.length - 8} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        No chords yet
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-card border border-border rounded-xl">
              <div className="text-5xl mb-4">🔍</div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {search ? "No songs found" : "No songs yet"}
              </h2>
              <p className="text-muted-foreground">
                {search
                  ? "Try a different search term"
                  : "Be the first to share a chord progression!"}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}