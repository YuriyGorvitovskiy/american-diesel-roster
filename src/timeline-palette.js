export const TIMELINE_PATTERN_PALETTE = Object.freeze({
  manufacturing: { label: "Manufacturing", colors: ["#a92f27", "#a92f27"] },
  "great-northern": { label: "Great Northern", colors: ["#255d8f", "#f7f4e9"] },
  "northern-pacific": { label: "Northern Pacific", colors: ["#d7a91e", "#171814"] },
  "chicago-burlington-quincy": { label: "Chicago, Burlington & Quincy", colors: ["#b52d29", "#f7f4e9"] },
  "spokane-portland-seattle": { label: "Spokane, Portland & Seattle", colors: ["#236044", "#e4bd32"] },
  "santa-fe": { label: "Santa Fe / ATSF", colors: ["#20221f", "#f7f4e9"] },
  "burlington-northern": { label: "Burlington Northern", colors: ["#32a852", "#f7f4e9"] },
  bnsf: { label: "BNSF", colors: ["#ef7622", "#171814"] },
});

export function timelinePatternColors(identityId) {
  return TIMELINE_PATTERN_PALETTE[identityId]?.colors ?? null;
}
