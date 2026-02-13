"use client";

import React, { useRef, useState } from "react";

export default function SimplePitchToMidiRecorder() {
  const BACKEND_URL = "http://localhost:8000/transcribe-to-midi";
  const ANALYZE_URL = "http://localhost:8000/analyze-midi";

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [firstChord, setFirstChord] = useState<string | null>(null);


  async function start() {
    setErr(null);
    setAudioUrl(null);
    setAudioBlob(null);
    setFirstChord(null);
    chunksRef.current = [];

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => {
      if (e.data.size) chunksRef.current.push(e.data);
    };

    mr.onstop = () => {
      // stop mic
      stream.getTracks().forEach((t) => t.stop());

      const blob = new Blob(chunksRef.current, {
        type: mr.mimeType || "audio/webm",
      });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
    };

    mr.start();
  }

  function stop() {
    mediaRecorderRef.current?.stop();
  }

  async function convert() {
    if (!audioBlob) return;
    setBusy(true);
    setErr(null);
    setFirstChord(null);

    try {
      const file = new File([audioBlob], "recording.webm", {
        type: audioBlob.type || "audio/webm",
      });
      const form = new FormData();
      form.append("file", file);

      const resp = await fetch(BACKEND_URL, { method: "POST", body: form });
      if (!resp.ok) throw new Error(await resp.text());

      const midiBlob = await resp.blob();

      // Analyze the MIDI -> get chord JSON (show the first chord)
      const midiFile = new File([midiBlob], "output.mid", { type: "audio/midi" });
      const midiForm = new FormData();
      midiForm.append("file", midiFile);

      const analyzeResp = await fetch(ANALYZE_URL, {
        method: "POST",
        body: midiForm,
      });
      if (!analyzeResp.ok) throw new Error(await analyzeResp.text());

      const analysis = await analyzeResp.json();
      const first = analysis?.events?.[0];

      if (first) {
        setFirstChord(`${first.roman ?? ""} — ${first.chord_name ?? "Unknown"}`);
      } else {
        setFirstChord("No chord events detected.");
      }

      // 3) Download the MIDI
      const midiUrl = URL.createObjectURL(midiBlob);
      const a = document.createElement("a");
      a.href = midiUrl;
      a.download = "output.mid";
      a.click();
      URL.revokeObjectURL(midiUrl);

    } catch (e: any) {
      setErr(e?.message ?? "Convert failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        padding: 12,
        border: "1px solid #ddd",
        borderRadius: 10,
        maxWidth: 420,
      }}
    >
      {firstChord && (
        <div style={{ marginTop: 12 }}>
          <strong>First chord:</strong> {firstChord}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={start}>Record</button>
        <button onClick={stop}>Stop</button>
        <button onClick={convert} disabled={!audioBlob || busy}>
          {busy ? "Converting..." : "Convert to MIDI"}
        </button>
      </div>

      {audioUrl && (
        <div style={{ marginTop: 12 }}>
          <audio controls src={audioUrl} />
        </div>
      )}

      {err && <div style={{ marginTop: 12, color: "crimson" }}>{err}</div>}
    </div>
  );
}
