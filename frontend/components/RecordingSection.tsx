"use client";

import React, { useEffect, useRef, useState } from "react";
import { url } from "@/lib/utils";
import type {
  DisplayInstrument,
  MidiAnalysis,
  RecommendationLevel,
} from "@/lib/create-page-types";

interface RecordingSectionProps {
  onRecordingAnalyzed?: (analysis: MidiAnalysis) => void;
  displayInstrument: DisplayInstrument;
  recommendationLevel: RecommendationLevel;
  onDisplayInstrumentChange: (instrument: DisplayInstrument) => void;
  onRecommendationLevelChange: (level: RecommendationLevel) => void;
  onStartTutorial?: () => void;
  isTutorialHighlighted?: boolean;
}

export default function RecordingSection({
  onRecordingAnalyzed,
  displayInstrument,
  recommendationLevel,
  onDisplayInstrumentChange,
  onRecommendationLevelChange,
  onStartTutorial,
  isTutorialHighlighted = false,
}: RecordingSectionProps) {
  const TRANSCRIBE_URL = `${url}/transcribe-to-midi`;
  const ANALYZE_URL = `${url}/analyze-midi`;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Draw idle waveform (flat line)
  useEffect(() => {
    if (!isRecording && !audioUrl) {
      drawIdleWaveform();
    }
  }, [isRecording, audioUrl]);

  function drawIdleWaveform() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw flat line
    ctx.beginPath();
    ctx.strokeStyle = getComputedStyle(document.documentElement)
      .getPropertyValue("--muted-foreground")
      .trim() || "#888";
    ctx.lineWidth = 2;
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  }

  function drawLiveWaveform() {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      if (!analyser || !ctx) return;

      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw waveform
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim() || "#8b5cf6";

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    }

    draw();
  }

  async function drawStaticWaveform(blob: Blob) {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const audioContext = new AudioContext();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      const width = canvas.width;
      const height = canvas.height;
      const data = audioBuffer.getChannelData(0);
      const step = Math.ceil(data.length / width);

      ctx.clearRect(0, 0, width, height);
      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.strokeStyle = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim() || "#8b5cf6";

      for (let i = 0; i < width; i++) {
        let min = 1.0;
        let max = -1.0;

        for (let j = 0; j < step; j++) {
          const datum = data[i * step + j];
          if (datum < min) min = datum;
          if (datum > max) max = datum;
        }

        const yMin = ((1 + min) * height) / 2;
        const yMax = ((1 + max) * height) / 2;

        ctx.moveTo(i, yMin);
        ctx.lineTo(i, yMax);
      }

      ctx.stroke();
      audioContext.close();
    } catch (err) {
      console.error("Error drawing static waveform:", err);
      drawIdleWaveform();
    }
  }

  async function startRecording() {
    setError(null);
    setAudioUrl(null);
    setAudioBlob(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up audio context and analyser for visualization
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Start drawing live waveform
      drawLiveWaveform();

      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());

        // Stop animation
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }

        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));

        // Draw static waveform
        drawStaticWaveform(blob);
      };

      mr.start();
      setIsRecording(true);
    } catch {
      setError("Could not access microphone");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return Promise.resolve<Blob | null>(audioBlob);
    }

    return new Promise<Blob | null>((resolve) => {
      const originalOnStop = recorder.onstop;

      recorder.onstop = (event) => {
        originalOnStop?.call(recorder, event);
        const recordedBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        resolve(recordedBlob);
      };

      recorder.stop();
      setIsRecording(false);
    });
  }

  async function convertToMidi(blobOverride?: Blob | null) {
    const blobToConvert = blobOverride ?? audioBlob;
    if (!blobToConvert) return;
    setBusy(true);
    setError(null);

    try {
      const file = new File([blobToConvert], "recording.webm", {
        type: blobToConvert.type || "audio/webm",
      });
      const form = new FormData();
      form.append("file", file);

      const transcribeResp = await fetch(TRANSCRIBE_URL, {
        method: "POST",
        body: form,
      });
      if (!transcribeResp.ok) throw new Error(await transcribeResp.text());

      const midiBlob = await transcribeResp.blob();
      const midiFile = new File([midiBlob], "output.mid", {
        type: "audio/midi",
      });
      const midiForm = new FormData();
      midiForm.append("file", midiFile);

      const analyzeResp = await fetch(ANALYZE_URL, {
        method: "POST",
        body: midiForm,
      });
      if (!analyzeResp.ok) throw new Error(await analyzeResp.text());

      const analysis = await analyzeResp.json();

      if (onRecordingAnalyzed) {
        onRecordingAnalyzed(analysis);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Conversion failed";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function stopAndConvert() {
    const recordedBlob = await stopRecording();
    await convertToMidi(recordedBlob);
  }

  function handleClearRecording() {
    setAudioUrl(null);
    setAudioBlob(null);
    drawIdleWaveform();
  }

  return (
    <div className="flex flex-col">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Recording
        </h2>
        <div className="flex items-center justify-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onStartTutorial}
            data-tutorial="tutorial-launch"
            className={`rounded-lg border px-3 py-2 text-[10px] font-semibold uppercase tracking-wide transition-all sm:text-xs ${
              isTutorialHighlighted
                ? "border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_rgba(59,130,246,0.18)]"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            How to use Chord Monkey
          </button>
          <div className="flex items-center rounded-lg border border-border bg-card p-1 w-fit">
            <div
              data-tutorial="instrument-toggle"
              className="flex items-center rounded-lg"
            >
            <button
              type="button"
              onClick={() => onDisplayInstrumentChange("guitar")}
              className={`rounded-md px-2 py-1 text-[10px] sm:px-3 sm:py-1.5 sm:text-xs font-semibold uppercase tracking-wide transition-colors ${
                displayInstrument === "guitar"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Guitar
            </button>
            <button
              type="button"
              onClick={() => onDisplayInstrumentChange("keyboard")}
              className={`rounded-md px-2 py-1 text-[10px] sm:px-3 sm:py-1.5 sm:text-xs font-semibold uppercase tracking-wide transition-colors ${
                displayInstrument === "keyboard"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Keyboard
            </button>
            </div>
          </div>
          <div
            data-tutorial="mode-toggle"
            className="flex items-center rounded-lg border border-border bg-card p-1 w-fit"
          >
            <button
              type="button"
              onClick={() => onRecommendationLevelChange("beginner")}
              className={`rounded-md px-2 py-1 text-[10px] sm:px-3 sm:py-1.5 sm:text-xs font-semibold uppercase tracking-wide transition-colors ${
                recommendationLevel === "beginner"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Beginner
            </button>
            <button
              type="button"
              onClick={() => onRecommendationLevelChange("advanced")}
              className={`rounded-md px-2 py-1 text-[10px] sm:px-3 sm:py-1.5 sm:text-xs font-semibold uppercase tracking-wide transition-colors ${
                recommendationLevel === "advanced"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Advanced
            </button>
          </div>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        {/* Waveform Display */}
        <div className="bg-muted h-24 rounded-lg mb-5 flex items-center justify-center relative overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={96}
            className="w-full h-full"
          />
          {isRecording && (
            <div className="absolute top-2 left-2 flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs text-muted-foreground">Recording</span>
            </div>
          )}
          {!isRecording && !audioUrl && (
            <span className="absolute top-1/2 -translate-y-5 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
              Press Record to start
            </span>
          )}
        </div>

        {/* Audio Playback */}
        {audioUrl && !isRecording && (
          <div className="flex items-center gap-3 mb-5">
            <audio controls src={audioUrl} className="flex-1 h-10" />
            <button
              onClick={handleClearRecording}
              className="px-3 py-2 text-sm rounded-lg bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Controls */}
        <div
          data-tutorial="recording-controls"
          className="flex justify-center gap-3"
        >
          <button
            onClick={startRecording}
            disabled={isRecording || busy}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-colors ${
              isRecording || busy
                ? "bg-primary/50 text-primary-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            Record
          </button>
          <button
            onClick={stopAndConvert}
            disabled={!isRecording || busy}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-colors ${
              !isRecording || busy
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            {busy ? "Converting..." : "Stop & Convert to MIDI"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 text-center text-sm text-red-500">{error}</div>
        )}
      </div>
    </div>
  );
}
