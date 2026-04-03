"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import RecordingSection from "@/components/RecordingSection";
import ChordDisplay from "@/components/ChordDisplay";
import ChordRecommendations from "@/components/ChordRecommendations";
import ChordProgression, { SongSection } from "@/components/ChordProgression";
import ParticlesBackground from "@/components/ParticlesBackground";
import { CreatePageTutorial } from "@/components/CreatePageTutorial";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import type {
  DisplayInstrument,
  MidiAnalysis,
  RecommendationLevel,
} from "@/lib/create-page-types";

function createSection(sectionNumber: number, chords: string[] = []): SongSection {
  return {
    id: `section-${sectionNumber}`,
    title: `Section ${sectionNumber}`,
    chords,
  };
}

function HomeContent() {
  const searchParams = useSearchParams();
  const songId = searchParams.get("song");
  const { user } = useAuth();

  const [displayInstrument, setDisplayInstrument] =
    useState<DisplayInstrument>("guitar");
  const [recommendationLevel, setRecommendationLevel] =
    useState<RecommendationLevel>("beginner");

  // Current detected chord from audio
  const [detectedChord, setDetectedChord] = useState<string | null>("Am");

  // Chord selected from recommendations
  const [selectedChord, setSelectedChord] = useState<string | null>(null);

  // The chord progression the user is building
  const [sections, setSections] = useState<SongSection[]>([
    createSection(1, ["C", "G", "Am", "F"]),
  ]);

  // Track the most recently added chord
  const [lastAddedChord, setLastAddedChord] = useState<string | null>(null);

  // Which chord in the progression is "active"
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number | null>(0);
  const [currentChordIndex, setCurrentChordIndex] = useState<number | null>(2);

  // Track loaded song info
  const [loadedSongId, setLoadedSongId] = useState<string | null>(null);
  const [loadedSongTitle, setLoadedSongTitle] = useState<string | null>(null);
  const [loadingSong, setLoadingSong] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);

  const tutorialSteps = [
    {
      id: "tutorial-launch",
      target: "tutorial-launch",
      title: "Start here",
      description:
        "Use this button anytime to restart the walkthrough. It is highlighted so new users know where to begin.",
    },
    {
      id: "recording-controls",
      target: "recording-controls",
      title: "Record each chord",
      description:
        "Record one chord at a time. Press Record, play your chord, then press Stop & Convert to MIDI so Chord Monkey can detect it before you add it to your song.",
    },
    {
      id: "instrument-toggle",
      target: "instrument-toggle",
      title: "Switch between guitar or keyboard",
      description:
        "Use this toggle to swap the chord diagram between guitar and keyboard while keeping the same detected or selected chord.",
    },
    {
      id: "mode-toggle",
      target: "mode-toggle",
      title: "Beginner vs Advanced mode",
      description:
        "Beginner mode stays closer to basic diatonic harmony. This mode will provide users with chords that stay within the chosen or detected key. \n Advanced mode suggests more colorful or tension-heavy moves for less predictable progressions. This mode offers recommendations for more complicated chords, as well as chords/tones not strictly within the chosen or detected key. These chords recommendations are highlighted with a yellow border.",
    },
    {
      id: "detected-chord",
      target: "detected-chord",
      title: "Detected chord display",
      description:
        "After recording, this panel shows the detected chord and diagram. Use the + button here to add that exact chord directly to your progression. \n Clicking on a recommended chord will show its voicing in this section until a new chord is recorded.",
    },
    {
      id: "recommendations-panel",
      target: "recommendations-panel",
      title: "Add recommended chords",
      description:
        "This panel suggests next chords based on what chords are already in the Chord Progression section. Click a card to inspect it, Play to preview it, or + to add it.",
    },
    {
      id: "specific-chords",
      target: "specific-chords",
      title: "Add a specific chord manually",
      description:
        "Use this + slot inside a section to open the chord picker. It lets you choose your own chord roots and qualities when you want something other than the recommendations.",
    },
    {
      id: "add-section",
      target: "add-section",
      title: "Build multiple song sections",
      description:
        "Add new sections for verse, chorus, bridge, or any other part of the song. Each section keeps its own chord list and title.",
    },
    {
      id: "playback-button",
      target: "playback-button",
      title: "Playback your progression",
      description:
        "Use Play to hear the progression from left to right. Chord Monkey will highlight each chord as it plays so you can check the flow of the arrangement.",
    },
  ] as const;

  // Load song from URL parameter
  useEffect(() => {
    if (!songId || !user) return;

    async function loadSong() {
      setLoadingSong(true);

      const { data, error } = await supabase
        .from("songs")
        .select("*")
        .eq("id", songId)
        .eq("user_id", user!.id)
        .single();

      if (error) {
        console.error("Error loading song:", error);
      } else if (data) {
        setSections(data.sections || [createSection(1)]);
        setLoadedSongId(data.id);
        setLoadedSongTitle(data.title);
        setCurrentSectionIndex(null);
        setCurrentChordIndex(null);
        setSelectedChord(null);
        setLastAddedChord(null);
      }

      setLoadingSong(false);
    }

    loadSong();
  }, [songId, user]);

  const progression = sections.flatMap((section) => section.chords);
  const activeTutorialStep = tutorialSteps[tutorialStepIndex] ?? null;

  // Handle selecting a chord from recommendations
  function handleSelectChord(chord: string) {
    setSelectedChord(chord);
  }

  function handleSelectProgressionChord(
    sectionIndex: number,
    chordIndex: number,
    chord: string,
  ) {
    setSelectedChord(chord);
    setCurrentSectionIndex(sectionIndex);
    setCurrentChordIndex(chordIndex);
  }

  function handleRefreshRecommendations() {
    setLastAddedChord(null);
  }

  function handleStartTutorial() {
    setTutorialStepIndex(0);
    setIsTutorialOpen(true);
  }

  function handleCloseTutorial() {
    setIsTutorialOpen(false);
  }

  function handleNextTutorialStep() {
    setTutorialStepIndex((current) =>
      Math.min(current + 1, tutorialSteps.length - 1),
    );
  }

  function handlePreviousTutorialStep() {
    setTutorialStepIndex((current) => Math.max(current - 1, 0));
  }

  // Handle adding a chord to the progression
  function handleAddChord(chord: string) {
    const targetSectionIndex = sections.length - 1;
    const nextChordIndex = sections[targetSectionIndex]?.chords.length ?? 0;

    setSections((prev) =>
      prev.map((section, index) =>
        index === targetSectionIndex
          ? { ...section, chords: [...section.chords, chord] }
          : section
      )
    );
    setLastAddedChord(chord);
    setSelectedChord(chord);
    setCurrentSectionIndex(targetSectionIndex);
    setCurrentChordIndex(nextChordIndex);
  }

  function handleAddChordToSection(sectionIndex: number, chord: string) {
    const nextChordIndex = sections[sectionIndex]?.chords.length ?? 0;

    setSections((prev) =>
      prev.map((section, index) =>
        index === sectionIndex
          ? { ...section, chords: [...section.chords, chord] }
          : section
      )
    );
    setLastAddedChord(chord);
    setSelectedChord(chord);
    setCurrentSectionIndex(sectionIndex);
    setCurrentChordIndex(nextChordIndex);
  }

  function handleRemoveChord(sectionIndex: number, chordIndexToRemove: number) {
    setSections((prev) =>
      prev.map((section, index) =>
        index === sectionIndex
          ? {
              ...section,
              chords: section.chords.filter((_, chordIndex) => chordIndex !== chordIndexToRemove),
            }
          : section
      )
    );
    setSelectedChord(null);
    setLastAddedChord(null);
    setCurrentChordIndex((prev) => {
      if (currentSectionIndex !== sectionIndex || prev === null) return prev;
      if (prev === chordIndexToRemove) return null;
      if (prev > chordIndexToRemove) return prev - 1;
      return prev;
    });
  }

  // Clear the progression
  function handleClear() {
    setSections([createSection(1)]);
    setCurrentSectionIndex(null);
    setCurrentChordIndex(null);
    setSelectedChord(null);
    setLastAddedChord(null);
    setLoadedSongId(null);
    setLoadedSongTitle(null);
  }

  function handleAddSection() {
    setSections((prev) => [...prev, createSection(prev.length + 1)]);
  }

  function handleRenameSection(sectionIndex: number, title: string) {
    setSections((prev) =>
      prev.map((section, index) =>
        index === sectionIndex ? { ...section, title } : section
      )
    );
  }

  function handleExitSong() {
    // Clear URL parameter
    window.history.pushState({}, "", "/");

    // Reset state
    setSections([createSection(1)]);
    setCurrentSectionIndex(null);
    setCurrentChordIndex(null);
    setSelectedChord(null);
    setLastAddedChord(null);
    setLoadedSongId(null);
    setLoadedSongTitle(null);
  }

  function handleRecordingAnalyzed(analysis: MidiAnalysis) {
    try {
      const first = analysis?.events?.[0];

      if (!first) {
        setDetectedChord("(no chord detected)");
        setSelectedChord(null);
        return;
      }

      if (first.symbol) {
        setDetectedChord(first.symbol);
        setSelectedChord(null);
        return;
      }

      const symbol: string | undefined = first.symbol;

      if (symbol) {
        setDetectedChord(symbol);
        setSelectedChord(null);
        return;
      }

      const pcs: string[] | undefined = first.pitch_classes;
      if (pcs && pcs.length >= 2) {
        setDetectedChord(pcs[0]);
        setSelectedChord(null);
      }
    } catch (e) {
      console.error("Analyze MIDI failed:", e);
    }
  }

  // The chord to display
  const displayChord = selectedChord ?? detectedChord;

  if (loadingSong) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading song...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background relative">
        <ParticlesBackground />
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
          {/* Recording Section */}
          <div className="mb-8">
            <RecordingSection
              onRecordingAnalyzed={handleRecordingAnalyzed}
              displayInstrument={displayInstrument}
              recommendationLevel={recommendationLevel}
              onDisplayInstrumentChange={setDisplayInstrument}
              onRecommendationLevelChange={setRecommendationLevel}
              onStartTutorial={handleStartTutorial}
              isTutorialHighlighted={!isTutorialOpen}
            />
          </div>

          {/* Chord Display + Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <ChordDisplay
              chord={displayChord}
              label={selectedChord ? "Selected Chord" : "Detected Chord"}
              onAddChord={handleAddChord}
              instrument={displayInstrument}
            />
            <ChordRecommendations
              currentChord={detectedChord}
              selectedChord={selectedChord}
              lastAddedChord={lastAddedChord}
              progression={progression}
              level={recommendationLevel}
              onRefreshRecommendations={handleRefreshRecommendations}
              onSelectChord={handleSelectChord}
              onAddChord={handleAddChord}
            />
          </div>

          {/* Chord Progression */}
          <div>
            <ChordProgression
              sections={sections}
              currentSectionIndex={currentSectionIndex}
              currentChordIndex={currentChordIndex}
              onClear={handleClear}
              onSelectChord={handleSelectProgressionChord}
              onAddChord={handleAddChordToSection}
              onRemoveChord={handleRemoveChord}
              onAddSection={handleAddSection}
              onRenameSection={handleRenameSection}
              loadedSongId={loadedSongId}
              loadedSongTitle={loadedSongTitle}
              onExitSong={handleExitSong}
              tutorialStepId={activeTutorialStep?.id ?? null}
            />
          </div>
        </div>
        <CreatePageTutorial
          open={isTutorialOpen}
          currentStep={tutorialStepIndex}
          steps={[...tutorialSteps]}
          onClose={handleCloseTutorial}
          onNext={handleNextTutorialStep}
          onPrevious={handlePreviousTutorialStep}
        />
      </div>
    </>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
