import { TIMELINE_PATTERN_PALETTE } from "./timeline-palette.js";

export function yearFraction(year, bounds) {
  return (year - bounds.start) / (bounds.end - bounds.start);
}

function rowDetail(prototype, span, identityId) {
  const identity = TIMELINE_PATTERN_PALETTE[identityId]?.label ?? identityId;
  return [identity, prototype.model, `${span.approximateStart ? "c. " : ""}${span.start}–${span.end}`]
    .filter(Boolean).join(" · ");
}

function specificView(locomotive) {
  if (!locomotive?.serviceTimeline?.length) return null;
  return {
    locomotiveId: locomotive.id,
    segments: locomotive.serviceTimeline.map((span) => ({
      ...span,
      identityId: span.railroadId,
      detail: `${TIMELINE_PATTERN_PALETTE[span.railroadId]?.label ?? span.railroadId} ${span.roadNumber} · ${span.start}–${span.end}`,
    })),
  };
}

export function buildTimelineView(prototype, historicalLocomotives = []) {
  if (!prototype.timeline?.manufacturing || !prototype.timeline?.lineageService?.length) return null;
  const manufacturing = {
    ...prototype.timeline.manufacturing,
    identityId: "manufacturing",
    detail: ["Manufacturing", prototype.model, `${prototype.timeline.manufacturing.start}–${prototype.timeline.manufacturing.end}`,
      prototype.productionCount != null ? `${prototype.productionCount.toLocaleString("en-US")} built` : null].filter(Boolean).join(" · "),
  };
  const service = prototype.timeline.lineageService.map((span) => ({
    ...span, identityId: span.railroadId, detail: rowDetail(prototype, span, span.railroadId),
  }));
  const specific = specificView(historicalLocomotives.find(({ serviceTimeline }) => serviceTimeline?.length));
  const spans = [manufacturing, ...service, ...(specific?.segments ?? [])];
  const earliest = Math.min(...spans.map(({ start }) => start));
  const latest = Math.max(...spans.map(({ end }) => end));
  const bounds = {
    start: Math.floor((earliest - 2) / 5) * 5,
    end: Math.ceil((latest + 2) / 5) * 5,
  };
  const ticks = [];
  for (let year = bounds.start; year <= bounds.end; year += 10) ticks.push(year);
  const legend = [manufacturing, ...service].map(({ identityId, operatedCount }) => ({
    identityId,
    label: TIMELINE_PATTERN_PALETTE[identityId].label,
    ...(identityId === "manufacturing" && prototype.productionCount != null ? { productionCount: prototype.productionCount } : {}),
    ...(operatedCount != null ? { operatedCount } : {}),
  }));
  return { bounds, ticks, rows: [manufacturing, ...service], specific, legend, legendNote: "Count = locomotives operated" };
}
