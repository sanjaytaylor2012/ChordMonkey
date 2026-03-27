export type DisplayInstrument = "guitar" | "keyboard";
export type RecommendationLevel = "beginner" | "advanced";

export interface MidiAnalysisEvent {
  symbol?: string;
  pitch_classes?: string[];
}

export interface MidiAnalysis {
  events?: MidiAnalysisEvent[];
}
