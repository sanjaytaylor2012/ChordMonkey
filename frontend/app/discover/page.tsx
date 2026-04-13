"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import ParticlesBackground from "@/components/ParticlesBackground";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useChordPlayback } from "@/components/chord-progression/useChordPlayback";
import { SongSectionsPreview } from "@/components/SongSectionsPreview";
import type { SongSection } from "@/components/chord-progression/types";

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface Song {
  id: string;
  title: string;
  sections: SongSection[];
  created_at: string;
  user_id: string;
  like_count: number;
  author_name: string;
  author_avatar: string | null;
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

function UserIcon({ className }: { className?: string }) {
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
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
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

function SongCard({
  song,
  isLiked,
  onToggleLike,
  disabled,
}: {
  song: Song;
  isLiked: boolean;
  onToggleLike: () => void;
  disabled: boolean;
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
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Avatar */}
          {song.author_avatar ? (
            <img
              src={song.author_avatar}
              alt={song.author_name}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {song.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {song.author_name} • {formatDate(song.created_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-3">
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
          <button
            onClick={onToggleLike}
            disabled={disabled}
            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
              isLiked
                ? "text-red-500 bg-red-500/10"
                : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            aria-label={isLiked ? "Unlike" : "Like"}
          >
            <HeartIcon className="w-5 h-5" filled={isLiked} />
            {song.like_count > 0 && (
              <span className="text-sm font-medium">{song.like_count}</span>
            )}
          </button>
        </div>
      </div>

      {/* Chords */}
      <SongSectionsPreview sections={sections} isChordPlaying={isChordPlaying} />
    </div>
  );
}

export default function Discover() {
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [likedSongIds, setLikedSongIds] = useState<Set<string>>(new Set());
  const [likingInProgress, setLikingInProgress] = useState<Set<string>>(new Set());

  // Fetch all public songs with like counts
  useEffect(() => {
    async function fetchSongs() {
      // Get songs
      const { data: songsData, error: songsError } = await supabase
        .from("songs")
        .select("id, title, sections, created_at, user_id")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (songsError) {
        console.error("Error fetching songs:", songsError);
        setLoading(false);
        return;
      }

      // Get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, avatar_url");

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }

      // Create a map of user_id to profile
      const profileMap: Record<string, Profile> = {};
      (profilesData || []).forEach((profile) => {
        profileMap[profile.id] = profile;
      });

      // Get like counts for each song
      const { data: likeCounts, error: likeCountError } = await supabase
        .from("likes")
        .select("song_id");

      if (likeCountError) {
        console.error("Error fetching like counts:", likeCountError);
      }

      // Count likes per song
      const likeCountMap: Record<string, number> = {};
      (likeCounts || []).forEach((like) => {
        likeCountMap[like.song_id] = (likeCountMap[like.song_id] || 0) + 1;
      });

      // Combine songs with profiles and like counts
      const songsWithData: Song[] = (songsData || []).map((song) => {
        const profile = profileMap[song.user_id];
        return {
          ...song,
          like_count: likeCountMap[song.id] || 0,
          author_name: profile?.name || "Anonymous",
          author_avatar: profile?.avatar_url || null,
        };
      });

      setSongs(songsWithData);
      setLoading(false);
    }

    fetchSongs();
  }, []);

  // Fetch user's likes
  useEffect(() => {
    if (!user) {
      setLikedSongIds(new Set());
      return;
    }

    async function fetchUserLikes() {
      const { data, error } = await supabase
        .from("likes")
        .select("song_id")
        .eq("user_id", user!.id);

      if (error) {
        console.error("Error fetching user likes:", error);
      } else {
        setLikedSongIds(new Set(data?.map((like) => like.song_id) || []));
      }
    }

    fetchUserLikes();
  }, [user]);

  // Get all chords from all sections
  function getAllChords(song: Song): string[] {
    if (!song.sections || !Array.isArray(song.sections)) return [];
    return song.sections.flatMap((section) => section.chords || []);
  }

  // Filter songs based on search
  const filteredSongs = songs.filter((song) => {
    const searchLower = search.toLowerCase();
    const chords = getAllChords(song);

    return (
      song.title.toLowerCase().includes(searchLower) ||
      song.author_name.toLowerCase().includes(searchLower) ||
      chords.some((chord) => chord.toLowerCase().includes(searchLower))
    );
  });

  // Sort songs
  const sortedSongs = [...filteredSongs].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    // Sort by like count
    return b.like_count - a.like_count;
  });

  async function toggleLike(songId: string) {
    if (!user) {
      return;
    }

    if (likingInProgress.has(songId)) return;

    setLikingInProgress((prev) => new Set(prev).add(songId));

    const isCurrentlyLiked = likedSongIds.has(songId);

    // Optimistic update
    setLikedSongIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyLiked) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });

    setSongs((prev) =>
      prev.map((song) =>
        song.id === songId
          ? {
              ...song,
              like_count: isCurrentlyLiked
                ? song.like_count - 1
                : song.like_count + 1,
            }
          : song
      )
    );

    try {
      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("song_id", songId);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("likes").insert({
          user_id: user.id,
          song_id: songId,
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error("Error toggling like:", error);

      // Revert optimistic update
      setLikedSongIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlyLiked) {
          next.add(songId);
        } else {
          next.delete(songId);
        }
        return next;
      });

      setSongs((prev) =>
        prev.map((song) =>
          song.id === songId
            ? {
                ...song,
                like_count: isCurrentlyLiked
                  ? song.like_count + 1
                  : song.like_count - 1,
              }
            : song
        )
      );
    } finally {
      setLikingInProgress((prev) => {
        const next = new Set(prev);
        next.delete(songId);
        return next;
      });
    }
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
              {sortedSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  isLiked={likedSongIds.has(song.id)}
                  onToggleLike={() => toggleLike(song.id)}
                  disabled={!user || likingInProgress.has(song.id)}
                />
              ))}
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
