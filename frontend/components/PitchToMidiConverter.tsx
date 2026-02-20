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

  async function start() {
    setErr(null);
    setAudioUrl(null);
    setAudioBlob(null);
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

    try {
      const file = new File([audioBlob], "recording.webm", {
        type: audioBlob.type || "audio/webm",
      });
      const form = new FormData();
      form.append("file", file);

      const resp = await fetch(BACKEND_URL, { method: "POST", body: form });
      if (!resp.ok) throw new Error(await resp.text());

      const midiBlob = await resp.blob();
      const midiUrl = URL.createObjectURL(midiBlob);

      const a = document.createElement("a");
      a.href = midiUrl;
      a.download = "output.mid";
      a.click();

      URL.revokeObjectURL(midiUrl);

      const { key, first } = await analyzeMidiAndGetFirstChord(midiBlob);

      if (first) {
          setFirstChord({
              label: first.chord_name,
              roman: first.roman,
              key,
              pitchClasses: first.pitch_classes,
          });
      }  else {
          setFirstChord(null);
      }

    } catch (e: any) {
      setErr(e?.message ?? "Convert failed");
    } finally {
      setBusy(false);
    }
  }

  async function analyzeMidiAndGetFirstChord(midiBlob: Blob) {
    const midiFile = new File([midiBlob], "output.mid", { type: "audio/midi" });
    const form = new FormData();
    form.append("file", midiFile);

    const resp = await fetch(ANALYZE_URL, { method: "POST", body: form });
    if (!resp.ok) throw new Error(await resp.text());

    const analysis = await resp.json();
    const first = analysis?.events?.[0] ?? null;

    return {
      key: analysis?.key ?? null,
      first, // { chord_name, roman, pitch_classes, offset, duration }
    };
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
