import type { ConferenceType } from "../types";

export function conferenceLabel(kind?: string | null): string {
  switch (kind) {
    case "zoom":
      return "Zoom";
    case "teams":
      return "Microsoft Teams";
    case "meet":
      return "Google Meet";
    case "webex":
      return "Webex";
    default:
      return "Video call";
  }
}

export function conferenceBadge(kind?: string | null): ConferenceType | "other" {
  if (kind === "zoom" || kind === "teams" || kind === "meet" || kind === "webex") {
    return kind;
  }
  return "other";
}
