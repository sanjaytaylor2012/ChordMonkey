"use client";

import { useState } from "react";
import RecordingSection from "@/components/RecordingSection";
import ChordDisplay from "@/components/ChordDisplay";
import ChordRecommendations from "@/components/ChordRecommendations";
import ChordProgression from "@/components/ChordProgression";

export default function Home() {
  // Current detected chord from audio
  const [detectedChord, setDetectedChord] = useState<string | null>("Am");
  
  // Chord selected from recommendations 
  const [selectedChord, setSelectedChord] = useState<string | null>(null);
  
  // The chord progression the user is building
  const [progression, setProgression] = useState<string[]>(["C", "G", "Am", "F"]);

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
  function handleMidiConverted(midiBlob: Blob) {
    // TODO: Parse MIDI and detect chords
    console.log("MIDI converted:", midiBlob);
  }

  // The chord to display 
  const displayChord = selectedChord || detectedChord;

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