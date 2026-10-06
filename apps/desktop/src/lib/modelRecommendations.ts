import type { HardwareHints } from "../types";

export interface TextModelOption {
  id: string;
  label: string;
  description: string;
  /** Approximate download size for `ollama pull`. */
  downloadGb: number;
  minRamGb: number;
  tier: "light" | "balanced" | "quality";
}

/** Default Ollama model for live + final transcription (audio-capable gemma4 variant). */
export const DEFAULT_SPEECH_MODEL = "gemma4:e4b";

/** Legacy default that is not in the Ollama library — migrate on load. */
export const LEGACY_SPEECH_MODEL = "whisper";

/** Room for a speech model plus general headroom. */
const EXTRA_DISK_RESERVE_GB = 3.5;

export const TEXT_MODEL_OPTIONS: TextModelOption[] = [
  {
    id: "llama3.2:1b",
    label: "Llama 3.2 1B",
    description: "Fastest summaries; fine on 8 GB RAM Macs.",
    downloadGb: 1.3,
    minRamGb: 8,
    tier: "light",
  },
  {
    id: "llama3.2",
    label: "Llama 3.2 3B",
    description: "Good default balance of speed and meeting-note quality.",
    downloadGb: 2.0,
    minRamGb: 8,
    tier: "balanced",
  },
  {
    id: "gemma2:2b",
    label: "Gemma 2 2B",
    description: "Compact Google model; strong for short summaries.",
    downloadGb: 1.6,
    minRamGb: 8,
    tier: "light",
  },
  {
    id: "phi3:mini",
    label: "Phi-3 Mini",
    description: "Small Microsoft model with solid reasoning for its size.",
    downloadGb: 2.3,
    minRamGb: 8,
    tier: "balanced",
  },
  {
    id: "mistral",
    label: "Mistral 7B",
    description: "Higher quality notes; needs more RAM and disk.",
    downloadGb: 4.1,
    minRamGb: 16,
    tier: "quality",
  },
  {
    id: "llama3.1:8b",
    label: "Llama 3.1 8B",
    description: "Best quality in this list; for 16 GB+ Macs with free disk.",
    downloadGb: 4.7,
    minRamGb: 16,
    tier: "quality",
  },
];

function bytesToGb(bytes: number): number {
  return bytes / 1024 ** 3;
}

export function modelsForHardware(hints: HardwareHints): {
  diskGbFree: number;
  ramGbTotal: number;
  fits: TextModelOption[];
  suggested: TextModelOption;
} {
  const diskGbFree = bytesToGb(hints.available_disk_bytes);
  const ramGbTotal = bytesToGb(hints.total_memory_bytes);
  const diskBudget = Math.max(0, diskGbFree - EXTRA_DISK_RESERVE_GB);

  const fits = TEXT_MODEL_OPTIONS.filter(
    (m) => m.downloadGb <= diskBudget && m.minRamGb <= ramGbTotal,
  );

  const suggested =
    fits.find((m) => m.id === "llama3.2") ??
    fits.find((m) => m.tier === "balanced") ??
    fits[0] ??
    TEXT_MODEL_OPTIONS[0];

  return { diskGbFree, ramGbTotal, fits, suggested };
}

export function formatDiskGb(gb: number): string {
  if (gb >= 100) return `${Math.round(gb)} GB`;
  if (gb >= 10) return `${gb.toFixed(0)} GB`;
  return `${gb.toFixed(1)} GB`;
}
