"use client";

import { useEffect, useState } from "react";

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
    >
      <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z" />
    </svg>
  );
}

interface SectionEditorProps {
  value: string;
  onCommit: (value: string) => void;
}

export function SectionEditor({ value, onCommit }: SectionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit(nextValue: string) {
    const normalized = nextValue.trim() || value;
    onCommit(normalized);
    setDraft(normalized);
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            commit(draft);
          }
          if (e.key === "Escape") {
            setDraft(value);
            setIsEditing(false);
          }
        }}
        autoFocus
        className="text-base font-normal text-muted-foreground bg-transparent border-b border-primary outline-none px-1"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-2 text-base font-normal text-muted-foreground cursor-pointer hover:text-primary transition-colors group"
      title="Click to edit"
    >
      {value}
      <PencilIcon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </button>
  );
}
