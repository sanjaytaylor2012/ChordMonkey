"use client";

import { useState } from "react";
import RecordingSection from "@/components/RecordingSection";
import ChordDisplay from "@/components/ChordDisplay";
import ChordRecommendations from "@/components/ChordRecommendations";
import ChordProgression from "@/components/ChordProgression";

const ANALYZE_URL =
  "https://5ywb7vjgv5.execute-api.us-east-1.amazonaws.com/analyze-midi";

// const ANALYZE_URL = "http://localhost:8000/analyze-midi";

export default function Home() {
  // Current detected chord from audio
  const [detectedChord, setDetectedChord] = useState<string | null>("Am");

  // Chord selected from recommendations
  const [selectedChord, setSelectedChord] = useState<string | null>(null);

  // The chord progression the user is building
  const [progression, setProgression] = useState<string[]>([
    "C",
    "G",
    "Am",
    "F",
  ]);

  // Track the most recently added chord
  const [lastAddedChord, setLastAddedChord] = useState<string | null>(null);

  // Which chord in the progression is "active"
  const [currentIndex, setCurrentIndex] = useState<number | null>(2);

  // Handle selecting a chord from recommendations
  function handleSelectChord(chord: string) {
    setSelectedChord(chord);
  }

  // Handle adding a chord to the progression
  function handleAddChord(chord: string) {
    setProgression([...progression, chord]);
    setLastAddedChord(chord);
    setSelectedChord(chord);
  }

  // Clear the progression
  function handleClear() {
    setProgression([]);
    setCurrentIndex(null);
    setSelectedChord(null);
    setLastAddedChord(null);
  }

  // Called when MIDI conversion completes (for future use)
  async function handleMidiConverted(midiBlob: Blob) {
    try {
      const midiFile = new File([midiBlob], "output.mid", {
        type: "audio/midi",
      });
      const form = new FormData();
      form.append("file", midiFile);

      const resp = await fetch(ANALYZE_URL, { method: "POST", body: form });
      if (!resp.ok) throw new Error(await resp.text());

      const analysis = await resp.json();
      const first = analysis?.events?.[0];

      if (!first) {
        setDetectedChord("(no chord detected)");
        return;
      }

      if (first.symbol) {
        setDetectedChord(first.symbol);
        return;
      }

      // Preferred: backend provides a simple symbol like "G" or "Am"
      const symbol: string | undefined = first.symbol;

      if (symbol) {
        setDetectedChord(symbol);
        return;
      }

      // Fallback (if you haven't added `symbol` yet):
      // Guess from pitch_classes (major/minor only)
      const pcs: string[] | undefined = first.pitch_classes;
      if (pcs && pcs.length >= 2) {
        // crude: if contains minor 3rd from root, label as minor (MVP)
        // Better to add `symbol` in backend.
        setDetectedChord(pcs[0]); // at least show the root pitch class
      }
    } catch (e) {
      console.error("Analyze MIDI failed:", e);
    }
  }

  // The chord to display
  const displayChord = detectedChord;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Recording Section */}
        <div className="mb-8">
          <RecordingSection onMidiConverted={handleMidiConverted} />
        </div>

        {/* Chord Display + Recommendations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ChordDisplay
            chord={displayChord}
            label={selectedChord ? "Selected Chord" : "Detected Chord"}
          />
          <ChordRecommendations
            currentChord={detectedChord}
            selectedChord={selectedChord}
            lastAddedChord={lastAddedChord}
            onSelectChord={handleSelectChord}
            onAddChord={handleAddChord}
          />
        </div>

        {/* Chord Progression */}
        <div>
          <ChordProgression
            chords={progression}
            currentIndex={currentIndex}
            onClear={handleClear}
          />
        </div>
      </div>
    </div>
  );
}
