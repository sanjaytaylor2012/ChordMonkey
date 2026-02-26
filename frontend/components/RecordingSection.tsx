"use client";

import React, { useRef, useState } from "react";

interface RecordingSectionProps {
  onMidiConverted?: (midiBlob: Blob) => void;
}

export default function RecordingSection({ onMidiConverted }: RecordingSectionProps) {
  const BACKEND_URL = "http://localhost:8000/transcribe-to-midi";

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startRecording() {
    setError(null);
    setAudioUrl(null);
    setAudioBlob(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, {
          type: mr.mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
      };

      mr.start();
      setIsRecording(true);
    } catch (err) {
      setError("Could not access microphone");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  async function convertToMidi() {
    if (!audioBlob) return;
    setBusy(true);
    setError(null);

    try {
      const file = new File([audioBlob], "recording.webm", {
        type: audioBlob.type || "audio/webm",
      });
      const form = new FormData();
      form.append("file", file);

      const resp = await fetch(BACKEND_URL, { method: "POST", body: form });
      if (!resp.ok) throw new Error(await resp.text());

      const midiBlob = await resp.blob();
      
      if (onMidiConverted) {
        onMidiConverted(midiBlob);
      }

      // Download the MIDI file
      const midiUrl = URL.createObjectURL(midiBlob);
      const a = document.createElement("a");
      a.href = midiUrl;
      a.download = "output.mid";
      a.click();
      URL.revokeObjectURL(midiUrl);
    } catch (e: any) {
      setError(e?.message ?? "Conversion failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
        Recording
      </h2>
      <div className="bg-card border border-border rounded-xl p-6">
        {/* Waveform Placeholder */}
        <div className="bg-muted h-16 rounded-lg mb-5 flex items-center justify-center">
          {isRecording ? (
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-recording" />
              <span className="text-sm text-muted-foreground">Recording...</span>
            </div>
          ) : audioUrl ? (
            <audio controls src={audioUrl} className="h-10" />
          ) : (
            <span className="text-sm text-muted-foreground">Audio Waveform Display</span>
          )}
        </div>

        {/* Controls */}
        <div className="flex justify-center gap-3">
          <button
            onClick={startRecording}
            disabled={isRecording}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-colors ${
              isRecording
                ? "bg-primary/50 text-primary-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            Record
          </button>
          <button
            onClick={stopRecording}
            disabled={!isRecording}
            className={`px-6 py-3 rounded-lg font-semibold text-sm transition-colors ${
              !isRecording
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            Stop
          </button>
          <button
            onClick={convertToMidi}
            disabled={!audioBlob || busy}
            className={`px-6 py-3 rounded-lg font-semibold text-sm border-2 transition-colors ${
              !audioBlob || busy
                ? "border-border text-muted-foreground cursor-not-allowed"
                : "border-border text-foreground hover:bg-muted"
            }`}
          >
            {busy ? "Converting..." : "Convert to MIDI"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 text-center text-sm text-red-500">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}