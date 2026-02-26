"use client";

import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import ParticlesBackground from "@/components/ParticlesBackground";

export default function Welcome() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background relative">
        <ParticlesBackground />
        
        <div className="relative z-10">
          {/* Hero Section */}
          <section className="px-6 py-20 md:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <div className="text-6xl mb-6">🐒</div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Write songs with
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"> ChordMonkey</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Record audio, detect chords instantly, and get intelligent suggestions 
                to build your next hit song. Powered by music theory and AI.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-lg"
                >
                  Get started free
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 rounded-lg bg-background border border-border text-foreground font-semibold hover:bg-muted transition-all"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="px-6 py-20 border-t border-border">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground text-center mb-12">
                Everything you need to write music
              </h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/5">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Instant Chord Detection
                  </h3>
                  <p className="text-muted-foreground">
                    Record or upload audio and instantly see which chords you're playing. 
                    Works with guitar, piano, and more.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/5">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Smart Suggestions
                  </h3>
                  <p className="text-muted-foreground">
                    Get intelligent chord recommendations based on music theory. 
                    Discover progressions that sound great together.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm dark:shadow-none dark:ring-1 dark:ring-white/5">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Build Progressions
                  </h3>
                  <p className="text-muted-foreground">
                    Build and save your chord progressions. Export them and 
                    take your songs to the next level.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section className="px-6 py-20 border-t border-border">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-foreground text-center mb-12">
                How it works
              </h2>
              
              <div className="space-y-8">
                {/* Step 1 */}
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      Record or upload audio
                    </h3>
                    <p className="text-muted-foreground">
                      Use your microphone to record yourself playing, or upload an existing audio file.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      See your chords
                    </h3>
                    <p className="text-muted-foreground">
                      ChordMonkey analyzes your audio and displays the detected chords with guitar diagrams.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">
                      Get suggestions & build
                    </h3>
                    <p className="text-muted-foreground">
                      Explore recommended chords based on music theory, add them to your progression, and create your song.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="px-6 py-20 border-t border-border">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Ready to start writing?
              </h2>
              <p className="text-muted-foreground mb-8">
                Join thousands of musicians using ChordMonkey to create amazing music.
              </p>
              <Link
                href="/signup"
                className="inline-block px-8 py-4 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all hover:scale-105 hover:shadow-lg"
              >
                Create your free account
              </Link>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}