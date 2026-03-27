"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getChordFrequencies, isPlayableChordSymbol } from "@/lib/chord-audio";
import type { SongSection } from "./types";

export function useChordPlayback(sections: SongSection[] = []) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingSectionIndex, setPlayingSectionIndex] = useState<number | null>(null);
  const [playingChordIndex, setPlayingChordIndex] = useState<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const activeNodesRef = useRef<Array<OscillatorNode | GainNode>>([]);
  const playbackTimersRef = useRef<number[]>([]);

  const flatChords = useMemo(
    () =>
      sections.flatMap((section, sectionIndex) =>
        section.chords.map((chord, chordIndex) => ({
          chord,
          sectionIndex,
          chordIndex,
        }))
      ),
    [sections]
  );

  const hasPlayableChords = flatChords.some(({ chord }) => isPlayableChordSymbol(chord));

  function clearPlaybackTimers() {
    playbackTimersRef.current.forEach((timer) => window.clearTimeout(timer));
    playbackTimersRef.current = [];
  }

  function clearActiveNodes() {
    activeNodesRef.current.forEach((node) => {
      try {
        if ("stop" in node) {
          node.stop();
        } else {
          node.disconnect();
        }
      } catch {
        // Ignore nodes that have already stopped.
      }
    });
    activeNodesRef.current = [];
  }

  function resetPlaybackState() {
    setIsPlaying(false);
    setPlayingSectionIndex(null);
    setPlayingChordIndex(null);
  }

  function stopPlayback() {
    clearPlaybackTimers();
    clearActiveNodes();
    resetPlaybackState();
  }

  useEffect(
    () => () => {
      clearPlaybackTimers();
      clearActiveNodes();
      resetPlaybackState();
    },
    []
  );

  async function ensureAudioContext() {
    if (typeof window === "undefined") {
      return null;
    }

    const AudioContextCtor = window.AudioContext ?? (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;

    if (!AudioContextCtor) {
      return null;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextCtor();
    }

    if (audioContextRef.current.state === "suspended") {
      await audioContextRef.current.resume();
    }

    if (!masterGainRef.current) {
      const masterGain = audioContextRef.current.createGain();
      masterGain.gain.value = 0.9;
      masterGain.connect(audioContextRef.current.destination);
      masterGainRef.current = masterGain;
    }

    return audioContextRef.current;
  }

  function scheduleChord(
    audioContext: AudioContext,
    chord: string,
    startTime: number,
    duration: number
  ) {
    const frequencies = getChordFrequencies(chord);

    if (frequencies.length === 0) {
      return false;
    }

    const masterGain = audioContext.createGain();
    masterGain.connect(masterGainRef.current ?? audioContext.destination);
    masterGain.gain.setValueAtTime(0.0001, startTime);
    masterGain.gain.exponentialRampToValueAtTime(0.55, startTime + 0.02);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    activeNodesRef.current.push(masterGain);

    frequencies.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, startTime);
      gain.gain.setValueAtTime(0.18, startTime);

      oscillator.connect(gain);
      gain.connect(masterGain);

      oscillator.start(startTime + index * 0.02);
      oscillator.stop(startTime + duration);

      activeNodesRef.current.push(oscillator, gain);
    });

    return true;
  }

  async function playChordPreview(chord: string) {
    if (!isPlayableChordSymbol(chord)) {
      return;
    }

    const audioContext = await ensureAudioContext();

    if (!audioContext) {
      return;
    }

    stopPlayback();
    setIsPlaying(true);
    const didSchedule = scheduleChord(audioContext, chord, audioContext.currentTime + 0.03, 1.6);

    if (!didSchedule) {
      resetPlaybackState();
      return;
    }

    const timer = window.setTimeout(() => {
      clearActiveNodes();
      resetPlaybackState();
    }, 1250);
    playbackTimersRef.current.push(timer);
  }

  async function playProgression() {
    const audioContext = await ensureAudioContext();

    if (!audioContext) {
      return;
    }

    stopPlayback();
    setIsPlaying(true);

    const playableChords = flatChords.filter(({ chord }) => isPlayableChordSymbol(chord));
    if (playableChords.length === 0) {
      resetPlaybackState();
      return;
    }

    const stepMs = 950;
    const chordDurationSeconds = 0.9;
    const startTime = audioContext.currentTime + 0.05;

    playableChords.forEach(({ chord, sectionIndex, chordIndex }, index) => {
      scheduleChord(audioContext, chord, startTime + index * chordDurationSeconds, chordDurationSeconds);

      const highlightTimer = window.setTimeout(() => {
        setPlayingSectionIndex(sectionIndex);
        setPlayingChordIndex(chordIndex);
      }, index * stepMs);

      playbackTimersRef.current.push(highlightTimer);
    });

    const finishTimer = window.setTimeout(() => {
      clearActiveNodes();
      resetPlaybackState();
    }, playableChords.length * stepMs + 250);

    playbackTimersRef.current.push(finishTimer);
  }

  return {
    hasPlayableChords,
    isPlaying,
    playbackCursor: {
      sectionIndex: playingSectionIndex,
      chordIndex: playingChordIndex,
    },
    playChordPreview,
    playProgression,
    stopPlayback,
  };
}
