export interface SongSection {
  id: string;
  title: string;
  chords: string[];
}

export interface ChordProgressionProps {
  sections: SongSection[];
  currentSectionIndex: number | null;
  currentChordIndex: number | null;
  onClear: () => void;
  onAddChord: (sectionIndex: number, chord: string) => void;
  onRemoveChord: (sectionIndex: number, chordIndex: number) => void;
  onAddSection: () => void;
  onRenameSection: (sectionIndex: number, title: string) => void;
}
