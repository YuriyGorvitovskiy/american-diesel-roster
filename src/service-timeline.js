import { buildTimelineView } from "./timeline.js?v=count-2";
import { TIMELINE_PATTERN_PALETTE as palette } from "./timeline-palette.js";

const SVG_NS = "http://www.w3.org/2000/svg";

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  return element;
}

function patternId(id) {
  return `service-pattern-${id}`;
}

function addPatterns(svg, ids) {
  const defs = svgElement("defs");
  for (const id of ids) {
    const { colors } = palette[id];
    const pattern = svgElement("pattern", { id: patternId(id), width: 22, height: 22, patternUnits: "userSpaceOnUse", patternTransform: "rotate(35)" });
    pattern.append(
      svgElement("rect", { width: 22, height: 22, fill: colors[0] }),
      svgElement("rect", { width: 11, height: 22, fill: colors[1] }),
    );
    defs.append(pattern);
  }
  svg.append(defs);
}

function addBar(svg, span, y, scale) {
  const rect = svgElement("rect", {
    x: scale(span.start), y, width: Math.max(2, scale(span.end) - scale(span.start)), height: 12,
    rx: 1.5, fill: `url(#${patternId(span.identityId)})`, stroke: "#484941", "stroke-width": .65,
    tabindex: 0, role: "img", "aria-label": span.detail,
  });
  const title = svgElement("title"); title.textContent = span.detail; rect.append(title); svg.append(rect);
}

function legend(entries, hasSpecific, note) {
  const wrapper = document.createElement("div"); wrapper.className = "service-timeline-tools";
  const button = document.createElement("button"); button.type = "button"; button.className = "service-timeline-info";
  button.textContent = "i"; button.setAttribute("aria-label", "Show timeline legend"); button.setAttribute("aria-expanded", "false");
  const popup = document.createElement("div"); popup.className = "service-timeline-legend"; popup.hidden = true;
  for (const { identityId: id, label: identityLabel, operatedCount, productionCount } of entries) {
    const row = document.createElement("div");
    const sample = document.createElement("span"); sample.style.background = `repeating-linear-gradient(125deg, ${palette[id].colors[0]} 0 11px, ${palette[id].colors[1]} 11px 22px)`;
    const count = productionCount ?? operatedCount;
    const label = document.createElement("span"); label.textContent = count == null ? identityLabel : `${identityLabel} — ${count.toLocaleString("en-US")}`;
    row.append(sample, label); popup.append(row);
  }
  if (hasSpecific) {
    const row = document.createElement("div"); row.className = "service-timeline-specific-key";
    const sample = document.createElement("span");
    const label = document.createElement("span"); label.textContent = "Specific historical locomotive";
    row.append(sample, label); popup.append(row);
  }
  const noteElement = document.createElement("p"); noteElement.className = "service-timeline-legend-note"; noteElement.textContent = note;
  popup.append(noteElement);
  button.addEventListener("click", () => {
    popup.hidden = !popup.hidden;
    button.setAttribute("aria-expanded", String(!popup.hidden));
  });
  wrapper.append(button, popup); return wrapper;
}

export function renderServiceTimeline(prototype, historicalLocomotives = []) {
  const view = buildTimelineView(prototype, historicalLocomotives);
  if (!view) return null;
  const width = 760; const left = 8; const right = 8; const axisY = 16; const firstRowY = 28; const rowGap = 15; const groupGap = 7;
  const scale = (year) => left + ((year - view.bounds.start) / (view.bounds.end - view.bounds.start)) * (width - left - right);
  const serviceRows = view.rows.slice(1);
  const serviceStartY = firstRowY + rowGap + groupGap;
  const specificY = serviceStartY + serviceRows.length * rowGap + groupGap + 2;
  const height = view.specific ? specificY + 18 : serviceStartY + serviceRows.length * rowGap + 3;
  const figure = document.createElement("figure"); figure.className = "service-timeline-prototype";
  const svg = svgElement("svg", { viewBox: `0 0 ${width} ${height}`, role: "img", "aria-label": `${prototype.model} manufacturing and BNSF-lineage service timeline` });
  const visibleSpans = [...view.rows, ...(view.specific?.segments ?? [])];
  const usedIds = [...new Set(visibleSpans.map(({ identityId }) => identityId))]; addPatterns(svg, usedIds);
  for (const year of view.ticks) {
    const x = scale(year);
    svg.append(svgElement("line", { x1: x, y1: axisY, x2: x, y2: height - 2, class: "service-timeline-grid" }));
    const label = svgElement("text", { x, y: 10, class: "service-timeline-year", "text-anchor": year === view.bounds.start ? "start" : year === view.bounds.end ? "end" : "middle" });
    label.textContent = year; svg.append(label);
  }
  addBar(svg, view.rows[0], firstRowY, scale);
  serviceRows.forEach((span, index) => addBar(svg, span, serviceStartY + index * rowGap, scale));
  if (view.specific) {
    const first = view.specific.segments[0]; const last = view.specific.segments.at(-1);
    svg.append(svgElement("rect", { x: scale(first.start) - 3, y: specificY - 3, width: scale(last.end) - scale(first.start) + 6, height: 18, rx: 2, class: "service-timeline-specific-frame" }));
    view.specific.segments.forEach((span) => addBar(svg, span, specificY, scale));
  }
  figure.append(svg, legend(view.legend, Boolean(view.specific), view.legendNote)); return figure;
}
