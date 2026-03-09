"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import ParticlesBackground from "@/components/ParticlesBackground";

// Placeholder data 
const PLACEHOLDER_SONGS = [
  {
    id: 1,
    title: "Summer Vibes",
    author: "Alex Chen",
    chords: ["C", "G", "Am", "F"],
    likes: 24,
    createdAt: "2 days ago",
  },
  {
    id: 2,
    title: "Midnight Blues",
    author: "Sarah Kim",
    chords: ["Em", "Am", "D", "G"],
    likes: 42,
    createdAt: "3 days ago",
  },
  {
    id: 3,
    title: "Coffee Shop",
    author: "Mike Johnson",
    chords: ["D", "A", "Bm", "G"],
    likes: 18,
    createdAt: "5 days ago",
  },
  {
    id: 4,
    title: "Rainy Day",
    author: "Emma Wilson",
    chords: ["Am", "F", "C", "G"],
    likes: 31,
    createdAt: "1 week ago",
  },
  {
    id: 5,
    title: "Sunset Drive",
    author: "Chris Lee",
    chords: ["G", "D", "Em", "C"],
    likes: 56,
    createdAt: "1 week ago",
  },
  {
    id: 6,
    title: "City Lights",
    author: "Jordan Taylor",
    chords: ["F", "Am", "G", "C"],
    likes: 29,
    createdAt: "2 weeks ago",
  },
];

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

export default function Discover() {
  const [searchQuery, setSearchQuery] = useState("");
  const [likedSongs, setLikedSongs] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  function toggleLike(songId: number) {
    setLikedSongs((prev) =>
      prev.includes(songId)
        ? prev.filter((id) => id !== songId)
        : [...prev, songId]
    );
  }

  const filteredSongs = PLACEHOLDER_SONGS.filter(
    (song) =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.chords.some((chord) =>
        chord.toLowerCase().includes(searchQuery.toLowerCase())
      )
  ).sort((a, b) => {
    if (sortBy === "popular") {
      return b.likes - a.likes;
    }
    return 0; 
  });

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background relative px-6 py-12">
        <ParticlesBackground />

        <div className="relative z-10 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Discover Songs
            </h1>
            <p className="text-muted-foreground">
              Explore chord progressions created by the community
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title, author, or chord..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("recent")}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === "recent"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setSortBy("popular")}
                className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  sortBy === "popular"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Popular
              </button>
            </div>
          </div>

          {/* Songs Grid */}
          {filteredSongs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSongs.map((song) => (
                <div
                  key={song.id}
                  className="bg-card border border-border rounded-xl p-5 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/5 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  {/* Song Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        {song.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {song.author} • {song.createdAt}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(song.id);
                      }}
                      className="flex items-center gap-1 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <HeartIcon
                        className={`w-5 h-5 ${
                          likedSongs.includes(song.id) ? "text-red-500" : ""
                        }`}
                        filled={likedSongs.includes(song.id)}
                      />
                      <span>
                        {song.likes + (likedSongs.includes(song.id) ? 1 : 0)}
                      </span>
                    </button>
                  </div>

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
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-muted-foreground">
                No songs found matching "{searchQuery}"
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}